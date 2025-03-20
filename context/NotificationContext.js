import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter(notification => !notification.read).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const addNotification = async (notification) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (response.ok) {
        const newNotification = await response.json();
        setNotifications([...notifications, newNotification]);
        setUnreadCount(prevCount => prevCount + 1);
        return newNotification;
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
    return null;
  };

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });

      if (response.ok) {
        setNotifications(
          notifications.map(notification => 
            notification._id === id 
              ? { ...notification, read: true } 
              : notification
          )
        );
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const notificationToDelete = notifications.find(n => n._id === id);
        setNotifications(notifications.filter(notification => notification._id !== id));
        
        if (notificationToDelete && !notificationToDelete.read) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      fetchNotifications, 
      addNotification, 
      markAsRead, 
      deleteNotification 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
