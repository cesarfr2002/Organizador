import { useState } from 'react';

export default function NotificationItem({ notification, onMarkAsRead, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    
    // If expanding an unread notification, mark it as read
    if (!isExpanded && !notification.read) {
      onMarkAsRead(notification._id);
    }
  };
  
  // Format the date
  const formattedDate = notification.createdAt 
    ? new Date(notification.createdAt).toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'fecha desconocida';
  
  return (
    <div className={`border rounded-lg overflow-hidden ${notification.read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700 border-l-4 border-l-blue-500'}`}>
      <div 
        className="p-4 cursor-pointer flex justify-between items-start"
        onClick={toggleExpand}
      >
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
              {notification.title}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              {formattedDate}
            </span>
          </div>
          
          <p className={`mt-1 ${notification.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
            {notification.message.length > 100 && !isExpanded
              ? notification.message.substring(0, 100) + '...'
              : notification.message}
          </p>
          
          {notification.message.length > 100 && (
            <button 
              className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 mt-1 focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand();
              }}
            >
              {isExpanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
      </div>
      
      <div className={`flex border-t border-gray-200 dark:border-gray-600 ${notification.read ? '' : 'bg-gray-50 dark:bg-gray-800'}`}>
        {!notification.read && (
          <button
            className="flex-1 p-2 text-sm text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => onMarkAsRead(notification._id)}
          >
            Marcar como leída
          </button>
        )}
        <button
          className="flex-1 p-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
          onClick={() => onDelete(notification._id)}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
