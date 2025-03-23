import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export default function TaskNotificationChecker() {
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    const checkForPendingTasks = async () => {
      try {
        const res = await fetch('/api/tasks/upcoming-summary');
        
        if (!res.ok) {
          console.error(`Error checking tasks: ${res.status}`);
          return;
        }
        
        const data = await res.json();
        
        if (data.todayCount > 0) {
          toast.info(`Tienes ${data.todayCount} tarea(s) para hoy`, {
            position: "bottom-right",
            autoClose: 5000,
          });
        }
        
        if (data.overdueCount > 0) {
          toast.warning(`Tienes ${data.overdueCount} tarea(s) atrasada(s)`, {
            position: "bottom-right",
            autoClose: 5000,
          });
        }
        
        setLastCheck(new Date());
      } catch (error) {
        console.error("Error checking tasks for notifications:", error);
      }
    };

    // Check on component mount
    checkForPendingTasks();
    
    // Check every 3 hours
    const interval = setInterval(checkForPendingTasks, 3 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}
