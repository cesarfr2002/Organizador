import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Head from 'next/head';
import { format, differenceInDays, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { useAutoSchedule } from '../context/AutoScheduleContext';
import { generateScheduleSuggestions } from '../utils/autoScheduler';

export default function AutoSchedule() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classSchedule, setClassSchedule] = useState([]);
  const [scheduleOptions, setScheduleOptions] = useState({
    travelTimeBefore: 120, // 2 hours
    travelTimeAfter: 120,  // 2 hours
    daysToSchedule: 7,     // next 7 days
    minFreeTimeBlock: 30,  // 30 minutes minimum
    maxDailyStudyHours: 5  // max 5 hours per day
  });
  const [suggestionsByDay, setSuggestionsByDay] = useState({});
  const [unscheduledTasks, setUnscheduledTasks] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  
  const { 
    autoScheduleEnabled, 
    scheduleSuggestions, 
    saveScheduleSuggestions, 
    clearScheduleSuggestions,
    lastGeneratedDate,
    generateAndSaveSchedule,
    isGenerating
  } = useAutoSchedule();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  useEffect(() => {
    if (scheduleSuggestions && scheduleSuggestions.length > 0) {
      // Group suggestions by day for display
      groupSuggestionsByDay(scheduleSuggestions);
    }
  }, [scheduleSuggestions]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch tasks
      const tasksRes = await fetch('/api/tasks?status=pending');
      const tasksData = await tasksRes.json();
      
      // Fetch subjects with schedule
      const subjectsRes = await fetch('/api/subjects');
      const subjectsData = await subjectsRes.json();
      
      // Fetch calendar events for class schedule
      const calendarRes = await fetch('/api/calendar/events');
      const calendarData = await calendarRes.json();

      setTasks(tasksData);
      setSubjects(subjectsData);
      setClassSchedule(calendarData);
      
      // Process existing suggestions if we have them
      if (scheduleSuggestions && scheduleSuggestions.length > 0) {
        groupSuggestionsByDay(scheduleSuggestions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };
  
  const groupSuggestionsByDay = (suggestions) => {
    const byDay = {};
    const unscheduled = [];
    
    // Group scheduled tasks by day
    suggestions.forEach(suggestion => {
      const day = format(new Date(suggestion.startTime), 'yyyy-MM-dd');
      
      if (!byDay[day]) {
        byDay[day] = [];
      }
      
      byDay[day].push(suggestion);
    });
    
    // Sort each day's suggestions by start time
    Object.keys(byDay).forEach(day => {
      byDay[day].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });
    
    // Find unscheduled tasks
    if (tasks.length > 0) {
      const scheduledTaskIds = new Set(suggestions.map(s => s.taskId));
      
      tasks.forEach(task => {
        if (!scheduledTaskIds.has(task._id) && !task.completed && task.estimatedTime > 0) {
          unscheduled.push(task);
        }
      });
    }
    
    setSuggestionsByDay(byDay);
    setUnscheduledTasks(unscheduled);
  };

  const generateSchedule = async () => {
    if (!autoScheduleEnabled) {
      toast.info('Por favor activa la auto programación en configuraciones primero');
      return;
    }
    
    // Use the new method that also adds to calendar
    await generateAndSaveSchedule();
  };

  const handleOptionsChange = (e) => {
    const { name, value } = e.target;
    setScheduleOptions(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };

  const formatScheduleTime = (date) => {
    return format(new Date(date), 'HH:mm', { locale: es });
  };
  
  const formatDayHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    
    if (isSameDay(date, today)) {
      return 'Hoy - ' + format(date, 'EEEE d MMMM', { locale: es });
    }
    
    if (isSameDay(addDays(today, 1), date)) {
      return 'Mañana - ' + format(date, 'EEEE d MMMM', { locale: es });
    }
    
    return format(date, 'EEEE d MMMM', { locale: es });
  };
  
  const getTaskBackground = (priority, subject) => {
    if (subject && subject.color) {
      return {
        backgroundColor: `${subject.color}20`,
        borderLeftColor: subject.color
      };
    }
    
    // Default colors based on priority
    switch (priority) {
      case 'Alta':
        return { backgroundColor: '#FEE2E2', borderLeftColor: '#EF4444' };
      case 'Media':
        return { backgroundColor: '#FEF3C7', borderLeftColor: '#F59E0B' };
      case 'Baja':
        return { backgroundColor: '#D1FAE5', borderLeftColor: '#10B981' };
      default:
        return { backgroundColor: '#E5E7EB', borderLeftColor: '#6B7280' };
    }
  };
  
  // Add task to calendar - this would need to be implemented
  const addToCalendar = async (suggestion) => {
    try {
      const eventData = {
        title: `Estudiar: ${suggestion.title}`,
        startTime: suggestion.startTime, // No need to create a new Date here, it's already a Date object
        endTime: suggestion.endTime,     // No need to create a new Date here, it's already a Date object
        type: 'study',
        description: `Tiempo programado para trabajar en: ${suggestion.title}`,
        location: '',
        alert: 15, // 15 minute alert
        taskId: suggestion.taskId,
        color: '#4F46E5', // Indigo color 
        isAutoScheduled: true
      };
      
      // Log the data being sent for debugging
      console.log('Adding event to calendar:', eventData);
      
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`Error: ${errorData.error || res.statusText}`);
      }
      
      const result = await res.json();
      toast.success('Evento añadido al calendario');
      return result;
    } catch (error) {
      console.error('Error adding to calendar:', error);
      toast.error('No se pudo añadir el evento al calendario');
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Auto Programación | UniOrganizer</title>
      </Head>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Auto Programación</h1>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Opciones
          </button>
          
          <button
            onClick={generateSchedule}
            disabled={isGenerating || !autoScheduleEnabled}
            className={`px-4 py-1.5 rounded-md flex items-center ${
              autoScheduleEnabled 
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Generar horario
          </button>
        </div>
      </div>

      {/* Add calendar integration notice */}
      {autoScheduleEnabled && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Las tareas auto-programadas se muestran automáticamente en tu calendario. 
                Puedes verlas en la vista de <a href="/calendar" className="font-medium underline">Calendario</a>.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Settings panel */}
      {showOptions && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium mb-4 dark:text-white">Opciones de programación</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tiempo de viaje antes de clases (minutos)
              </label>
              <input
                type="number"
                min="0"
                max="360"
                name="travelTimeBefore"
                value={scheduleOptions.travelTimeBefore}
                onChange={handleOptionsChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tiempo de viaje después de clases (minutos)
              </label>
              <input
                type="number"
                min="0"
                max="360"
                name="travelTimeAfter"
                value={scheduleOptions.travelTimeAfter}
                onChange={handleOptionsChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Días a programar
              </label>
              <input
                type="number"
                min="1"
                max="30"
                name="daysToSchedule"
                value={scheduleOptions.daysToSchedule}
                onChange={handleOptionsChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bloque mínimo de tiempo libre (minutos)
              </label>
              <input
                type="number"
                min="15"
                max="180"
                step="5"
                name="minFreeTimeBlock"
                value={scheduleOptions.minFreeTimeBlock}
                onChange={handleOptionsChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Máximo horas de estudio diarias
              </label>
              <input
                type="number"
                min="1"
                max="12"
                name="maxDailyStudyHours"
                value={scheduleOptions.maxDailyStudyHours}
                onChange={handleOptionsChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
      
      {!autoScheduleEnabled && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-md">
          <p className="text-amber-700">
            La auto programación está desactivada. Actívala en la página de configuración para generar horarios.
          </p>
          <button
            onClick={() => router.push('/settings')}
            className="mt-2 text-amber-700 font-medium hover:text-amber-900"
          >
            Ir a configuración
          </button>
        </div>
      )}
      
      {/* Show last generated date information */}
      {lastGeneratedDate && (
        <div className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Último horario generado: {format(new Date(lastGeneratedDate), 'PPpp', { locale: es })}
          <button 
            onClick={clearScheduleSuggestions}
            className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Limpiar sugerencias
          </button>
        </div>
      )}
      
      {/* Generated schedules display */}
      {Object.keys(suggestionsByDay).length > 0 ? (
        <div className="space-y-6">
          {Object.keys(suggestionsByDay).sort().map(day => (
            <div key={day} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="bg-blue-50 dark:bg-blue-900 p-3 border-b border-blue-100 dark:border-blue-800">
                <h2 className="text-lg font-medium text-blue-800 dark:text-blue-200">
                  {formatDayHeader(day)}
                </h2>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  {suggestionsByDay[day].map((suggestion, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-md border-l-4"
                      style={getTaskBackground(suggestion.priority, suggestion.subject)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{suggestion.title}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {formatScheduleTime(suggestion.startTime)} - {formatScheduleTime(suggestion.endTime)}
                            <span className="mx-1">•</span>
                            {suggestion.duration} minutos
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => router.push(`/tasks/${suggestion.taskId}`)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            title="Ver tarea"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={() => router.push(`/pomodoro?taskId=${suggestion.taskId}`)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Iniciar Pomodoro"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={() => addToCalendar(suggestion)}
                            className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400"
                            title="Añadir al calendario"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow text-center">
          {autoScheduleEnabled ? (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">No hay sugerencias de horario</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Haz clic en "Generar horario" para crear automáticamente una agenda de estudio
              </p>
            </>
          ) : (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Auto programación desactivada</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Activa la auto programación en configuraciones para utilizar esta función
              </p>
            </>
          )}
        </div>
      )}
      
      {/* Unscheduled tasks section */}
      {unscheduledTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Tareas sin programar</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Las siguientes tareas no pudieron ser programadas, posiblemente porque requieren más tiempo del disponible o por otras restricciones.
              </p>
              
              <div className="space-y-2">
                {unscheduledTasks.map(task => (
                  <div 
                    key={task._id}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-l-4 border-amber-500"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium dark:text-white">{task.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Tiempo estimado: {task.estimatedTime} minutos
                          {task.dueDate && (
                            <>
                              <span className="mx-1">•</span>
                              Fecha límite: {format(new Date(task.dueDate), 'PPP', { locale: es })}
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <button
                          onClick={() => router.push(`/tasks/${task._id}/edit`)}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
