import { useState } from 'react';
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';

export default function TaskList({ tasks = [], onTaskUpdate, showPriority = false, showCategory = false }) {
  const [expandedTask, setExpandedTask] = useState(null);
  const router = useRouter();

  // Function to toggle task completion
  const handleToggleComplete = async (taskId, isCompleted) => {
    // Validar que tengamos un ID válido antes de hacer la solicitud
    if (!taskId || taskId === 'undefined') {
      console.error('Error: No se puede actualizar tarea con ID inválido:', taskId);
      toast.error('Error al actualizar: ID de tarea inválido');
      return;
    }

    try {
      // Llamar a la función de callback si existe, en lugar de hacer la solicitud directamente
      if (onTaskUpdate && typeof onTaskUpdate === 'function') {
        onTaskUpdate(taskId, isCompleted);
        return;
      }

      // Si no hay un callback, hacer la solicitud API directamente (fallback)
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !isCompleted }),
      });

      if (res.ok) {
        if (!isCompleted) {
          toast.success('¡Tarea completada!');
        }
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar tarea');
      }
    } catch (error) {
      console.error('Error toggling task completion:', error);
      toast.error('Error al actualizar tarea');
    }
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Hoy';
    } else if (isTomorrow(date)) {
      return 'Mañana';
    } else {
      return format(date, 'd MMM', { locale: es });
    }
  };

  // Helper function to format location object to string
  const formatLocation = (location) => {
    if (!location) return "";
    
    // If location is already a string, return it
    if (typeof location === 'string') return location;
    
    // If location is an object, format its properties
    let formattedLocation = "";
    if (location.campus) formattedLocation += location.campus;
    if (location.building) {
      if (formattedLocation) formattedLocation += ", ";
      formattedLocation += `Edificio ${location.building}`;
    }
    if (location.floor) {
      if (formattedLocation) formattedLocation += ", ";
      formattedLocation += `Piso ${location.floor}`;
    }
    if (location.room) {
      if (formattedLocation) formattedLocation += ", ";
      formattedLocation += `Sala ${location.room}`;
    }
    
    return formattedLocation || "Sin ubicación especificada";
  };

  // Calculate percentage of time spent on task
  const calculateProgress = (task) => {
    if (!task.estimatedTime) return 0;
    const studyTime = task.studyTime || 0;
    return Math.min(100, Math.round((studyTime / task.estimatedTime) * 100));
  };

  // Get days remaining until due date
  const getDaysRemaining = (dateString) => {
    if (!dateString) return null;
    
    const dueDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isToday(dueDate)) return 0;
    if (isPast(dueDate)) return -1;
    
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'Alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Baja':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get border color based on days remaining
  const getDueDateBorderClass = (dateString) => {
    if (!dateString) return '';
    
    const daysRemaining = getDaysRemaining(dateString);
    
    if (daysRemaining < 0) return 'border-l-4 border-red-500';
    if (daysRemaining === 0) return 'border-l-4 border-amber-500';
    if (daysRemaining <= 2) return 'border-l-4 border-yellow-500';
    return '';
  };

  // Obtener clases y configuración según el tipo de tarea
  const getTaskTypeInfo = (type) => {
    switch (type) {
      case 'examen':
        return {
          borderClass: 'border-l-4 border-red-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          label: 'Examen'
        };
      case 'proyecto':
        return {
          borderClass: 'border-l-4 border-blue-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          ),
          label: 'Proyecto'
        };
      case 'tarea':
        return {
          borderClass: 'border-l-4 border-green-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          label: 'Tarea'
        };
      case 'lectura':
        return {
          borderClass: 'border-l-4 border-amber-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
          label: 'Lectura'
        };
      case 'presentacion':
        return {
          borderClass: 'border-l-4 border-purple-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          ),
          label: 'Presentación'
        };
      case 'laboratorio':
        return {
          borderClass: 'border-l-4 border-indigo-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          ),
          label: 'Laboratorio'
        };
      default:
        return {
          borderClass: 'border-l-4 border-gray-500',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          ),
          label: 'Otro'
        };
    }
  };

  // Renderizar detalles específicos según el tipo de tarea
  const renderTaskSpecificDetails = (task) => {
    switch (task.type) {
      case 'examen':
        if (!task.examDetails) return null;
        return (
          <div className="mt-2 space-y-1 text-sm">
            {task.examDetails.topics && task.examDetails.topics.length > 0 && (
              <div>
                <span className="font-medium">Temas:</span> {task.examDetails.topics.join(', ')}
              </div>
            )}
            {task.examDetails.duration && (
              <div>
                <span className="font-medium">Duración:</span> {task.examDetails.duration} min
              </div>
            )}
            {task.examDetails.allowedMaterials && (
              <div>
                <span className="font-medium">Materiales permitidos:</span> {task.examDetails.allowedMaterials}
              </div>
            )}
            {task.examDetails.location && (
              <div>
                <span className="font-medium">Ubicación:</span> {formatLocation(task.examDetails.location)}
              </div>
            )}
          </div>
        );
      case 'proyecto':
        if (!task.projectDetails) return null;
        return (
          <div className="mt-2 space-y-1 text-sm">
            {task.projectDetails.objectives && task.projectDetails.objectives.length > 0 && (
              <div>
                <span className="font-medium">Objetivos:</span>
                <ul className="list-disc list-inside ml-2">
                  {task.projectDetails.objectives.map((obj, idx) => (
                    <li key={idx}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
            {task.projectDetails.groupWork && (
              <div>
                <span className="font-medium">Trabajo en grupo:</span> Sí
                {task.projectDetails.groupMembers && task.projectDetails.groupMembers.length > 0 && (
                  <div className="ml-2">
                    <span className="font-medium">Integrantes:</span> {task.projectDetails.groupMembers.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'lectura':
        if (!task.readingDetails) return null;
        return (
          <div className="mt-2 space-y-1 text-sm">
            {task.readingDetails.pages && (
              <div>
                <span className="font-medium">Páginas:</span> {task.readingDetails.pages}
              </div>
            )}
            {task.readingDetails.source && (
              <div>
                <span className="font-medium">Fuente:</span> {task.readingDetails.source}
              </div>
            )}
            {task.readingDetails.url && (
              <div>
                <span className="font-medium">URL:</span> 
                <a href={task.readingDetails.url} target="_blank" rel="noopener noreferrer" 
                   className="text-blue-600 hover:underline ml-1">{task.readingDetails.url}</a>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
  };

  // Group tasks by date
  const groupTasksByDate = () => {
    const groups = {
      overdue: { title: 'Atrasadas', tasks: [] },
      today: { title: 'Hoy', tasks: [] },
      tomorrow: { title: 'Mañana', tasks: [] },
      upcoming: { title: 'Próximamente', tasks: [] },
      noDate: { title: 'Sin fecha', tasks: [] }
    };

    tasks.forEach(task => {
      if (!task.dueDate) {
        groups.noDate.tasks.push(task);
      } else {
        const dueDate = new Date(task.dueDate);
        if (isOverdue(dueDate)) {
          groups.overdue.tasks.push(task);
        } else if (isToday(dueDate)) {
          groups.today.tasks.push(task);
        } else if (isTomorrow(dueDate)) {
          groups.tomorrow.tasks.push(task);
        } else {
          groups.upcoming.tasks.push(task);
        }
      }
    });

    // Only return non-empty groups
    return Object.values(groups).filter(group => group.tasks.length > 0);
  };

  // Si no hay tareas
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p className="text-lg font-medium">No hay tareas pendientes</p>
        <p className="text-sm mt-1">¡Todo al día! Puedes crear nuevas tareas cuando lo necesites.</p>
        <button 
          onClick={() => router.push('/tasks/quick')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Crear tarea rápida
        </button>
      </div>
    );
  }

  // Show grouped task list
  if (tasks.length > 5) {
    const taskGroups = groupTasksByDate();
    
    return (
      <div className="space-y-6">
        {taskGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">{group.title}</h3>
            <ul className="divide-y divide-gray-100 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              {group.tasks.map((task) => (
                <li 
                  key={task._id} 
                  className={`${getDueDateBorderClass(task.dueDate)} hover:bg-gray-50 transition-colors`}
                >
                  <div className="px-4 py-3 sm:px-6">
                    <div className="flex items-start">
                      {/* Checkbox de completado */}
                      <div className="mr-3 pt-1">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleComplete(task._id, task.completed)}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </div>
                      
                      {/* Contenido principal */}
                      <div className="flex-1 min-w-0" onClick={() => setExpandedTask(expandedTask === task._id ? null : task._id)}>
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center ml-2 space-x-2">
                            {/* Task type badge */}
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">
                              {getTaskTypeInfo(task.type).label}
                            </span>
                            
                            {/* Priority badge */}
                            {showPriority && task.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          {/* Subject */}
                          {task.subject && (
                            <div className="flex items-center">
                              <span 
                                className="h-2 w-2 rounded-full mr-1"
                                style={{ backgroundColor: task.subject.color || '#718096' }}
                              ></span>
                              <span>{task.subject.name}</span>
                            </div>
                          )}
                          
                          {/* Due date */}
                          {task.dueDate && (
                            <div className={`flex items-center ${isOverdue(task.dueDate) ? 'text-red-600' : ''}`}>
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDueDate(task.dueDate)}
                              {getDaysRemaining(task.dueDate) !== null && getDaysRemaining(task.dueDate) > 0 && (
                                <span className="ml-1">
                                  ({getDaysRemaining(task.dueDate)} día{getDaysRemaining(task.dueDate) !== 1 ? 's' : ''})
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Estimated time */}
                          {task.estimatedTime > 0 && (
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {task.estimatedTime} min
                            </div>
                          )}
                          
                          {/* Weight in grade */}
                          {task.weight > 0 && (
                            <span className="flex items-center text-purple-600 font-medium">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              {task.weight}% de la nota
                            </span>
                          )}
                        </div>
                        
                        {/* Progress bar for tasks with estimated time */}
                        {task.estimatedTime > 0 && task.studyTime > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center text-xs mb-1">
                              <span>Progreso</span>
                              <span>{calculateProgress(task)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${calculateProgress(task)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Detalles expandidos */}
                        {expandedTask === task._id && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            
                            {renderTaskSpecificDetails(task)}
                            
                            {/* Tags */}
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {task.tags.map((tag, idx) => (
                                  <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Action buttons */}
                            <div className="mt-3 flex space-x-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/tasks/${task._id}/edit`);
                                }}
                                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 flex items-center transition-colors"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Editar
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/pomodoro?taskId=${task._id}`);
                                }}
                                className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 flex items-center transition-colors"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Pomodoro
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  // Default task list for small number of tasks
  return (
    <ul className="divide-y divide-gray-200 bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {tasks.map((task) => {
        // Validar que la tarea tenga un ID válido
        if (!task || !task._id) {
          console.error('Tarea con ID inválido:', task);
          return null; // No renderizar tareas sin ID válido
        }
        
        const typeInfo = getTaskTypeInfo(task.type);
        
        return (
          <li 
            key={task._id} 
            className={`hover:bg-gray-50 transition-colors ${getDueDateBorderClass(task.dueDate)} ${expandedTask === task._id ? 'bg-gray-50' : ''}`}
          >
            <div className="px-4 py-3 sm:px-6">
              <div className="flex items-start">
                {/* Checkbox de completado */}
                <div className="mr-3 pt-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleComplete(task._id, task.completed)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                
                {/* Contenido de la tarea */}
                <div className="flex-1 min-w-0" onClick={() => setExpandedTask(expandedTask === task._id ? null : task._id)}>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h4>
                    
                    {/* Due date with visual indicator */}
                    {task.dueDate && (
                      <div className={`ml-2 text-xs font-medium flex items-center ${
                        isOverdue(task.dueDate) ? 'text-red-600' : isToday(task.dueDate) ? 'text-amber-600' : 'text-gray-500'
                      }`}>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDueDate(task.dueDate)}
                        {isOverdue(task.dueDate) && <span className="ml-1">(Atrasada)</span>}
                      </div>
                    )}
                  </div>
                  
                  {/* Info badges */}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {/* Type and icon */}
                    <div className="flex items-center text-xs text-gray-600">
                      {typeInfo.icon}
                      <span>{typeInfo.label}</span>
                    </div>
                    
                    {/* Subject with color dot */}
                    {task.subject && (
                      <div className="flex items-center text-xs text-gray-600">
                        <span 
                          className="inline-block h-2 w-2 rounded-full mr-1"
                          style={{ backgroundColor: task.subject.color || '#718096' }}
                        ></span>
                        <span>{task.subject.name}</span>
                      </div>
                    )}
                    
                    {/* Priority badge */}
                    {showPriority && task.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    )}
                    
                    {/* Weight indicator */}
                    {task.weight > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {task.weight}% de la nota
                      </span>
                    )}
                  </div>
                  
                  {/* Progress bar for tasks with time */}
                  {task.estimatedTime > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {task.studyTime || 0} / {task.estimatedTime} min
                        </span>
                        <span>{calculateProgress(task)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${calculateProgress(task)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Detalles expandidos */}
                  {expandedTask === task._id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      
                      {renderTaskSpecificDetails(task)}
                      
                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="mt-3 flex space-x-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/tasks/${task._id}/edit`);
                          }}
                          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 flex items-center transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/pomodoro?taskId=${task._id}`);
                          }}
                          className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 flex items-center transition-colors"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pomodoro
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
