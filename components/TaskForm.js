import { useState, useEffect } from 'react';
import { format, parseISO, parse, addHours } from 'date-fns';
import { toast } from 'react-toastify';

// Offset de Bogotá es UTC-5
const BOGOTA_OFFSET = -5;

export default function TaskForm({ initialData = {}, onSubmit, submitText = "Guardar", isLoading = false }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Media',
    status: 'pendiente',
    subject: '',
    dueDate: '',
    estimatedTime: 30,
    type: 'tarea',
    ...initialData
  });
  
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Cargar asignaturas al montar el componente
  useEffect(() => {
    fetchSubjects();
  }, []);

  // Formatear la fecha para el input date cuando hay datos iniciales
  useEffect(() => {
    if (initialData && initialData.dueDate) {
      try {
        // Ajustar la fecha UTC a la zona horaria de Bogotá manualmente
        const date = parseISO(initialData.dueDate);
        // Compensamos la diferencia horaria para asegurar que se muestra el día correcto
        const bogotaDate = addHours(date, -BOGOTA_OFFSET);
        
        if (!isNaN(bogotaDate.getTime())) {
          setFormData(prev => ({
            ...prev,
            dueDate: format(bogotaDate, 'yyyy-MM-dd')
          }));
        }
      } catch (error) {
        console.error("Error formateando fecha:", error);
      }
    }
  }, [initialData]);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      } else {
        console.error('Error fetching subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error al cargar las asignaturas');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const adjustTime = (amount) => {
    setFormData(prev => ({
      ...prev,
      estimatedTime: Math.max(0, (parseInt(prev.estimatedTime) || 0) + amount)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Crear una copia del formData para ajustar la fecha
    const formDataToSubmit = { ...formData };
    
    // Si hay una fecha establecida, ajustarla para la zona horaria de Bogotá
    if (formDataToSubmit.dueDate) {
      try {
        // Crear una fecha a las 12 del mediodía
        const dateString = `${formDataToSubmit.dueDate}T12:00:00`;
        const localDate = parse(dateString, "yyyy-MM-dd'T'HH:mm:ss", new Date());
        
        // Ajustar a UTC considerando la zona horaria de Bogotá
        const utcDate = addHours(localDate, BOGOTA_OFFSET);
        formDataToSubmit.dueDate = utcDate.toISOString();
      } catch (error) {
        console.error("Error al procesar la fecha:", error);
        toast.error("Error al procesar la fecha");
      }
    }
    
    onSubmit(formDataToSubmit);
  };

  const timePresets = [
    { label: '15m', value: 15 },
    { label: '30m', value: 30 },
    { label: '1h', value: 60 },
    { label: '2h', value: 120 }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título y tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Escribe el título de la tarea"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de tarea
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="tarea">Tarea general</option>
            <option value="examen">Examen</option>
            <option value="proyecto">Proyecto</option>
            <option value="lectura">Lectura</option>
            <option value="presentación">Presentación</option>
            <option value="trabajo">Trabajo grupal</option>
            <option value="practica">Práctica</option>
          </select>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Añade detalles sobre la tarea"
        />
      </div>

      {/* Asignatura y prioridad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Asignatura
          </label>
          {loadingSubjects ? (
            <div className="mt-1 block w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          ) : (
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">Seleccionar asignatura</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Prioridad
          </label>
          <div className="mt-1 flex space-x-2">
            <label className={`flex-1 flex items-center justify-center py-2 border rounded-md cursor-pointer text-sm ${formData.priority === 'Alta' ? 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200' : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}>
              <input
                type="radio"
                name="priority"
                value="Alta"
                checked={formData.priority === 'Alta'}
                onChange={handleChange}
                className="sr-only"
              />
              Alta
            </label>
            <label className={`flex-1 flex items-center justify-center py-2 border rounded-md cursor-pointer text-sm ${formData.priority === 'Media' ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900 dark:border-amber-700 dark:text-amber-200' : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}>
              <input
                type="radio"
                name="priority"
                value="Media"
                checked={formData.priority === 'Media'}
                onChange={handleChange}
                className="sr-only"
              />
              Media
            </label>
            <label className={`flex-1 flex items-center justify-center py-2 border rounded-md cursor-pointer text-sm ${formData.priority === 'Baja' ? 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-200' : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}`}>
              <input
                type="radio"
                name="priority"
                value="Baja"
                checked={formData.priority === 'Baja'}
                onChange={handleChange}
                className="sr-only"
              />
              Baja
            </label>
          </div>
        </div>
      </div>

      {/* Fecha límite y estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha límite
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En progreso</option>
            <option value="completed">Completada</option>
          </select>
        </div>
      </div>

      {/* Tiempo estimado */}
      <div>
        <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tiempo estimado (minutos)
          <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">para auto-programación</span>
        </label>
        
        <div className="flex items-center space-x-2">
          <button 
            type="button"
            onClick={() => adjustTime(-15)}
            className="p-1 rounded-full border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <input
            type="number"
            id="estimatedTime"
            name="estimatedTime"
            min="0"
            step="5"
            value={formData.estimatedTime || 0}
            onChange={handleChange}
            className="block w-20 text-center border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          
          <button 
            type="button"
            onClick={() => adjustTime(15)}
            className="p-1 rounded-full border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
          
          <div className="flex ml-4 space-x-2">
            {timePresets.map(preset => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, estimatedTime: preset.value }))}
                className={`px-3 py-1 text-xs rounded-full ${
                  parseInt(formData.estimatedTime) === preset.value
                    ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-800 dark:text-blue-100'
                    : 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300'
                } border`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Agrega un tiempo estimado para que esta tarea pueda ser programada automáticamente
        </p>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </>
          ) : (
            submitText
          )}
        </button>
      </div>
    </form>
  );
}