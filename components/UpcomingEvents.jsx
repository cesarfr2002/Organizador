import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { formatDistanceToNow, isPast, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

export default function UpcomingEvents() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'today', 'week', 'priority'
  const router = useRouter();

  // Cargar las tareas cuando se monta el componente
  useEffect(() => {
    fetchPendingTasks();
  }, []);

  // Función para obtener las tareas pendientes
  const fetchPendingTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks/pending');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        throw new Error('Error al obtener las tareas pendientes');
      }
    } catch (error) {
      console.error('Error fetching pending tasks:', error);
      toast.error('Error al cargar las tareas pendientes');
    } finally {
      setLoading(false);
    }
  };

  // Función para marcar una tarea como completada
  const markAsCompleted = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PUT',
      });

      if (res.ok) {
        // Actualizar la lista de tareas localmente
        setTasks(tasks.filter(task => task._id !== taskId));
        toast.success('¡Tarea completada!');
      } else {
        throw new Error('Error al completar la tarea');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Error al completar la tarea');
    }
  };

  // Función para filtrar las tareas según el filtro seleccionado
  const filteredTasks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return tasks.filter(task => {
      if (!task.dueDate) return filter === 'all' || filter === 'priority';
      
      const dueDate = new Date(task.dueDate);
      
      switch (filter) {
        case 'today':
          return dueDate.toDateString() === today.toDateString();
        case 'week':
          return dueDate >= today && dueDate <= nextWeek;
        case 'priority':
          // Prioridad alta o fecha de entrega cercana
          return task.priority === 'Alta' || 
            (task.dueDate && dueDate <= nextWeek);
        default:
          return true; // 'all' muestra todas
      }
    }).sort((a, b) => {
      // Ordenar primero por prioridad
      const priorities = { 'Alta': 0, 'Media': 1, 'Baja': 2 };
      const priorityDiff = (priorities[a.priority] || 1) - (priorities[b.priority] || 1);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Luego por fecha de entrega (más cercana primero)
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  };

  // Obtener las tareas filtradas
  const tasksToShow = filteredTasks().slice(0, 5); // Limitar a 5 para no sobrecargar

  // Renderizar un mensaje de carga
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="bg-gray-200 dark:bg-gray-700 h-16 rounded-md"></div>
        ))}
      </div>
    );
  }

  // Si no hay tareas para mostrar
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
        </svg>
        <p>No hay tareas pendientes</p>
      </div>
    );
  }

  // Función para obtener el color según prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Alta': return 'text-red-600';
      case 'Media': return 'text-amber-600';
      case 'Baja': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // Función para formatear la fecha de entrega
  const formatDueDate = (dateString) => {
    if (!dateString) return 'Sin fecha límite';
    
    const date = new Date(dateString);
    
    // Si la fecha ya pasó
    if (isPast(date) && date.toDateString() !== new Date().toDateString()) {
      return (
        <span className="text-red-600">
          Atrasada ({format(date, 'dd MMM', { locale: es })})
        </span>
      );
    }
    
    // Si es hoy
    if (date.toDateString() === new Date().toDateString()) {
      return <span className="text-amber-600">Hoy</span>;
    }
    
    // Si es mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return <span className="text-amber-600">Mañana</span>;
    }
    
    // Resto de casos
    return formatDistanceToNow(date, { addSuffix: true, locale: es });
  };

  return (
    <div>
      {/* Filtros */}
      <div className="flex mb-4 overflow-x-auto pb-2 -mx-1">
        <button 
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs rounded-full mx-1 whitespace-nowrap ${
            filter === 'all' 
              ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700' 
              : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
          } border`}
        >
          Todas
        </button>
        <button 
          onClick={() => setFilter('today')}
          className={`px-3 py-1 text-xs rounded-full mx-1 whitespace-nowrap ${
            filter === 'today' 
              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700' 
              : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
          } border`}
        >
          Hoy
        </button>
        <button 
          onClick={() => setFilter('week')}
          className={`px-3 py-1 text-xs rounded-full mx-1 whitespace-nowrap ${
            filter === 'week' 
              ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700' 
              : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
          } border`}
        >
          Esta semana
        </button>
        <button 
          onClick={() => setFilter('priority')}
          className={`px-3 py-1 text-xs rounded-full mx-1 whitespace-nowrap ${
            filter === 'priority' 
              ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700' 
              : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
          } border`}
        >
          Prioritarias
        </button>
      </div>

      {/* Lista de tareas */}
      {tasksToShow.length > 0 ? (
        <div className="space-y-3">
          {tasksToShow.map(task => (
            <div 
              key={task._id}
              className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start">
                    {/* Checkbox para completar */}
                    <button 
                      onClick={() => markAsCompleted(task._id)}
                      className="h-5 w-5 border border-gray-300 dark:border-gray-500 rounded-full mr-3 mt-1 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                    >
                      <span className="sr-only">Completar tarea</span>
                    </button>
                    
                    <div>
                      {/* Título de la tarea */}
                      <h4 className="font-medium text-gray-900 dark:text-white mb-0.5">
                        {task.title}
                      </h4>
                      
                      {/* Detalles */}
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                        {/* Asignatura */}
                        {task.subject && (
                          <div className="flex items-center">
                            <span 
                              className="w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: task.subject.color || '#CBD5E0' }}
                            ></span>
                            <span>{task.subject.name}</span>
                          </div>
                        )}
                        
                        {/* Fecha límite */}
                        <div className="flex items-center">
                          <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDueDate(task.dueDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Prioridad */}
                <div className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </div>
              </div>
            </div>
          ))}

          {/* Ver todas las tareas */}
          <button 
            onClick={() => router.push('/tasks')}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 py-2 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
          >
            Ver todas las tareas ({tasks.length})
          </button>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p>No tienes tareas pendientes {filter !== 'all' && 'con este filtro'}</p>
          <button 
            onClick={() => router.push('/tasks/new')} 
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            + Crear nueva tarea
          </button>
        </div>
      )}
    </div>
  );
}
