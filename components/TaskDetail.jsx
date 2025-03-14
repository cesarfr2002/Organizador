import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TaskDetail({ taskId }) {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedNotes, setRelatedNotes] = useState([]);

  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}?populate=relatedNotes`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
        // Verificar si relatedNotes existe antes de usarlo
        setRelatedNotes(data.relatedNotes || []);
      } else {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error('Error al cargar la tarea');
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-24 bg-gray-200 rounded-lg"></div>;
  }

  if (!task) {
    return <div className="text-center p-4">No se encontró la tarea</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">{task.title}</h2>
      
      {task.description && (
        <div className="mb-6 text-gray-700">
          <p>{task.description}</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <span className="text-gray-500">Estado:</span>
          <span className={`ml-2 ${task.completed ? 'text-green-600' : 'text-blue-600'}`}>
            {task.completed ? 'Completada' : 'Pendiente'}
          </span>
        </div>
        
        {task.dueDate && (
          <div>
            <span className="text-gray-500">Fecha límite:</span>
            <span className="ml-2">
              {isToday(new Date(task.dueDate)) 
                ? 'Hoy' 
                : format(new Date(task.dueDate), 'PP', { locale: es })}
            </span>
          </div>
        )}
        
        {task.priority && (
          <div>
            <span className="text-gray-500">Prioridad:</span>
            <span className={`ml-2 ${
              task.priority === 'Alta' 
                ? 'text-red-600' 
                : task.priority === 'Media' 
                  ? 'text-amber-600' 
                  : 'text-blue-600'
            }`}>
              {task.priority}
            </span>
          </div>
        )}
        
        {task.subject && (
          <div>
            <span className="text-gray-500">Asignatura:</span>
            <span className="ml-2">{task.subject.name}</span>
          </div>
        )}
      </div>

      {/* Sección de notas relacionadas */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4 border-b pb-2">Notas relacionadas</h3>
        
        {Array.isArray(relatedNotes) && relatedNotes.length > 0 ? (
          <div className="space-y-3">
            {relatedNotes.map(note => (
              <Link 
                href={`/notes/${note._id}`} 
                key={note._id} 
                className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100 hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-200"
              >
                <h4 className="font-medium text-blue-600">{note.title}</h4>
                
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  {note.subject && (
                    <span className="flex items-center mr-4">
                      <span 
                        className="h-2 w-2 rounded-full mr-1"
                        style={{ backgroundColor: note.subject.color || '#3B82F6' }}
                      ></span>
                      {note.subject.name}
                    </span>
                  )}
                  
                  <span className="text-xs">
                    Actualizada {format(new Date(note.updatedAt), 'dd MMM yyyy', { locale: es })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>No hay notas vinculadas a esta tarea</p>
            <Link href={`/notes/new`} className="text-blue-600 hover:underline block mt-2 text-sm">
              Crear una nueva nota para esta tarea
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
