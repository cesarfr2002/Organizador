import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useTheme as useNextTheme } from 'next-themes';

const NotificationDropdown = ({ onClose, onViewAll }) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAllAsRead 
  } = useNotifications();
  const dropdownRef = useRef(null);
  const { theme } = useNextTheme();
  const isDark = theme === 'dark';
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };
  
  return (
    <div 
      ref={dropdownRef} 
      className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-md shadow-lg z-50 border ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
      style={{ maxHeight: '80vh' }}
    >
      <div className={`p-3 flex justify-between items-center border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Notificaciones</h3>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 dark:text-blue-400 flex items-center hover:text-blue-800 dark:hover:text-blue-300"
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            Marcar todo como leído
          </button>
        )}
      </div>
      
      <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-100'}`}>
        {loading ? (
          <div className={`p-4 text-center ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Cargando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className={`p-4 text-center ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
            No tienes notificaciones
          </div>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <NotificationItem 
              key={notification._id} 
              notification={notification}
              onClose={onClose}
            />
          ))
        )}
      </div>
      
      <div className={`p-3 border-t text-center ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button 
          onClick={onViewAll}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
