import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function TaskNotificationChecker() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  // Check for due tasks and display notifications
  useEffect(() => {
    if (!user) return;
    
    const checkDueTasks = async () => {
      try {
        const response = await fetch('/api/tasks/due-soon');
        if (response.ok) {
          const tasks = await response.json();
          
          // Create notifications for tasks due within 24 hours
          tasks.forEach(task => {
            addNotification({
              title: `Tarea próxima: ${task.title}`,
              message: `La tarea "${task.title}" vence pronto.`,
              type: 'task',
              itemId: task._id
            });
          });
        }
      } catch (error) {
        console.error('Error checking due tasks:', error);
      }
    };
    
    // Check on mount
    checkDueTasks();
    
    // Set up interval (every hour)
    const interval = setInterval(checkDueTasks, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, addNotification]);
  
  return null;
}
