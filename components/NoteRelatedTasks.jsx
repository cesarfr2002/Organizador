import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

export default function NoteRelatedTasks({ noteId }) {
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
      const res = await fetch(`/api/tasks?noteId=${noteId}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
        console.log('Tareas vinculadas cargadas:', data); // Añadir para depuración
      } else {
        throw new Error('Error al cargar las tareas relacionadas');
      }
    } catch (error) {
      console.error('Error fetching related tasks:', error);
      toast.error('Error al cargar tareas relacionadas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-16 rounded-md"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">Tareas vinculadas</h3>
      </div>
      
      {tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map(task => (
            <Link href={`/tasks/${task._id}`} key={task._id}>
              <div className="p-3 border rounded hover:bg-gray-50 transition cursor-pointer">
                <div className="flex justify-between items-center">
                  <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {task.subject && (
                      <span 
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ 
                          backgroundColor: `${task.subject.color}20`,
                          color: task.subject.color 
                        }}
                      >
                        {task.subject.name}
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.priority === 'Alta' ? 'bg-red-100 text-red-800' : 
                      task.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {task.completed ? 'Completada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
                {task.dueDate && (
                  <p className="text-xs text-gray-600 mt-1">
                    Fecha límite: {format(new Date(task.dueDate), 'PPP', { locale: es })}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p>No hay tareas vinculadas a esta nota</p>
        </div>
      )}
    </div>
  );
}
