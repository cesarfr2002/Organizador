import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

export default function ResourceForm({ subjectId, resource = null, onSuccess, onCancel, subjects = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'link',
    url: '',
    subject: subjectId || '',
    tags: [],
    important: false,
    fileUrl: '',
    fileName: ''
  });
  
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMode, setUploadMode] = useState('link'); // 'link' o 'file'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileInfo, setFileInfo] = useState(null);
  const fileInputRef = useRef(null);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  
  // Si estamos editando, cargar los datos del recurso
  useEffect(() => {
    if (resource) {
      setFormData({
        title: resource.title || '',
        description: resource.description || '',
        type: resource.type || 'link',
        url: resource.url || '',
        subject: resource.subject || '',
        tags: resource.tags || [],
        important: resource.important || false,
        fileUrl: resource.fileUrl || '',
        fileName: resource.fileName || ''
      });
      
      // Cargar las tareas relacionadas si el recurso ya existe
      if (resource.relatedTasks && resource.relatedTasks.length > 0) {
        setSelectedTasks(resource.relatedTasks);
      }
      
      // Determinar si es un enlace o un archivo
      if (resource.fileUrl) {
        setUploadMode('file');
      }
    }
    
    // Cargar las tareas disponibles
    fetchAvailableTasks();
  }, [resource]);
  
  // Función para cargar las tareas disponibles
  const fetchAvailableTasks = async () => {
    try {
      const res = await fetch('/api/tasks?completed=false');
      if (res.ok) {
        const data = await res.json();
        setAvailableTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };
  
  // Función para manejar la selección/deselección de tareas
  const handleTaskSelection = (taskId) => {
    setSelectedTasks(prev => {
      if (prev.includes(taskId)) {
        return prev.filter(id => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleTypeChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      type: value
    }));
  };
  
  const handleUploadModeChange = (mode) => {
    setUploadMode(mode);
    // Resetear valores relacionados con el otro modo
    if (mode === 'link') {
      setFormData(prev => ({
        ...prev,
        fileUrl: '',
        fileName: ''
      }));
      setFileInfo(null);
    } else {
      setFormData(prev => ({
        ...prev,
        url: ''
      }));
    }
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tamaño máximo (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('El archivo es demasiado grande. El límite es 20MB.');
      e.target.value = null;
      return;
    }
    
    // Mostrar información del archivo
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type
    });
    
    // Subir el archivo
    await uploadFile(file);
  };
  
  const uploadFile = async (file) => {
    setLoading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Subir el archivo con seguimiento de progreso
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      const response = await new Promise((resolve, reject) => {
        xhr.open('POST', '/api/resources/upload');
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Error en la subida del archivo'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Error de red'));
        xhr.send(formData);
      });
      
      // Actualizar el estado con la información del archivo subido
      setFormData(prev => ({
        ...prev,
        url: response.resourceUrl, // Usamos la misma URL para mantener compatibilidad
        fileUrl: response.resourceUrl,
        fileName: response.originalName
      }));
      
      // Mostrar información sobre la compresión si fue aplicada
      if (response.wasCompressed) {
        toast.success(`Archivo comprimido: ${response.compressionRate}% de reducción`);
      } else {
        toast.success('Archivo subido correctamente');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Error al subir el archivo');
      toast.error('Error al subir el archivo');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const handleAddTag = (e) => {
    e.preventDefault();
    
    if (!tagInput.trim()) return;
    
    // Evitar duplicados
    if (!formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
    }
    
    setTagInput('');
  };
  
  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };
  
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('El título es obligatorio');
      return false;
    }
    
    if (uploadMode === 'link' && !formData.url.trim()) {
      setError('La URL es obligatoria cuando se selecciona enlace');
      return false;
    }
    
    if (uploadMode === 'file' && !formData.fileUrl) {
      setError('Debes subir un archivo');
      return false;
    }
    
    setError('');
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const url = resource 
        ? `/api/resources/${resource._id}` 
        : `/api/subjects/${formData.subject}/resources`;
      
      const method = resource ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar el recurso');
      }
      
      const result = await res.json();
      toast.success(resource ? 'Recurso actualizado correctamente' : 'Recurso creado correctamente');
      
      // Si se guardó correctamente el recurso, actualizar las tareas relacionadas
      if (result && result._id) {
        try {
          await fetch(`/api/resources/${result._id}/tasks`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              taskIds: selectedTasks
            })
          });
        } catch (error) {
          console.error('Error updating related tasks:', error);
        }
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving resource:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b px-6 py-4">
        <h3 className="text-lg font-medium">
          {resource ? 'Editar recurso' : 'Agregar nuevo recurso'}
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título *
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descripción
            </label>
            <textarea
              name="description"
              id="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de recurso */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Tipo de recurso
              </label>
              <select
                name="type"
                id="type"
                value={formData.type}
                onChange={handleTypeChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="link">Enlace</option>
                <option value="pdf">PDF</option>
                <option value="slides">Diapositivas</option>
                <option value="video">Video</option>
                <option value="document">Documento</option>
                <option value="image">Imagen</option>
                <option value="other">Otro</option>
              </select>
            </div>
            
            {/* Marca como importante */}
            <div className="flex items-center h-full mt-6">
              <input
                type="checkbox"
                name="important"
                id="important"
                checked={formData.important}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="important" className="ml-2 block text-sm text-gray-900">
                Marcar como importante
              </label>
            </div>
          </div>
          
          {/* Selector de modo: enlace o archivo */}
          <div>
            <div className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de recurso
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button
                type="button"
                onClick={() => handleUploadModeChange('link')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded ${
                  uploadMode === 'link'
                    ? 'bg-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Enlace externo
              </button>
              <button
                type="button"
                onClick={() => handleUploadModeChange('file')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded ${
                  uploadMode === 'file'
                    ? 'bg-white shadow'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                Subir archivo
              </button>
            </div>
          </div>
          
          {/* URL o subida de archivo según el modo */}
          {uploadMode === 'link' ? (
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                URL o enlace *
              </label>
              <input
                type="text"
                name="url"
                id="url"
                value={formData.url}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Archivo *
              </label>
              
              {!fileInfo ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                      >
                        <span>Subir un archivo</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">o arrastra y suelta</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, PowerPoint, Word, Excel, imágenes, etc. Máx. 20MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-1 p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{fileInfo.name}</p>
                      <p className="text-sm text-gray-500">{fileInfo.size}</p>
                    </div>
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => {
                        setFileInfo(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                        setFormData(prev => ({
                          ...prev,
                          fileUrl: '',
                          fileName: ''
                        }));
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 text-right mt-1">{uploadProgress}% completado</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Agregar selector de materia si no hay una preseleccionada */}
          {subjects.length > 0 && (
            <div className="mb-4">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                Asignatura *
              </label>
              <select
                name="subject"
                id="subject"
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="" disabled>Selecciona una asignatura</option>
                {subjects.map(subject => (
                  <option key={subject._id} value={subject._id}>{subject.name}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Etiquetas */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Etiquetas
            </label>
            
            <div className="flex">
              <input
                type="text"
                id="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-grow border border-gray-300 rounded-l-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Agregar etiqueta"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
            
            {/* Lista de etiquetas */}
            {formData.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1.5 inline-flex text-blue-400 hover:text-blue-600 focus:outline-none"
                    >
                      <span className="sr-only">Eliminar etiqueta</span>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Selector de tareas relacionadas - nueva sección */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tareas relacionadas
            </label>
            <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
              {availableTasks.length > 0 ? (
                <div className="space-y-2">
                  {availableTasks.map(task => (
                    <div key={task._id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`task-${task._id}`}
                        checked={selectedTasks.includes(task._id)}
                        onChange={() => handleTaskSelection(task._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`task-${task._id}`} className="ml-2 block cursor-pointer">
                        <div className="font-medium">{task.title}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.subject && (
                            <span 
                              className="px-2 py-0.5 text-xs rounded-full" 
                              style={{ 
                                backgroundColor: `${task.subject.color}20`,
                                color: task.subject.color 
                              }}
                            >
                              {task.subject.name}
                            </span>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No hay tareas disponibles</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
