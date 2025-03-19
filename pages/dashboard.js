import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import TaskList from '../components/TaskList';
import PomodoroWidget from '../components/PomodoroWidget';
import { format, isToday, isThisWeek, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Check authentication status
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, eventsRes, subjectsRes] = await Promise.all([
        fetch('/api/tasks?limit=5&sortBy=dueDate&order=asc'),
        fetch('/api/events?limit=5&sortBy=startTime&order=asc'),
        fetch('/api/subjects')
      ]);

      const [tasksData, eventsData, subjectsData] = await Promise.all([
        tasksRes.json(),
        eventsRes.json(),
        subjectsRes.json()
      ]);

      setUpcomingTasks(tasksData);
      setUpcomingEvents(eventsData);
      setSubjects(subjectsData);

      const overdueTasks = tasksData.filter(task => task.dueDate && isPast(new Date(task.dueDate)) && !task.completed);
      const todayTasks = tasksData.filter(task => task.dueDate && isToday(new Date(task.dueDate)) && !task.completed);

      setOverdueCount(overdueTasks.length);
      setTodayCount(todayTasks.length);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar notificaciones y saludar al usuario en el dashboard
  useEffect(() => {
    // Verificar notificaciones existentes y saludar basado en hora del día
    const checkWelcome = () => {
      const hour = new Date().getHours();
      let greeting;
      
      if (hour < 12) greeting = "¡Buenos días!";
      else if (hour < 18) greeting = "¡Buenas tardes!";
      else greeting = "¡Buenas noches!";
      
      toast.success(`${greeting} Bienvenido a tu Dashboard`, {
        position: "bottom-right",
        autoClose: 5000,
      });
    };
    
    if (user) {
      checkWelcome();
      
      // También podemos verificar las tareas pendientes en el dashboard
      const verifyTasks = async () => {
        try {
          const res = await fetch('/api/tasks/upcoming-summary');
          const data = await res.json();
          
          if (data.todayCount > 0 || data.overdueCount > 0) {
            toast.info(
              <div>
                <div className="font-bold">Resumen de tus tareas</div>
                {data.todayCount > 0 && (
                  <div className="text-sm">Tienes {data.todayCount} tarea(s) para hoy</div>
                )}
                {data.overdueCount > 0 && (
                  <div className="text-sm">Tienes {data.overdueCount} tarea(s) atrasada(s)</div>
                )}
              </div>,
              { delay: 2000, autoClose: 7000 }
            );
          }
        } catch (err) {
          console.error("Error al verificar tareas:", err);
        }
      };
      
      // Ejecutar verificación de tareas con un pequeño retraso
      setTimeout(verifyTasks, 3000);
    }
  }, [user]);

  // If still loading or no user, show loading state
  if (loading || !user) {
    return <div className="flex justify-center items-center min-h-screen">Cargando...</div>
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard | UniOrganizer</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-blue-800 mb-2">Asignaturas</h2>
          <p className="text-3xl font-bold">{subjects.length}</p>
          <p className="mt-2 text-blue-600">{subjects.filter(s => s.status === 'active').length} activas</p>
        </div>
        <div className="bg-amber-50 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-amber-800 mb-2">Tareas</h2>
          <p className="text-3xl font-bold">{upcomingTasks.length}</p>
          <div className="mt-2 flex items-center">
            {todayCount > 0 && (
              <span className="text-red-600 mr-3">{todayCount} para hoy</span>
            )}
            {overdueCount > 0 && (
              <span className="text-red-600">{overdueCount} atrasadas</span>
            )}
          </div>
        </div>
        <div className="bg-violet-50 p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-violet-800 mb-2">Próximos eventos</h2>
          <p className="text-3xl font-bold">{upcomingEvents.length}</p>
          <p className="mt-2 text-violet-600">
            {upcomingEvents.filter(e => isThisWeek(new Date(e.startTime))).length} esta semana
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tareas próximas */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Tareas próximas</h2>
              <Link href="/tasks" className="text-blue-600 hover:text-blue-800 text-sm">
                Ver todas
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="animate-pulse space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : upcomingTasks.length > 0 ? (
                <TaskList tasks={upcomingTasks.slice(0, 5)} onTaskUpdate={fetchData} />
              ) : (
                <p className="text-gray-500 text-center py-4">No hay tareas próximas</p>
              )}
            </div>
          </div>

          {/* Próximos eventos */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Próximos eventos</h2>
              <Link href="/calendar" className="text-blue-600 hover:text-blue-800 text-sm">
                Ver calendario
              </Link>
            </div>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map(event => (
                  <div key={event._id} className="flex items-start p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-[60px] text-center">
                      <div className="bg-white border border-gray-200 rounded-md py-1">
                        <p className="text-sm font-bold text-gray-900">
                          {format(new Date(event.startTime), 'dd', { locale: es })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(event.startTime), 'MMM', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3 flex-grow">
                      <h3 className="text-sm font-medium">{event.title}</h3>
                      <div className="flex text-xs text-gray-500 mt-1 items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{format(new Date(event.startTime), 'HH:mm', { locale: es })}</span>
                        {event.location && (
                          <>
                            <svg className="w-3 h-3 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{event.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No hay eventos próximos</p>
            )}
          </div>
        </div>

        {/* Barra lateral */}
        <div className="space-y-6">
          <PomodoroWidget />
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Accesos rápidos</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/tasks/quick" className="bg-amber-50 text-amber-700 hover:bg-amber-100 p-3 rounded-lg flex flex-col items-center text-sm">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Tarea rápida</span>
              </Link>
              <Link href="/tasks/new" className="bg-blue-50 text-blue-700 hover:bg-blue-100 p-3 rounded-lg flex flex-col items-center text-sm">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>Nueva tarea</span>
              </Link>
              <Link href="/calendar/new" className="bg-green-50 text-green-700 hover:bg-green-100 p-3 rounded-lg flex flex-col items-center text-sm">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Nuevo evento</span>
              </Link>
              <Link href="/subjects/new" className="bg-purple-50 text-purple-700 hover:bg-purple-100 p-3 rounded-lg flex flex-col items-center text-sm">
                <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Nueva asignatura</span>
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium mb-4">Progreso del semestre</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <p className="text-sm text-gray-600 text-right">45% completado</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col">
                <span className="text-gray-500">Inicio</span>
                <span className="font-medium">15 Sep 2023</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-gray-500">Finalización</span>
                <span className="font-medium">15 Dic 2023</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Resumen de productividad */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium mb-4">Productividad reciente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Tiempo de estudio</h3>
            <div className="h-48 flex items-center justify-center text-gray-400">
              <p>Los datos de productividad se mostrarán aquí cuando uses el temporizador Pomodoro.</p>
            </div>
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Tareas completadas</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className="text-xs font-medium w-16">Hoy</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <div className="text-xs font-medium w-8 text-right">2/10</div>
              </div>
              <div className="flex items-center">
                <div className="text-xs font-medium w-16">Esta semana</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
                <div className="text-xs font-medium w-8 text-right">9/30</div>
              </div>
              <div className="flex items-center">
                <div className="text-xs font-medium w-16">Este mes</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <div className="text-xs font-medium w-8 text-right">24/60</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <Link href="/pomodoro" className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Iniciar temporizador Pomodoro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}