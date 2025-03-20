import { useState, useEffect } from 'react';

export default function TaskPriorityList({ tasks, onUpdatePriority }) {
  const [localTasks, setLocalTasks] = useState([]);
  
  useEffect(() => {
    // Sort tasks by priority level and then by due date
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityRank = { high: 1, medium: 2, low: 3 };
      if (priorityRank[a.priority] !== priorityRank[b.priority]) {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }
      
      // If same priority, sort by due date (closest first)
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    setLocalTasks(sortedTasks);
  }, [tasks]);
  
  const handlePriorityChange = (taskId, newPriority) => {
    // Update local state
    const updatedTasks = localTasks.map(task => 
      task._id === taskId ? { ...task, priority: newPriority } : task
    );
    
    setLocalTasks(updatedTasks);
    
    // Notify parent component
    onUpdatePriority(taskId, newPriority);
  };
  
  const getPriorityColorClass = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };
  
  // Function to format date nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {localTasks.length === 0 ? (
        <p className="text-center py-4 text-gray-500 dark:text-gray-400">
          No hay tareas pendientes que programar.
        </p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {localTasks.map(task => (
            <li key={task._id} className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="mb-2 sm:mb-0">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Vence: {formatDate(task.dueDate)}
                    {task.estimatedTime && ` • Tiempo estimado: ${task.estimatedTime} min`}
                  </p>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColorClass(task.priority)}`}>
                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                  
                  <select
                    value={task.priority}
                    onChange={(e) => handlePriorityChange(task._id, e.target.value)}
                    className="rounded-md border-gray-300 py-1 text-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
