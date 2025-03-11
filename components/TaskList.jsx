import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function TaskList({ tasks = [], onTaskUpdate }) {
  const [loading, setLoading] = useState(false);

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800'; // Alta
      case 2: return 'bg-yellow-100 text-yellow-800'; // Media
      case 3: return 'bg-green-100 text-green-800'; // Baja
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 1: return 'Alta';
      case 2: return 'Media';
      case 3: return 'Baja';
      default: return 'Normal';
    }
  };

  const formatDueDate = (date) => {
    if (!date) return 'Sin fecha';
    return format(new Date(date), 'dd MMM yyyy', { locale: es });
  };

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      if (res.ok) {
        toast.success(`Tarea ${!currentStatus ? 'completada' : 'marcada como pendiente'}`);
        if (onTaskUpdate) onTaskUpdate();
      } else {
        throw new Error('Error actualizando la tarea');
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast.error('No se pudo actualizar el estado de la tarea');
    } finally {
      setLoading(false);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 mb-4">No hay tareas pendientes</p>
        <Link href="/tasks/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Crear nueva tarea
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {tasks.map((task) => (
          <li key={task._id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTaskCompletion(task._id, task.completed)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <div>
                  <h3 className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  
                  <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                    {task.subject && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs" 
                        style={{ 
                          backgroundColor: `${task.subject.color}20`, 
                          color: task.subject.color 
                        }}>
                        {task.subject.name}
                      </span>
                    )}
                    
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${getPriorityClass(task.priority)}`}>
                      {getPriorityText(task.priority)}
                    </span>
                    
                    <span>
                      Vence: {formatDueDate(task.dueDate)}
                    </span>
                  </div>
                  
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>
              
              <Link 
                href={`/tasks/${task._id}/edit`} 
                className="ml-2 text-gray-400 hover:text-blue-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
            </div>
          </li>
        ))}
      </ul>
      
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-right">
        <Link href="/tasks/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nueva tarea
        </Link>
      </div>
    </div>
  );
}
