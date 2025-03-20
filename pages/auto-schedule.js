import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Head from 'next/head';
import { useAutoSchedule } from '../context/AutoScheduleContext';
import { toast } from 'react-toastify';
import { format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AutoSchedule() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { 
    autoScheduleEnabled, 
    toggleAutoSchedule,
    scheduleSuggestions,
    generateAndSaveSchedule,
    clearScheduleSuggestions,
    lastGeneratedDate,
    isGenerating
  } = useAutoSchedule();
  
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupByDay, setGroupByDay] = useState(true);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  
  // Fetch pending tasks
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch('/api/tasks?status=pending');
        
        if (res.ok) {
          const data = await res.json();
          setPendingTasks(data.filter(task => 
            task.estimatedTime > 0 && !task.completed && task.status !== 'completed'
          ));
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Error al cargar las tareas');
      } finally {
        setLoading(false);
      }
    }
    
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, router]);
  
  // Manually regenerate schedule
  const handleRegenerateSchedule = async () => {
    await generateAndSaveSchedule();
    toast.success('Horario regenerado correctamente');
  };
  
  // Clear all auto-scheduled events
  const handleClearSchedule = async () => {
    if (confirm('¿Estás seguro de eliminar todas las tareas auto-programadas?')) {
      await clearScheduleSuggestions();
    }
  };
  
  // Group suggestions by day for display
  const getSuggestionsByDay = () => {
    const grouped = {};
    
    scheduleSuggestions.forEach(suggestion => {
      const date = new Date(suggestion.startTime);
      const dayKey = format(date, 'yyyy-MM-dd');
      
      if (!grouped[dayKey]) {
        grouped[dayKey] = {
          date: date,
          formattedDate: format(date, "EEEE, d 'de' MMMM", { locale: es }),
          items: []
        };
      }
      
      grouped[dayKey].items.push(suggestion);
    });
    
    // Sort days chronologically
    return Object.values(grouped).sort((a, b) => a.date - b.date);
  };
  
  const suggestionsByDay = getSuggestionsByDay();
  
  return (
    <Layout>
      <Head>
        <title>Auto Programación | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Auto Programación</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Agenda automática de tareas según tu horario libre
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Auto Programación
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoScheduleEnabled} 
              onChange={toggleAutoSchedule} 
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Status panel */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium dark:text-white">Estado de la programación</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {autoScheduleEnabled
                ? "La programación automática está activada"
                : "La programación automática está desactivada"}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRegenerateSchedule}
              disabled={isGenerating || !autoScheduleEnabled}
              className={`flex items-center px-4 py-2 text-white bg-blue-600 rounded-md ${
                (isGenerating || !autoScheduleEnabled) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerar horario
                </>
              )}
            </button>
            <button
              onClick={handleClearSchedule}
              disabled={scheduleSuggestions.length === 0}
              className={`flex items-center px-4 py-2 text-gray-700 bg-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-md ${
                scheduleSuggestions.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar programación
            </button>
          </div>
        </div>

        {/* Last generated info */}
        {lastGeneratedDate && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Última generación: {format(new Date(lastGeneratedDate), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
          </div>
        )}
      </div>

      {/* Dashboard stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-2 dark:text-white">Tareas programadas</h3>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {scheduleSuggestions.length}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            De un total de {pendingTasks.length} tareas pendientes
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-2 dark:text-white">Tiempo de estudio</h3>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {Math.round(scheduleSuggestions.reduce((acc, task) => acc + task.duration, 0) / 60)} hrs
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total de tiempo programado
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-2 dark:text-white">Próximos días</h3>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {suggestionsByDay.length}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Días con tareas programadas
          </p>
        </div>
      </div>

      {/* Toggle view mode */}
      <div className="flex justify-end mb-4">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-md inline-flex">
          <button
            onClick={() => setGroupByDay(true)}
            className={`py-2 px-4 text-sm rounded-md ${
              groupByDay 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            Por día
          </button>
          <button
            onClick={() => setGroupByDay(false)}
            className={`py-2 px-4 text-sm rounded-md ${
              !groupByDay 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            Cronológico
          </button>
        </div>
      </div>

      {/* Scheduled tasks */}
      {loading ? (
        <div className="flex justify-center items-center h-60">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : scheduleSuggestions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No hay tareas auto-programadas</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {autoScheduleEnabled 
              ? 'No hay tareas pendientes que puedan ser programadas automáticamente.'
              : 'Activa la auto programación para comenzar a organizar tus tareas.'}
          </p>
          {autoScheduleEnabled && pendingTasks.length > 0 && (
            <button
              onClick={handleRegenerateSchedule}
              className="inline-flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Generar programación
            </button>
          )}
        </div>
      ) : groupByDay ? (
        // Grouped by day view
        <div className="space-y-6">
          {suggestionsByDay.map((day) => (
            <div key={day.date.toString()} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">
                  {day.formattedDate}
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {day.items.map((task) => (
                  <div key={task.taskId} className="p-4 flex items-center">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">{task.title}</h4>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {format(new Date(task.startTime), 'HH:mm')} - {format(new Date(task.endTime), 'HH:mm')}
                        <span className="mx-2">•</span>
                        <span>{task.duration} min</span>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === 'Alta' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                          : task.priority === 'Media'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Chronological view
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-200 dark:divide-gray-700">
          {scheduleSuggestions.map((task) => (
            <div key={task.taskId} className="p-4 flex items-center">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 dark:text-gray-200">{task.title}</h4>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(new Date(task.startTime), "EEEE, d 'de' MMMM", { locale: es })}
                  <span className="mx-2">•</span>
                  {format(new Date(task.startTime), 'HH:mm')} - {format(new Date(task.endTime), 'HH:mm')}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  task.priority === 'Alta' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                    : task.priority === 'Media'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {task.priority}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {task.duration} min
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info section */}
      {autoScheduleEnabled && (
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
          <h3 className="font-medium mb-2">Sobre la auto programación</h3>
          <p>El sistema genera automáticamente un horario de estudio basado en:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Tu horario de clases actual</li>
            <li>Las tareas pendientes con tiempo estimado</li>
            <li>Prioridades y fechas de entrega</li>
            <li>Tiempo de traslado entre clases (2 horas)</li>
          </ul>
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  // Check for the auth cookie directly
  const cookies = req.headers.cookie || '';
  const hasAuthCookie = cookies.includes('uorganizer_auth_token=');
  
  if (!hasAuthCookie) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: {}
  };
}
