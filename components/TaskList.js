import { useRouter } from 'next/router';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TaskList({ tasks, toggleTaskStatus, deleteTask }) {
  const router = useRouter();
  
  // Función para navegar al detalle de la tarea
  const navigateToTaskDetail = (taskId) => {
    router.push(`/tasks/${taskId}`);
  };

  // Función para iniciar Pomodoro con una tarea
  const startPomodoro = (e, taskId) => {
    e.stopPropagation();
    router.push(`/pomodoro?taskId=${taskId}`);
  };

  return (
    <div className="space-y-4">
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <div 
            key={task._id} 
            className="bg-white p-4 rounded-lg shadow-sm border-l-4 hover:shadow-md transition-shadow cursor-pointer" 
            style={{ borderLeftColor: task.subject?.color || '#e5e7eb' }}
            onClick={() => navigateToTaskDetail(task._id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => {
                    e.stopPropagation(); // Prevenir que el evento de click se propague
                    toggleTaskStatus(task._id, task.completed);
                  }}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</h3>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Etiqueta de asignatura */}
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
                
                {/* Etiqueta de prioridad */}
                <span className={`px-2 py-1 text-xs rounded-full ${
                  task.priority === 'Alta' ? 'bg-red-100 text-red-800' : 
                  task.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {task.priority}
                </span>
                
                {/* Fecha de entrega */}
                {task.dueDate && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed
                      ? 'bg-red-100 text-red-800'
                      : isToday(new Date(task.dueDate))
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}>
                    {format(new Date(task.dueDate), 'dd MMM', { locale: es })}
                  </span>
                )}
                
                {/* Botones de acción */}
                <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={(e) => startPomodoro(e, task._id)}
                    className="p-1 hover:bg-gray-100 rounded text-red-500"
                    title="Iniciar Pomodoro"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/tasks/${task._id}/edit`);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Editar"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task._id);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Descripción de la tarea (opcional) */}
            {task.description && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">{task.description}</p>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay tareas que coincidan con los filtros actuales.</p>
        </div>
      )}
    </div>
  );
}
