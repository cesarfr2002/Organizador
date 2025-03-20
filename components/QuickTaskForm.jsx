import { useState } from 'react';
import { useRouter } from 'next/router';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from '../context/AuthContext';

const priorityOptions = [
  { value: 'high', label: 'Alta', color: 'bg-red-500' },
  { value: 'medium', label: 'Media', color: 'bg-yellow-500' },
  { value: 'low', label: 'Baja', color: 'bg-green-500' }
];

export default function QuickTaskForm({ subjects }) {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date(),
    priority: 'medium',
    subjectId: subjects.length > 0 ? subjects[0]._id : '',
    estimatedTime: 60, // minutos
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, dueDate: date });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Debes iniciar sesión para crear tareas');
      return;
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
        }),
      });

      if (response.ok) {
        router.push('/tasks');
      } else {
        const error = await response.json();
        alert(`Error al crear la tarea: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al guardar la tarea');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Agregar Tarea Rápida</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Título
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={3}
          ></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha límite
            </label>
            <DatePicker
              selected={formData.dueDate}
              onChange={handleDateChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              dateFormat="dd/MM/yyyy"
              minDate={new Date()}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Hora"
              placeholderText="Selecciona una fecha y hora"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prioridad
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Asignatura
            </label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tiempo estimado (min)
            </label>
            <input
              type="number"
              name="estimatedTime"
              value={formData.estimatedTime}
              onChange={handleChange}
              min="5"
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Guardar Tarea
          </button>
        </div>
      </form>
    </div>
  );
}
