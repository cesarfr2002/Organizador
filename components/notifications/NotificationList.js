import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { CheckIcon } from '@heroicons/react/24/outline';

const NotificationList = ({ filter = 'all' }) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    hasMore, 
    fetchNotifications, 
    markAllAsRead 
  } = useNotifications();
  const [page, setPage] = useState(0);
  
  useEffect(() => {
    // Reset paginación cuando cambia el filtro
    setPage(0);
    const unreadOnly = filter === 'unread';
    fetchNotifications(10, 0, unreadOnly);
  }, [filter, fetchNotifications]);
  
  const loadMore = () => {
    const nextPage = page + 1;
    const unreadOnly = filter === 'unread';
    fetchNotifications(10, nextPage * 10, unreadOnly);
    setPage(nextPage);
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
        Error: {error}
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">
          {filter === 'unread' ? 'Notificaciones no leídas' : 'Todas las notificaciones'}
        </h3>
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm flex items-center text-blue-600 hover:text-blue-800"
          >
            <CheckIcon className="h-4 w-4 mr-1" />
            Marcar todo como leído
          </button>
        )}
      </div>
      
      {loading && page === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Cargando notificaciones...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No hay notificaciones {filter === 'unread' ? 'no leídas' : ''}.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifications.map((notification) => (
            <NotificationItem 
              key={notification._id} 
              notification={notification} 
            />
          ))}
        </div>
      )}
      
      {hasMore && (
        <div className="p-4 text-center border-t border-gray-100">
          <button 
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando...' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
