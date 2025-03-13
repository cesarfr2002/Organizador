import { useState } from 'react';
import Link from 'next/link';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TaskCard({ task, onStatusChange }) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Determinar el color basado en la prioridad
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'Alta':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Baja':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };
  
  // Determinar el estilo del estado
  const getStatusStyle = () => {
    switch (task.status) {
      case 'pendiente':
        return { bgColor: 'bg-yellow-100 dark:bg-yellow-900', textColor: 'text-yellow-800 dark:text-yellow-300' };
      case 'en_progreso':
        return { bgColor: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-800 dark:text-blue-300' };
      case 'completada':
        return { bgColor: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-800 dark:text-green-300' };
      case 'cancelada':
        return { bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-800 dark:text-gray-300' };
      default:
        return { bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-800 dark:text-gray-300' };
    }
  };
  
  // Verificar si la fecha de entrega está próxima o vencida
  const getDueDateStyle = () => {
    if (!task.dueDate) return 'text-gray-600 dark:text-gray-400';
    
    const dueDate = new Date(task.dueDate);
    
    if (isPast(dueDate) && task.status !== 'completada') {
      return 'text-red-600 dark:text-red-400 font-medium';
    } else if (isToday(dueDate)) {
      return 'text-amber-600 dark:text-amber-400 font-medium';
    }
    
    return 'text-gray-600 dark:text-gray-400';
  };
  
  // Formatear fecha de entrega
  const formatDueDate = () => {
    if (!task.dueDate) return 'Sin fecha de entrega';
    
    const dueDate = new Date(task.dueDate);
    
    if (isToday(dueDate)) {
      return 'Hoy';
    }
    
    return format(dueDate, 'PPP', { locale: es });
  };

  // Manejar el cambio de estado
  const handleStatusChange = async (newStatus) => {
    setIsLoading(true);
    
    try {
      // Llamar a la función pasada como prop para actualizar el estado
      await onStatusChange(task._id, newStatus);
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Determinar tipo de icono según el tipo de tarea
  const getTypeIcon = () => {
    switch (task.type) {
      case 'examen':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'proyecto':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        );
      case 'lectura':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'presentacion':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'laboratorio':
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
    }
  };

  // Determinar el texto del tipo de tarea
  const getTypeText = () => {
    switch (task.type) {
      case 'tarea':
        return 'Tarea';
      case 'examen':
        return 'Examen';
      case 'proyecto':
        return 'Proyecto';
      case 'lectura':
        return 'Lectura';
      case 'presentacion':
        return 'Presentación';
      case 'laboratorio':
        return 'Laboratorio';
      default:
        return 'Otro';
    }
  };

  const { bgColor, textColor } = getStatusStyle();
  
  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 
      ${task.status === 'completada' ? 'opacity-75' : ''}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/tasks/${task._id}`} className="hover:text-blue-600 dark:hover:text-blue-400">
            <h3 className={`font-medium ${task.status === 'completada' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-white'}`}>
              {task.title}
            </h3>
          </Link>
          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor()}`}>
            {task.priority}
          </span>
        </div>
        
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
          <div className="flex items-center mr-3">
            {getTypeIcon()}
            <span>{getTypeText()}</span>
          </div>
          
          {task.dueDate && (
            <div className={`flex items-center ${getDueDateStyle()}`}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{formatDueDate()}</span>
            </div>
          )}
        </div>
        
        {task.subject && task.subject.name && (
          <div className="flex items-center mb-3">
            <span 
              className="h-2 w-2 rounded-full mr-2" 
              style={{backgroundColor: task.subject.color || '#3B82F6'}}
            ></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{task.subject.name}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div>
            <span className={`inline-flex items-center text-xs px-2 py-1 rounded-md ${bgColor} ${textColor}`}>
              {task.status === 'pendiente' && 'Pendiente'}
              {task.status === 'en_progreso' && 'En progreso'}
              {task.status === 'completada' && 'Completada'}
              {task.status === 'cancelada' && 'Cancelada'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {task.estimatedTime > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {task.estimatedTime} min
              </span>
            )}
            
            {/* Menú desplegable para cambiar estado */}
            {onStatusChange && (
              <div className="relative">
                <select
                  disabled={isLoading}
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_progreso">En progreso</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Link 
        href={`/tasks/${task._id}`}
        className="block border-t border-gray-200 dark:border-gray-700 text-center text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 py-2"
      >
        Ver detalles
      </Link>
    </div>
  );
}
