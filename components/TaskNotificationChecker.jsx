import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';

export default function TaskNotificationChecker() {
  const [lastCheck, setLastCheck] = useState(null);
  const { status } = useSession();

  useEffect(() => {
    const checkForPendingTasks = async () => {
      // Only check for tasks if the user is authenticated
      if (status !== 'authenticated') {
        return;
      }

      try {
        const res = await fetch('/api/tasks/upcoming-summary-public');
        
        if (!res.ok) {
          console.error(`Error checking tasks: ${res.status}`);
          return;
        }
        
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Response is not JSON:', await res.text());
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

    // Check on component mount if authenticated
    if (status === 'authenticated') {
      checkForPendingTasks();
      
      // Check every 3 hours
      const interval = setInterval(checkForPendingTasks, 3 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [status]); // Re-run when authentication status changes

  return null; // This component doesn't render anything
}
