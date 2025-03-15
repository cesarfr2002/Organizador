import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TaskNotificationChecker = () => {
  const [tasks, setTasks] = useState([]);
  const router = useRouter();
  const lastCheckRef = useRef(0);
  const CHECK_INTERVAL = 1000 * 60 * 30; // Check every 30 minutes instead of constantly

  useEffect(() => {
    // Load notified tasks from localStorage on mount
    const loadNotifiedTasks = () => {
      try {
        const storedNotifiedTasks = localStorage.getItem('notifiedTasks');
        return storedNotifiedTasks ? JSON.parse(storedNotifiedTasks) : {};
      } catch (error) {
        console.error('Error loading notified tasks from localStorage:', error);
        return {};
      }
    };

    const checkTasks = async () => {
      // Check if enough time has passed since last check
      const now = Date.now();
      if (now - lastCheckRef.current < CHECK_INTERVAL && lastCheckRef.current !== 0) {
        return; // Skip check if not enough time has passed
      }
      
      lastCheckRef.current = now;
      
      try {
        const response = await fetch('/api/tasks');
        if (!response.ok) throw new Error('Error fetching tasks');
        
        const data = await response.json();
        setTasks(data);
        
        // Get previously notified tasks
        const notifiedTasks = loadNotifiedTasks();
        
        // Current date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Tomorrow date
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Filter tasks that are due today or tomorrow
        const urgentTasks = data.filter(task => {
          if (!task.dueDate || task.completed) return false;
          
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          const isToday = dueDate.getTime() === today.getTime();
          const isTomorrow = dueDate.getTime() === tomorrow.getTime();
          
          return isToday || isTomorrow;
        });
        
        // Show notification for tasks that haven't been notified today
        urgentTasks.forEach(task => {
          const taskId = task._id;
          const dueDate = new Date(task.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          const todayKey = format(today, 'yyyy-MM-dd');
          const taskKey = `${taskId}_${todayKey}`;
          
          // Check if we've already notified for this task today
          if (!notifiedTasks[taskKey]) {
            const isToday = dueDate.getTime() === today.getTime();
            const message = isToday
              ? `La tarea "${task.title}" vence hoy.`
              : `La tarea "${task.title}" vence mañana.`;
              
            toast.info(
              <div>
                <p className="font-medium">{message}</p>
                <button 
                  onClick={() => router.push(`/tasks/${taskId}`)}
                  className="mt-2 px-4 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                >
                  Ver detalles
                </button>
              </div>,
              {
                autoClose: 10000,
              }
            );
            
            // Mark this task as notified for today
            notifiedTasks[taskKey] = true;
          }
        });
        
        // Save updated notified tasks
        localStorage.setItem('notifiedTasks', JSON.stringify(notifiedTasks));
        
        // Clean up old notifications (older than 2 days)
        cleanupOldNotifications(notifiedTasks);
        
      } catch (error) {
        console.error('Error checking tasks for notifications:', error);
      }
    };
    
    // Clean up old notifications to prevent localStorage from growing too large
    const cleanupOldNotifications = (notifiedTasks) => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const updatedNotifications = {};
      
      Object.keys(notifiedTasks).forEach(key => {
        const parts = key.split('_');
        if (parts.length === 2) {
          const dateStr = parts[1];
          const notifDate = new Date(dateStr);
          
          if (notifDate >= twoDaysAgo) {
            updatedNotifications[key] = notifiedTasks[key];
          }
        }
      });
      
      localStorage.setItem('notifiedTasks', JSON.stringify(updatedNotifications));
    };

    // Initial check when component mounts
    checkTasks();
    
    // Set up periodic checking if needed
    const interval = setInterval(checkTasks, CHECK_INTERVAL);
    
    return () => {
      clearInterval(interval);
    };
  }, [router.pathname]); // Only re-run when pathname changes

  return null; // This component doesn't render anything
};

export default TaskNotificationChecker;
