import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';

export default function TaskNotificationChecker() {
  const [lastCheck, setLastCheck] = useState(null);
  const { status, data: session } = useSession();

  useEffect(() => {
    const checkForPendingTasks = async () => {
      // Only check for tasks if the user is authenticated
      if (status !== 'authenticated' || !session) {
        console.log("Not checking tasks - user not authenticated");
        return;
      }

      try {
        console.log("Attempting to fetch task notifications...");
        
        // CRITICAL FIX: Use window.location.origin to ensure we fetch from the current domain
        const baseUrl = window.location.origin;
        const res = await fetch(`${baseUrl}/api/tasks/upcoming-summary`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log("Response status:", res.status);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`Error checking tasks: ${res.status}`, errorText);
          return;
        }
        
        try {
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
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError);
        }
      } catch (error) {
        console.error("Error checking tasks for notifications:", error);
      }
    };

    // Only run if authenticated and wait to ensure session is fully loaded
    if (status === 'authenticated' && session) {
      // Add slight delay to ensure session is fully established
      const timer = setTimeout(() => {
        checkForPendingTasks();
      }, 1500);
      
      // Check every 3 hours
      const interval = setInterval(checkForPendingTasks, 3 * 60 * 60 * 1000);
      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [status, session]); // Re-run when authentication status changes

  return null; // This component doesn't render anything
}
