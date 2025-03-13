import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import PomodoroTimer from '../components/PomodoroTimer';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Pomodoro() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { taskId } = router.query;
  
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    todaySessions: 0,
    todayMinutes: 0,
    weekSessions: 0,
    weekMinutes: 0
  });
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectStats, setSubjectStats] = useState({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      // Cargar historial de sesiones del localStorage
      const savedSessions = localStorage.getItem('pomodoroSessions');
      if (savedSessions) {
        try {
          const parsedSessions = JSON.parse(savedSessions);
          setSessions(parsedSessions);
          calculateStats(parsedSessions);
        } catch (error) {
          console.error('Error parsing saved pomodoro sessions:', error);
        }
      }
      
      // Fetch subjects and tasks
      fetchSubjects();
      fetchTasks();
    }
  }, [status, router]);

  // Add effect to load specific task when taskId is available
  useEffect(() => {
    if (taskId && status === 'authenticated') {
      fetchTaskById(taskId);
    }
  }, [taskId, status]);

  useEffect(() => {
    if (selectedSubject) {
      calculateSubjectStats(selectedSubject);
    }
  }, [selectedSubject, sessions]);

  const handleSessionComplete = (session) => {
    // Agregar la nueva sesión al historial
    const newSessions = [
      { 
        id: Date.now().toString(), 
        ...session
      },
      ...sessions
    ];
    
    // Actualizar el estado
    setSessions(newSessions);
    
    // Guardar en localStorage
    localStorage.setItem('pomodoroSessions', JSON.stringify(newSessions));
    
    // Recalcular estadísticas
    calculateStats(newSessions);
    
    // Si hay una tarea, actualizar su tiempo de estudio
    if (session.task) {
      updateTaskStudyTime(session.task, session.duration);
    }
  };

  const updateTaskStudyTime = async (taskId, minutes) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/studytime`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ minutes }),
      });
      
      if (!res.ok) {
        throw new Error('Error al actualizar el tiempo de estudio');
      }
    } catch (error) {
      console.error('Error updating task study time:', error);
    }
  };

  const calculateStats = (sessionsData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);
    
    let totalSessions = 0;
    let totalMinutes = 0;
    let todaySessions = 0;
    let todayMinutes = 0;
    let weekSessions = 0;
    let weekMinutes = 0;
    
    const subjectStatsMap = {};
    
    sessionsData.forEach(session => {
      const sessionDate = new Date(session.date);
      
      // Totales
      totalSessions++;
      totalMinutes += session.duration;
      
      // Hoy
      if (sessionDate.toDateString() === today.toDateString()) {
        todaySessions++;
        todayMinutes += session.duration;
      }
      
      // Esta semana
      if (sessionDate >= oneWeekAgo) {
        weekSessions++;
        weekMinutes += session.duration;
      }
      
      // Por asignatura
      if (session.subject) {
        if (!subjectStatsMap[session.subject]) {
          subjectStatsMap[session.subject] = {
            sessions: 0,
            minutes: 0
          };
        }
        subjectStatsMap[session.subject].sessions++;
        subjectStatsMap[session.subject].minutes += session.duration;
      }
    });
    
    setStats({
      totalSessions,
      totalMinutes,
      todaySessions,
      todayMinutes,
      weekSessions,
      weekMinutes
    });
    
    setSubjectStats(subjectStatsMap);
  };

  const calculateSubjectStats = (subjectId) => {
    if (!subjectId) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todaySessions = 0;
    let todayMinutes = 0;
    let totalSessions = 0;
    let totalMinutes = 0;
    
    sessions.forEach(session => {
      if (session.subject === subjectId) {
        const sessionDate = new Date(session.date);
        
        // Totales para esta asignatura
        totalSessions++;
        totalMinutes += session.duration;
        
        // Hoy para esta asignatura
        if (sessionDate.toDateString() === today.toDateString()) {
          todaySessions++;
          todayMinutes += session.duration;
        }
      }
    });
    
    return {
      todaySessions,
      todayMinutes,
      totalSessions,
      totalMinutes
    };
  };

  const clearHistory = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo el historial de pomodoros? Esta acción no se puede deshacer.')) {
      setSessions([]);
      setStats({
        totalSessions: 0,
        totalMinutes: 0,
        todaySessions: 0,
        todayMinutes: 0,
        weekSessions: 0,
        weekMinutes: 0
      });
      localStorage.removeItem('pomodoroSessions');
      toast.success('Historial de pomodoros borrado');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'PPP', { locale: es });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'HH:mm', { locale: es });
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s._id === subjectId);
    return subject ? subject.name : 'Sin asignatura';
  };

  const getTaskTitle = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    return task ? task.title : 'Sin tarea específica';
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks?completed=false');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  // Add new function to fetch a specific task
  const fetchTaskById = async (id) => {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (res.ok) {
        const task = await res.json();
        setSelectedTask(task);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Error al cargar la tarea');
    }
  };

  if (status === 'loading') {
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
        <title>Técnica Pomodoro | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Técnica Pomodoro</h1>
        {selectedTask && (
          <div className="mt-1 text-blue-600">
            Trabajando en: {selectedTask.title}
          </div>
        )}
        <p className="text-gray-600 mt-1">
          Utiliza la técnica Pomodoro para mejorar tu concentración y productividad. Trabaja durante 25 minutos y luego toma un descanso de 5 minutos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PomodoroTimer 
            onSessionComplete={handleSessionComplete} 
            selectedTask={selectedTask}
            tasks={tasks}
            subjects={subjects}
          />
          
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Sobre la técnica Pomodoro</h2>
            </div>
            <div className="text-sm text-gray-600">
              <p className="mb-2">
                La técnica Pomodoro fue desarrollada por Francesco Cirillo a finales de los años 80. 
                Es un método de gestión del tiempo que utiliza intervalos de trabajo de 25 minutos (llamados "pomodoros") 
                separados por breves descansos.
              </p>
              <p className="mb-2">
                <strong>¿Cómo funciona?</strong>
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Elige una tarea a realizar</li>
                <li>Configura el temporizador (tradicionalmente 25 minutos)</li>
                <li>Trabaja en la tarea hasta que suene el temporizador</li>
                <li>Toma un breve descanso (5 minutos)</li>
                <li>Después de cuatro pomodoros, toma un descanso más largo (15-30 minutos)</li>
              </ol>
              <p className="mt-2">
                Esta técnica te ayuda a mantener la concentración, combatir la procrastinación y gestionar mejor tu energía a lo largo del día.
              </p>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Estadísticas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-sm text-blue-700">Sesiones hoy</p>
                <p className="text-2xl font-bold text-blue-800">
                  {stats.todaySessions}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <p className="text-sm text-green-700">Minutos hoy</p>
                <p className="text-2xl font-bold text-green-800">
                  {stats.todayMinutes}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <p className="text-sm text-purple-700">Total sesiones</p>
                <p className="text-2xl font-bold text-purple-800">
                  {stats.totalSessions}
                </p>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg text-center">
                <p className="text-sm text-indigo-700">Total horas</p>
                <p className="text-2xl font-bold text-indigo-800">
                  {Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m
                </p>
              </div>
            </div>
            
            {sessions.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Historial reciente</h3>
                <div className="max-h-80 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duración
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.slice(0, 10).map((session) => (
                        <tr key={session.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">
                            <div className="font-medium text-gray-900">{formatDate(session.date)}</div>
                            <div className="text-gray-500">{formatTime(session.date)}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-800">
                            {session.duration} min
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <button
                    onClick={clearHistory}
                    className="text-xs text-red-600 hover:text-red-900"
                  >
                    Borrar historial
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Más información */}
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Beneficios</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Reduce la ansiedad relacionada con el tiempo</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Aumenta la concentración y reduce las distracciones</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Mejora la conciencia sobre cómo utilizas tu tiempo</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Ayuda a combatir la procrastinación</span>
              </li>
              <li className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Mantiene la motivación con objetivos pequeños y alcanzables</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Gráfico de uso (Representación simple) */}
      {sessions.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Análisis de estudio</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Tiempo por asignatura (últimos 7 días)</h3>
              <div className="h-64 relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Esta visualización se generará a partir de tu historial de estudio.
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Distribución semanal</h3>
              <div className="grid grid-cols-7 gap-2 h-36">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => {
                  // Aquí iría la lógica real para calcular el tiempo estudiado por día de la semana
                  const height = Math.random() * 100; // Este es solo un ejemplo
                  return (
                    <div key={day} className="flex flex-col items-center">
                      <div className="flex-grow w-full flex items-end">
                        <div 
                          className="bg-blue-500 w-full rounded-t"
                          style={{ height: `${height}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{day}</div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Nota: Este es un ejemplo visual. Los datos reales se mostrarán cuando acumules más sesiones de estudio.
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
