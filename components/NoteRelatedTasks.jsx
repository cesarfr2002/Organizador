import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

const NoteRelatedTasks = ({ noteId }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (noteId) {
      fetchRelatedTasks();
    }
  }, [noteId]);

  const fetchRelatedTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}/tasks`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        throw new Error('Error al cargar tareas relacionadas');
      }
    } catch (error) {
      console.error('Error fetching related tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskComplete = async (taskId, currentStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !currentStatus })
      });
      
      if (res.ok) {
        // Actualizar la lista de tareas localmente
        setTasks(tasks.map(task => 
          task._id === taskId ? { ...task, completed: !task.completed } : task
        ));
        
        toast.success(!currentStatus 
          ? '¡Tarea completada!' 
          : 'Tarea marcada como pendiente');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error al actualizar la tarea');
    }
  };

  const formatDueDate = (date) => {
    if (!date) return 'Sin fecha límite';
    
    const dueDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Verificar si es hoy, mañana o fecha específica
    if (dueDate.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return format(dueDate, 'dd MMM', { locale: es });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-medium mb-4 flex items-center justify-between">
        <span>Tareas relacionadas</span>
        <button
          onClick={() => router.push(`/tasks/new?noteId=${noteId}`)}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          title="Crear nueva tarea vinculada a esta nota"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva tarea
        </button>
      </h3>

      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task._id} className="flex items-start group">
              <button
                onClick={() => toggleTaskComplete(task._id, task.completed)}
                className={`flex-shrink-0 mt-1 w-5 h-5 rounded-full border ${
                  task.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-blue-500'
                } flex items-center justify-center`}
              >
                {task.completed && (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              <div className="ml-3 flex-1">
                <div 
                  className={`cursor-pointer ${task.completed ? 'line-through text-gray-500' : ''}`}
                  onClick={() => router.push(`/tasks/${task._id}`)}
                >
                  <div className="font-medium text-sm">{task.title}</div>
                  {task.description && (
                    <div className="text-gray-500 text-xs line-clamp-1">{task.description}</div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.priority && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      task.priority === 'Alta' ? 'bg-red-100 text-red-800' : 
                      task.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  )}
                  
                  {task.dueDate && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                      {formatDueDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => router.push(`/tasks/${task._id}/edit`)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm mb-3">No hay tareas vinculadas a esta nota</p>
          <button
            onClick={() => router.push(`/tasks/new?noteId=${noteId}`)}
            className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Crear tarea relacionada
          </button>
        </div>
      )}
    </div>
  );
};

export default NoteRelatedTasks;
