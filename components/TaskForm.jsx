import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { toast } from 'react-toastify';

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

  useEffect(() => {
    if (task) {
      setFormData({
        ...formData,
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate) : null
      });
    }
  }, [task]);

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">
        {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
      </h2>
      
      <form onSubmit={handleSubmit}>
        {/* Campos básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Título */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
              placeholder="Título de la tarea"
            />
          </div>
          
          {/* Tipo de tarea */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de tarea
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
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
          
          {/* Asignatura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asignatura
            </label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="">-- Seleccionar asignatura --</option>
              {subjects?.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
          
          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="pendiente">Pendiente</option>
              <option value="en_progreso">En progreso</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          
          {/* Fecha de entrega */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de entrega
            </label>
            <DatePicker
              selected={formData.dueDate}
              onChange={handleDateChange}
              className="w-full border border-gray-300 rounded-md p-2"
              dateFormat="dd/MM/yyyy"
              locale="es"
              placeholderText="Seleccionar fecha"
              isClearable
            />
          </div>
          
          {/* Dificultad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dificultad
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
            >
              <option value="fácil">Fácil</option>
              <option value="media">Media</option>
              <option value="difícil">Difícil</option>
            </select>
          </div>
          
          {/* Tiempo estimado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiempo estimado (minutos)
            </label>
            <input
              type="number"
              name="estimatedTime"
              value={formData.estimatedTime}
              onChange={handleNumberInput}
              className="w-full border border-gray-300 rounded-md p-2"
              min="0"
            />
          </div>
          
          {/* Peso en la calificación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Peso en la nota final (%)
            </label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleNumberInput}
              className="w-full border border-gray-300 rounded-md p-2"
              min="0"
              max="100"
            />
          </div>
        </div>
        
        {/* Descripción */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full border border-gray-300 rounded-md p-2"
            placeholder="Detalles adicionales de la tarea..."
          ></textarea>
        </div>
        
        {/* Etiquetas */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Etiquetas
          </label>
          <div className="flex">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 border border-gray-300 rounded-l-md p-2"
              placeholder="Añadir etiqueta..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="bg-gray-700 text-white px-4 rounded-r-md hover:bg-gray-800"
            >
              +
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="ml-1 text-blue-800 hover:text-blue-900"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Campos específicos según el tipo de tarea */}
        {renderTypeSpecificFields()}
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
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
  );
}