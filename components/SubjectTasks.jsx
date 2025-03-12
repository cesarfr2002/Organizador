import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { formatDistanceToNow, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

export default function SubjectTasks({ subject }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'completed'
  const router = useRouter();

  useEffect(() => {
    if (subject && subject._id) {
      fetchTasks();
    }
  }, [subject, filter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subjects/${subject._id}/tasks?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        throw new Error('Error al obtener las tareas');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PUT'
      });
      
      if (res.ok) {
        fetchTasks();
        toast.success('¡Tarea completada!');
      } else {
        throw new Error('Error al actualizar la tarea');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error al actualizar la tarea');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      return;
    }
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchTasks();
        toast.success('Tarea eliminada correctamente');
      } else {
        throw new Error('Error al eliminar la tarea');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error al eliminar la tarea');
    }
  };

  // Obtener el color según prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Alta': return 'text-red-600 bg-red-100';
      case 'Media': return 'text-amber-600 bg-amber-100';
      case 'Baja': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Función para formatear la fecha de entrega
  const formatDueDate = (dateString) => {
    if (!dateString) return 'Sin fecha límite';
    
    const date = new Date(dateString);
    
    // Si la fecha ya pasó
    if (isPast(date) && date.toDateString() !== new Date().toDateString()) {
      return (
        <span className="text-red-600 font-medium">
          Atrasada ({formatDistanceToNow(date, { addSuffix: true, locale: es })})
        </span>
      );
    }
    
    // Para el resto de casos
    return (
      <span>
        {formatDistanceToNow(date, { addSuffix: true, locale: es })}
      </span>
    );
  };

  if (!subject || !subject._id) {
    return (
      <div className="text-center py-10">
        <p>Selecciona una materia para ver sus tareas</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Tareas para {subject.name}</h2>
        <button
          onClick={() => router.push(`/tasks/new?subject=${subject._id}`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center transition"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m6 0H6" />
          </svg>
          Nueva tarea
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 text-sm rounded-full ${
            filter === 'pending'
              ? 'bg-blue-100 text-blue-800 border-blue-300'
              : 'bg-gray-100 text-gray-800 border-gray-300'
          } border`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1 text-sm rounded-full ${
            filter === 'completed'
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-gray-100 text-gray-800 border-gray-300'
          } border`}
        >
          Completadas
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-sm rounded-full ${
            filter === 'all'
              ? 'bg-purple-100 text-purple-800 border-purple-300'
              : 'bg-gray-100 text-gray-800 border-gray-300'
          } border`}
        >
          Todas
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white h-24 rounded-lg shadow"></div>
          ))}
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-4">
          {tasks.map(task => (
            <div
              key={task._id}
              className={`bg-white rounded-lg shadow p-4 ${
                task.completed ? 'bg-gray-50 border-l-4 border-green-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {!task.completed && (
                  <button
                    onClick={() => handleCompleteTask(task._id)}
                    className="mt-1 h-6 w-6 rounded-full border-2 border-gray-300 hover:border-green-500 flex-shrink-0"
                    title="Marcar como completada"
                  ></button>
                )}
                
                <div className="flex-grow min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.type && (
                      <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                        {task.type}
                      </span>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className={`text-sm mb-3 ${task.completed ? 'text-gray-500' : 'text-gray-700'}`}>
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-x-4 text-sm text-gray-600">
                    {task.dueDate && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDueDate(task.dueDate)}
                      </div>
                    )}
                    
                    {task.completed && task.completedAt && (
                      <div className="flex items-center text-green-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Completada {formatDistanceToNow(new Date(task.completedAt), { addSuffix: true, locale: es })}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/tasks/${task._id}/edit`)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-full"
                    title="Editar tarea"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task._id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full"
                    title="Eliminar tarea"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No hay tareas</h3>
          <p className="mt-1 text-gray-500">
            {filter === 'all' 
              ? 'No hay tareas creadas para esta materia.' 
              : filter === 'completed' 
                ? 'No hay tareas completadas para esta materia.' 
                : 'No hay tareas pendientes para esta materia.'
            }
          </p>
          <div className="mt-6">
            <button
              onClick={() => router.push(`/tasks/new?subject=${subject._id}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-5 h-5 mr-2 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Crear una tarea
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
