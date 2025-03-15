import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { BellIcon } from '@heroicons/react/24/outline';
import NotificationDropdown from './NotificationDropdown';
import { useRouter } from 'next/router';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, fetchNotifications } = useNotifications();
  const router = useRouter();
  const bellRef = useRef(null);
  
  // Cerrar el dropdown cuando cambia la ruta
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
    };
    
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);
  
  // Refrescar notificaciones cuando el componente se monta
  useEffect(() => {
    fetchNotifications(5, 0); // Mostrar primeras 5 notificaciones
    
    // Agregar listener para actualización forzada
    const handleNotificationsUpdate = () => {
      console.log("Actualizando notificaciones desde evento");
      fetchNotifications(5, 0);
    };
    
    window.addEventListener('notifications-updated', handleNotificationsUpdate);
    
    // Actualizar automáticamente las notificaciones cada 30 segundos
    const intervalId = setInterval(() => {
      console.log("Refrescando notificaciones periódicamente");
      fetchNotifications(5, 0);
    }, 30 * 1000);
    
    return () => {
      window.removeEventListener('notifications-updated', handleNotificationsUpdate);
      clearInterval(intervalId);
    };
  }, [fetchNotifications]);
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    
    // Refrescar notificaciones al abrir el dropdown
    if (!isOpen) {
      fetchNotifications(5, 0);
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleViewAll = () => {
    router.push('/notifications');
    closeDropdown();
  };

  return (
    <div className="relative z-50" ref={bellRef}>
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
        onClick={toggleDropdown}
        aria-label="Notificaciones"
      >
        <BellIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <NotificationDropdown onClose={closeDropdown} onViewAll={handleViewAll} />
      )}
    </div>
  );
};

export default NotificationBell;
