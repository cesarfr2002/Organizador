import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';

const TaskNotificationChecker = () => {
  const checkInterval = useRef(null);
  const initialCheckDone = useRef(false);
  const lastNotificationCount = useRef(0);
  const { data: session, status } = useSession();
  const { fetchNotifications, unreadCount } = useNotifications();
  const [lastCheckTime, setLastCheckTime] = useState(null);

  // Función para verificar tareas próximas a vencer
  const checkUpcomingTasks = async () => {
    if (status !== 'authenticated') return;
    
    try {
      console.log('Verificando tareas próximas a vencer...', new Date().toISOString());
      
      // Usar el endpoint para tareas próximas
      const response = await fetch('/api/notifications/force-today', {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Error al verificar tareas');
      }
      
      const result = await response.json();
      console.log('Resultado de verificación automática:', result);
      
      // Actualizar timestamp de la última verificación
      setLastCheckTime(new Date().toISOString());
      
      if (result.count > 0) {
        console.log(`Se generaron ${result.count} notificaciones por tareas próximas`);
        
        // Actualizar las notificaciones en el contexto
        fetchNotifications();
        
        // Mostrar toast solo si se generaron nuevas notificaciones
        // y no estamos en la verificación inicial silenciosa
        if (initialCheckDone.current) {
          // Personalizar el mensaje según las notificaciones
          let message = '';
          if (result.summary) {
            const { today, tomorrow, future } = result.summary;
            const parts = [];
            
            if (today > 0) parts.push(`${today} para hoy`);
            if (tomorrow > 0) parts.push(`${tomorrow} para mañana`);
            if (future > 0) parts.push(`${future} para próximos días`);
            
            message = parts.join(', ');
          }
          
          toast.info(
            <div>
              <div className="font-bold">Tienes tareas próximas a vencer</div>
              {message && <div className="text-sm mt-1">{message}</div>}
              <div className="text-xs mt-2">Haz clic en la campana 🔔 para ver los detalles</div>
            </div>, 
            { autoClose: 6000 }
          );
        }
      } else {
        console.log('No se encontraron tareas próximas que requieran notificación');
      }
    } catch (error) {
      console.error('Error checking upcoming tasks:', error);
    }
  };

  // Verificar tareas cuando el componente se monta
  useEffect(() => {
    if (status === 'authenticated' && !initialCheckDone.current) {
      // Retrasamos la primera verificación silenciosa para dar tiempo a que cargue todo
      const initialTimer = setTimeout(() => {
        checkUpcomingTasks();
        initialCheckDone.current = true;
      }, 5000);
      
      // Establecer un intervalo para verificar periódicamente
      // Cada 30 minutos en producción, cada 3 minutos en desarrollo
      const interval = process.env.NODE_ENV === 'development' ? 3 * 60 * 1000 : 30 * 60 * 1000;
      checkInterval.current = setInterval(checkUpcomingTasks, interval);
      
      return () => {
        clearTimeout(initialTimer);
        if (checkInterval.current) {
          clearInterval(checkInterval.current);
        }
      };
    }
  }, [status]);

  // Detector de nuevas notificaciones (para mostrar toasts)
  useEffect(() => {
    if (unreadCount > lastNotificationCount.current && initialCheckDone.current) {
      const newNotifications = unreadCount - lastNotificationCount.current;
      
      // Solo mostrar toast si aumentaron las notificaciones y no es la carga inicial
      if (newNotifications > 0) {
        toast.info(
          <div>
            <div className="font-bold">{newNotifications} nueva{newNotifications > 1 ? 's' : ''} notificación{newNotifications > 1 ? 'es' : ''}</div>
            <div className="text-xs mt-2">Haz clic en la campana 🔔 para verla{newNotifications > 1 ? 's' : ''}</div>
          </div>,
          { autoClose: 5000 }
        );
      }
    }
    
    lastNotificationCount.current = unreadCount;
  }, [unreadCount]);

  // Este componente no renderiza nada visible
  return null;
};

export default TaskNotificationChecker;
