import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export default function KanbanTaskCard({ task, onStatusChange }) {
  const formatDueDate = (date) => {
    if (!date) return null;
    
    const dueDate = new Date(date);
    
    if (isToday(dueDate)) {
      return <span className="text-amber-600">Hoy</span>;
    } else if (isPast(dueDate)) {
      return <span className="text-red-600">Atrasada</span>;
    }
    
    return format(dueDate, 'dd MMM', { locale: es });
  };
  
  // Calculate progress
  const progress = task.estimatedTime && task.studyTime 
    ? Math.min(100, Math.round((task.studyTime / task.estimatedTime) * 100))
    : 0;
  
  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 border-l-4" style={{ borderColor: task.subject?.color || '#e2e8f0' }}>
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-gray-800">
            <Link href={`/tasks/${task._id}`} className="hover:text-blue-600">
              {task.title}
            </Link>
          </h4>
          <input
            type="checkbox"
            checked={task.completed || false}
            onChange={onStatusChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
          />
        </div>
        
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {task.subject && (
            <span 
              className="px-2 py-1 rounded-full" 
              style={{ 
                backgroundColor: `${task.subject.color}20`,
                color: task.subject.color
              }}
            >
              {task.subject.name}
            </span>
          )}
          
          {task.priority && (
            <span className={`px-2 py-1 rounded-full ${
              task.priority === 'Alta' ? 'bg-red-100 text-red-800' :
              task.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {task.priority}
            </span>
          )}
        </div>
        
        {task.dueDate && (
          <div className="mt-2 text-xs flex items-center text-gray-500">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDueDate(task.dueDate)}
          </div>
        )}
        
        {task.estimatedTime > 0 && (
          <div className="mt-2">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-gray-500">Progreso</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="mt-3 flex justify-end space-x-2">
          <Link href={`/tasks/${task._id}/edit`} className="text-xs text-gray-500 hover:text-blue-600">
            Editar
          </Link>
          <Link href={`/pomodoro?taskId=${task._id}`} className="text-xs text-gray-500 hover:text-red-600">
            Pomodoro
          </Link>
        </div>
      </div>
    </div>
  );
}
