import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import NotificationItem from '../components/NotificationItem';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        
        if (res.ok) {
          setNotifications(data);
        } else {
          console.error('Error al cargar notificaciones:', data.error);
        }
      } catch (error) {
        console.error('Error al cargar notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });

      if (res.ok) {
        setNotifications(
          notifications.map((notif) =>
            notif._id === id ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setNotifications(notifications.filter((notif) => notif._id !== id));
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Notificaciones | UniOrganizer</title>
        </Head>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Notificaciones</h1>
          
          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No tienes notificaciones.
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
