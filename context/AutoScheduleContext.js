import { createContext, useState, useContext, useEffect } from 'react';
import { generateScheduleSuggestions } from '../utils/autoScheduler';
import { toast } from 'react-toastify';

const AutoScheduleContext = createContext();

export const AutoScheduleProvider = ({ children }) => {
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(false);
  const [scheduleSuggestions, setScheduleSuggestions] = useState([]);
  const [lastGeneratedDate, setLastGeneratedDate] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Load auto schedule preference from localStorage
    const savedPreference = localStorage.getItem('autoScheduleEnabled');
    if (savedPreference) {
      setAutoScheduleEnabled(savedPreference === 'true');
    }
    
    // Load any existing schedule suggestions
    const savedSuggestions = localStorage.getItem('scheduleSuggestions');
    if (savedSuggestions) {
      try {
        setScheduleSuggestions(JSON.parse(savedSuggestions));
      } catch (error) {
        console.error('Error parsing saved schedule suggestions:', error);
      }
    }
    
    const savedGeneratedDate = localStorage.getItem('lastScheduleGeneratedDate');
    if (savedGeneratedDate) {
      setLastGeneratedDate(new Date(savedGeneratedDate));
    }
  }, []);

  // Auto-generate schedules when enabled
  const toggleAutoSchedule = async () => {
    const newValue = !autoScheduleEnabled;
    setAutoScheduleEnabled(newValue);
    localStorage.setItem('autoScheduleEnabled', newValue.toString());
    
    if (newValue) {
      // If enabling, generate schedule and show notification
      toast.info('Auto programación activada. Generando horario sugerido...');
      await generateAndSaveSchedule();
    } else {
      // If disabling, show notification and optionally remove auto-scheduled events
      toast.info('Auto programación desactivada');
      await cleanupAutoScheduledEvents();
    }
  };
  
  // Generate schedule and save directly to calendar
  const generateAndSaveSchedule = async () => {
    if (!autoScheduleEnabled && !isGenerating) return;
    
    setIsGenerating(true);
    try {
      // Fetch required data
      const [tasksRes, calendarRes] = await Promise.all([
        fetch('/api/tasks?status=pending'),
        fetch('/api/calendar/events')
      ]);
      
      const tasks = await tasksRes.json();
      const classSchedule = await calendarRes.json();
      
      // Default scheduling options
      const options = {
        travelTimeBefore: 120,
        travelTimeAfter: 120,
        daysToSchedule: 7,
        minFreeTimeBlock: 30,
        maxDailyStudyHours: 5
      };
      
      // Generate schedule suggestions
      const result = generateScheduleSuggestions(classSchedule, tasks, options);
      
      if (!result.success) {
        toast.warn(result.message || 'No se pudieron generar sugerencias de horario');
        return;
      }
      
      // Save suggestions in context
      saveScheduleSuggestions(result.suggestions);
      
      // Add suggestions directly to calendar
      if (result.suggestions.length > 0) {
        await addSuggestionsToCalendar(result.suggestions);
        toast.success(`Se han programado ${result.suggestions.length} tareas en tu calendario`);
      }
      
    } catch (error) {
      console.error('Error generating auto-schedule:', error);
      toast.error('Error al generar el horario automático');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Add suggested schedules to the calendar
  const addSuggestionsToCalendar = async (suggestions) => {
    try {
      // Remove any existing auto-scheduled events first
      await cleanupAutoScheduledEvents();
      
      // Format suggestions as calendar events
      const calendarEvents = suggestions.map(suggestion => ({
        title: `📚 ${suggestion.title}`,
        startTime: new Date(suggestion.startTime),
        endTime: new Date(suggestion.endTime),
        type: 'study',
        description: `Tiempo programado automáticamente para: ${suggestion.title}`,
        location: '',
        taskId: suggestion.taskId,
        color: '#4F46E5', // Indigo color for auto-scheduled tasks
        isAutoScheduled: true
      }));
      
      // Try to add each event individually if bulk fails
      try {
        // First try bulk add
        const bulkRes = await fetch('/api/calendar/events/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: calendarEvents })
        });
        
        if (!bulkRes.ok) {
          throw new Error('Error in bulk operation, trying individually');
        }
      } catch (bulkError) {
        console.log('Trying individual event creation as fallback');
        
        // If bulk fails, try adding events individually
        for (const event of calendarEvents) {
          try {
            await fetch('/api/calendar/events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(event)
            });
          } catch (individualError) {
            console.error('Error adding individual event:', individualError);
          }
        }
      }
      
    } catch (error) {
      console.error('Error adding suggestions to calendar:', error);
      toast.error('Error al añadir los eventos al calendario');
    }
  };
  
  // Clean up auto-scheduled events from calendar
  const cleanupAutoScheduledEvents = async () => {
    try {
      const res = await fetch('/api/calendar/events/auto-scheduled', {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Error al eliminar eventos auto-programados');
      }
    } catch (error) {
      console.error('Error cleaning up auto-scheduled events:', error);
    }
  };
  
  const saveScheduleSuggestions = (suggestions) => {
    setScheduleSuggestions(suggestions);
    setLastGeneratedDate(new Date());
    localStorage.setItem('scheduleSuggestions', JSON.stringify(suggestions));
    localStorage.setItem('lastScheduleGeneratedDate', new Date().toISOString());
  };
  
  const clearScheduleSuggestions = async () => {
    setScheduleSuggestions([]);
    localStorage.removeItem('scheduleSuggestions');
    localStorage.removeItem('lastScheduleGeneratedDate');
    setLastGeneratedDate(null);
    
    // Also remove from calendar
    await cleanupAutoScheduledEvents();
    toast.info('Se han eliminado todas las tareas auto-programadas');
  };

  // Add periodic regeneration of schedule
  useEffect(() => {
    if (autoScheduleEnabled) {
      // Check if we need to regenerate (e.g., it's been more than 1 day)
      const shouldRegenerate = !lastGeneratedDate || 
        (new Date() - new Date(lastGeneratedDate)) > (24 * 60 * 60 * 1000);
      
      if (shouldRegenerate) {
        generateAndSaveSchedule();
      }
    }
  }, [autoScheduleEnabled]);

  return (
    <AutoScheduleContext.Provider 
      value={{ 
        autoScheduleEnabled, 
        toggleAutoSchedule, 
        scheduleSuggestions,
        saveScheduleSuggestions,
        clearScheduleSuggestions,
        lastGeneratedDate,
        generateAndSaveSchedule,
        isGenerating
      }}
    >
      {children}
    </AutoScheduleContext.Provider>
  );
};

export const useAutoSchedule = () => {
  return useContext(AutoScheduleContext);
};
