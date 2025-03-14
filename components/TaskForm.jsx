import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';
import StudyTimeDisplay from './StudyTimeDisplay';

// Registrar el locale español
registerLocale('es', es);

export default function TaskForm({ task, subjects, isEditing = false }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'tarea',
    priority: 'Media',
    status: 'pendiente',
    subject: '',
    dueDate: null,
    difficulty: 'media',
    estimatedTime: 0,
    weight: 0,
    tags: [],
    relatedNotes: [], // Nuevo campo para las notas relacionadas
    examDetails: {
      topics: [],
      duration: 60,
      allowedMaterials: '',
      location: ''
    },
    projectDetails: {
      objectives: [],
      deliverables: [],
      guidelines: '',
      groupWork: false,
      groupMembers: []
    },
    readingDetails: {
      pages: '',
      source: '',
      url: ''
    },
    presentationDetails: {
      duration: 15,
      audience: '',
      visualAids: true
    }
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Nuevo estado para las notas disponibles
  const [availableNotes, setAvailableNotes] = useState([]);

  useEffect(() => {
    if (task) {
      setFormData({
        ...formData,
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        relatedNotes: task.relatedNotes || []
      });
    }

    // Cargar las notas disponibles
    fetchNotes();
  }, [task]);

  // Función para cargar las notas
  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      if (res.ok) {
        const data = await res.json();
        setAvailableNotes(data);
      } else {
        console.error('Error fetching notes:', await res.text());
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value ? parseInt(value) : ''
    });
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      dueDate: date
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== '') {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (index) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      tags: newTags
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/tasks${isEditing ? `/${task._id}` : ''}`, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(`Tarea ${isEditing ? 'actualizada' : 'creada'} con éxito`);
        router.push('/tasks');
      } else {
        throw new Error('Error al guardar la tarea');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Error al guardar la tarea');
    } finally {
      setLoading(false);
    }
  };

  // Define preset time options
  const timePresets = [
    { value: 15, label: '15 minutos' },
    { value: 30, label: '30 minutos' },
    { value: 45, label: '45 minutos' },
    { value: 60, label: '1 hora' },
    { value: 90, label: '1 hora 30 min' },
    { value: 120, label: '2 horas' },
    { value: 180, label: '3 horas' },
    { value: 240, label: '4 horas' },
    { value: 300, label: '5 horas' },
  ];

  // Función para manejar la selección/deselección de notas
  const handleNoteToggle = (noteId) => {
    setFormData(prev => {
      const currentNotes = prev.relatedNotes || [];
      if (currentNotes.includes(noteId)) {
        return {
          ...prev,
          relatedNotes: currentNotes.filter(id => id !== noteId)
        };
      } else {
        return {
          ...prev,
          relatedNotes: [...currentNotes, noteId]
        };
      }
    });
  };

  // Renderizar los campos específicos según el tipo de tarea
  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'examen':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temas
              </label>
              <input
                type="text"
                name="examDetails.topics"
                value={formData.examDetails.topics.join(', ')}
                onChange={(e) => handleChange({
                  target: {
                    name: 'examDetails.topics',
                    value: e.target.value.split(',').map(topic => topic.trim())
                  }
                })}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Temas del examen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (minutos)
              </label>
              <input
                type="number"
                name="examDetails.duration"
                value={formData.examDetails.duration}
                onChange={handleNumberInput}
                className="w-full border border-gray-300 rounded-md p-2"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materiales permitidos
              </label>
              <input
                type="text"
                name="examDetails.allowedMaterials"
                value={formData.examDetails.allowedMaterials}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Materiales permitidos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                name="examDetails.location"
                value={formData.examDetails.location}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Ubicación del examen"
              />
            </div>
          </div>
        );
      case 'proyecto':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objetivos
              </label>
              <input
                type="text"
                name="projectDetails.objectives"
                value={formData.projectDetails.objectives.join(', ')}
                onChange={(e) => handleChange({
                  target: {
                    name: 'projectDetails.objectives',
                    value: e.target.value.split(',').map(obj => obj.trim())
                  }
                })}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Objetivos del proyecto"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entregables
              </label>
              <input
                type="text"
                name="projectDetails.deliverables"
                value={formData.projectDetails.deliverables.join(', ')}
                onChange={(e) => handleChange({
                  target: {
                    name: 'projectDetails.deliverables',
                    value: e.target.value.split(',').map(del => del.trim())
                  }
                })}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Entregables del proyecto"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Directrices
              </label>
              <textarea
                name="projectDetails.guidelines"
                value={formData.projectDetails.guidelines}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Directrices del proyecto"
              ></textarea>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trabajo en grupo
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="projectDetails.groupWork"
                  checked={formData.projectDetails.groupWork}
                  onChange={(e) => handleChange({
                    target: {
                      name: 'projectDetails.groupWork',
                      value: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Sí</span>
              </div>
            </div>
            {formData.projectDetails.groupWork && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Integrantes del grupo
                </label>
                <input
                  type="text"
                  name="projectDetails.groupMembers"
                  value={formData.projectDetails.groupMembers.join(', ')}
                  onChange={(e) => handleChange({
                    target: {
                      name: 'projectDetails.groupMembers',
                      value: e.target.value.split(',').map(member => member.trim())
                    }
                  })}
                  className="w-full border border-gray-300 rounded-md p-2"
                  placeholder="Integrantes del grupo"
                />
              </div>
            )}
          </div>
        );
      case 'lectura':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Páginas
              </label>
              <input
                type="text"
                name="readingDetails.pages"
                value={formData.readingDetails.pages}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Páginas a leer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fuente
              </label>
              <input
                type="text"
                name="readingDetails.source"
                value={formData.readingDetails.source}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Fuente de la lectura"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="text"
                name="readingDetails.url"
                value={formData.readingDetails.url}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="URL de la lectura"
              />
            </div>
          </div>
        );
      case 'presentacion':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración (minutos)
              </label>
              <input
                type="number"
                name="presentationDetails.duration"
                value={formData.presentationDetails.duration}
                onChange={handleNumberInput}
                className="w-full border border-gray-300 rounded-md p-2"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audiencia
              </label>
              <input
                type="text"
                name="presentationDetails.audience"
                value={formData.presentationDetails.audience}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Audiencia de la presentación"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ayudas visuales
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="presentationDetails.visualAids"
                  checked={formData.presentationDetails.visualAids}
                  onChange={(e) => handleChange({
                    target: {
                      name: 'presentationDetails.visualAids',
                      value: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-600">Sí</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <h2 className="text-xl font-bold mb-6 dark:text-white">
            {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                placeholder="Título de la tarea"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo de tarea
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="tarea">Tarea</option>
                <option value="examen">Examen</option>
                <option value="proyecto">Proyecto</option>
                <option value="lectura">Lectura</option>
                <option value="presentacion">Presentación</option>
                <option value="laboratorio">Laboratorio</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Asignatura
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">-- Seleccionar asignatura --</option>
                {subjects?.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prioridad
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En progreso</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de entrega
              </label>
              <DatePicker
                selected={formData.dueDate}
                onChange={handleDateChange}
                className="w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                dateFormat="dd/MM/yyyy"
                locale="es"
                placeholderText="Seleccionar fecha"
                isClearable
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dificultad
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="fácil">Fácil</option>
                <option value="media">Media</option>
                <option value="difícil">Difícil</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tiempo estimado
              </label>
              
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {timePresets.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFormData({...formData, estimatedTime: preset.value})}
                    className={`py-2 px-3 text-sm rounded-md ${
                      formData.estimatedTime === preset.value
                        ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                
                <div className="col-span-3 sm:col-span-4 md:col-span-5 mt-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Tiempo personalizado (minutos):
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="estimatedTime"
                    value={formData.estimatedTime}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Peso en la nota final (%)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleNumberInput}
                className="w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                min="0"
                max="100"
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Detalles adicionales de la tarea..."
            ></textarea>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Etiquetas
            </label>
            <div className="flex">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 border border-gray-300 rounded-l-md p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Añadir etiqueta..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="bg-gray-700 text-white px-4 rounded-r-md hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500"
              >
                +
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1 rounded-full flex items-center"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="ml-1 text-blue-800 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sección de notas relacionadas */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2 dark:text-white">Notas relacionadas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Selecciona las notas que estén relacionadas con esta tarea para acceder rápidamente al material de estudio.
            </p>
            
            {availableNotes.length > 0 ? (
              <div className="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                {availableNotes.map(note => (
                  <div key={note._id} className="flex items-center py-1 border-b border-gray-100 dark:border-gray-700">
                    <input
                      type="checkbox"
                      id={`note-${note._id}`}
                      checked={formData.relatedNotes?.includes(note._id)}
                      onChange={() => handleNoteToggle(note._id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700"
                    />
                    <label htmlFor={`note-${note._id}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {note.title}
                      {note.subject && typeof note.subject === 'object' && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          ({note.subject.name})
                        </span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                No hay notas disponibles. <button type="button" onClick={() => router.push('/notes/new')} className="text-blue-600 hover:underline">Crear una nota</button>
              </div>
            )}
          </div>
          
          {renderTypeSpecificFields()}
          
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                isEditing ? 'Actualizar Tarea' : 'Crear Tarea'
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        {isEditing && task && <StudyTimeDisplay task={task} />}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-3 dark:text-white">
            {isEditing ? 'Consejos para completar la tarea' : 'Consejos para organizar tus tareas'}
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Prioriza tus tareas basándote en su fecha de entrega y dificultad</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Divide tareas grandes en pasos más pequeños y manejables</span>
            </li>
            <li className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Utiliza la técnica Pomodoro para mantener la concentración</span>
            </li>
          </ul>
          {!isEditing && (
            <div className="mt-4 text-center">
              <a 
                href="/pomodoro" 
                className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ir al temporizador Pomodoro
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}