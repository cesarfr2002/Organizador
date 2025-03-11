import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import DashboardStats from '../components/DashboardStats';
import TaskList from '../components/TaskList';
import UpcomingEvents from '../components/UpcomingEvents';
import DailySchedule from '../components/DailySchedule';
import QuickActions from '../components/QuickActions';
import StudyTimer from '../components/StudyTimer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [dashboardLayout, setDashboardLayout] = useState({
    showTimer: true,
    showUpcomingEvents: true,
    // Más configuraciones de personalización
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      // Fetch upcoming tasks (ahora incluye prioridades)
      const taskRes = await fetch('/api/tasks/upcoming');
      const taskData = await taskRes.json();
      setTasks(taskData);
      
      // Fetch upcoming events/classes
      const eventRes = await fetch('/api/events/upcoming');
      const eventData = await eventRes.json();
      setEvents(eventData);

      // Obtener el horario del día actual
      const today = new Date().getDay() || 7; // 1-7 (lunes-domingo)
      const scheduleRes = await fetch(`/api/schedule/day/${today}`);
      const scheduleData = await scheduleRes.json();
      setTodaySchedule(scheduleData);
      
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });

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
    <>
      <Head>
        <title>UniOrganizer - Tu asistente académico</title>
      </Head>
      <Layout>
        {/* Encabezado con fecha y bienvenida */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              ¡Hola, {session?.user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-600">{formattedDate}</p>
          </div>
          <QuickActions />
        </div>
        
        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda - 2/3 del ancho */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <DashboardStats />
            
            {/* Tareas prioritarias */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Tareas Prioritarias</h2>
                <button 
                  onClick={() => router.push('/tasks')}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  Ver todas
                  <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <TaskList 
                tasks={tasks.filter((task, index) => 
                  task.priority === 'Alta' || index < 3
                )} 
                onTaskUpdate={fetchDashboardData} 
                showPriority={true}
              />
            </div>
            
            {/* Horario del día */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Mi día</h2>
                <button 
                  onClick={() => router.push('/schedule')}
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                  Ver horario completo
                  <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <DailySchedule schedule={todaySchedule} />
            </div>
          </div>
          
          {/* Columna derecha - 1/3 del ancho */}
          <div className="space-y-6">
            {/* Timer de estudio */}
            {dashboardLayout.showTimer && (
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-xl font-semibold mb-4">Temporizador</h2>
                <StudyTimer />
              </div>
            )}
            
            {/* Eventos próximos */}
            {dashboardLayout.showUpcomingEvents && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Próximos Eventos</h2>
                  <button 
                    onClick={() => router.push('/calendar')}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    Calendario
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <UpcomingEvents events={events} />
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}
