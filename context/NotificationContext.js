import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

// Crear el contexto con valores predeterminados para evitar errores
const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  hasMore: false,
  fetchNotifications: () => {},
  markAsRead: () => Promise.resolve(false),
  markAllAsRead: () => Promise.resolve(false),
  deleteNotification: () => Promise.resolve(false),
  addNotification: () => {}
});

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Referencia para controlar el intervalo de polling
  const pollingInterval = useRef(null);

  // Cargar notificaciones desde la API
  const fetchNotifications = useCallback(async (limit = 10, skip = 0, unreadOnly = false) => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch(
        `/api/notifications?limit=${limit}&skip=${skip}&unreadOnly=${unreadOnly}`
      );
      
      if (!res.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      
      const data = await res.json();
      
      if (skip === 0) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
      
      setUnreadCount(data.unreadCount);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);
  
  // Comprobar notificaciones nuevas
  const checkNewNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      const res = await fetch('/api/notifications?limit=1&unreadOnly=true');
      
      if (!res.ok) {
        throw new Error('Error al comprobar notificaciones');
      }
      
      const data = await res.json();
      
      // Si el conteo ha cambiado, actualizar las notificaciones
      if (data.unreadCount !== unreadCount) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error checking new notifications:', err);
    }
  }, [isAuthenticated, user, unreadCount, fetchNotifications]);
  
  // Configurar polling para notificaciones
  useEffect(() => {
    if (isAuthenticated && user) {
      // Iniciar polling cada 30 segundos
      pollingInterval.current = setInterval(() => {
        checkNewNotifications();
      }, 30000); // 30 segundos
      
      return () => {
        if (pollingInterval.current) {
          clearInterval(pollingInterval.current);
        }
      };
    }
  }, [isAuthenticated, user, checkNewNotifications]);
  
  // Cargar notificaciones cuando el usuario inicia sesión
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications(user.id);
    }
  }, [isAuthenticated, user, fetchNotifications]);
  
  // Marcar una notificación como leída
  const markAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });
      
      if (!res.ok) throw new Error('Error al actualizar');
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === id ? { ...notification, read: true } : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  };
  
  // Marcar todas las notificaciones como leídas
  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
      });
      
      if (!res.ok) throw new Error('Error al actualizar');
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  };
  
  // Eliminar una notificación
  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) throw new Error('Error al eliminar');
      
      // Actualizar estado local
      const notification = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  };
  
  // Crear una nueva notificación (sólo actualiza la UI, la lógica real debe estar en el servidor)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        hasMore,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
