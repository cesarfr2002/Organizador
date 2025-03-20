import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import DailySchedule from '../components/DailySchedule';
import UpcomingEvents from '../components/UpcomingEvents';
import QuickActions from '../components/QuickActions';
import DashboardStats from '../components/DashboardStats';
import StudyTimer from '../components/StudyTimer';
import { toast } from 'react-toastify';
import RecentResources from '../components/RecentResources';
import QuickResourceForm from '../components/QuickResourceForm';
import SearchResources from '../components/SearchResources';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, router, selectedDate]); // Re-fetch when selectedDate changes
  
  // Generate schedule for a specific date based on day of week
  const generateScheduleForDate = (subjects, targetDate) => {
    // Get day of week for target date (1-7, where 1 is Monday)
    const targetDay = targetDate.getDay() || 7;
    const scheduleForDate = [];
    
    subjects.forEach(subject => {
      const daySlots = (subject.schedule || []).filter(slot => slot.day === targetDay);
      
      daySlots.forEach(slot => {
        // Create a date object for this event on the target date
        const eventDate = new Date(targetDate);
        eventDate.setHours(0, 0, 0, 0); // Reset time
        
        scheduleForDate.push({
          ...slot,
          subjectId: subject._id,
          name: subject.name,
          professor: subject.professor,
          color: subject.color,
          date: eventDate // Add specific date
        });
      });
    });
    
    // Sort by start time
    scheduleForDate.sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
    
    return scheduleForDate;
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch subjects for schedule
      const subjectsRes = await fetch('/api/subjects');
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData);
        
        // Generate schedule for selected date
        const classesForSelectedDate = generateScheduleForDate(subjectsData, selectedDate);
        setTodaySchedule(classesForSelectedDate);
      }
    } catch (error) {
      console.error('Error fetching dashboard data', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions for date selection
  const goToPreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  if (isAuthenticated === 'loading' || loading) {
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
        <title>Dashboard | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {user ? `¡Hola, ${user.name}!` : 'Dashboard'}
        </h1>
        <p className="text-gray-600">
          Bienvenido a tu panel de control académico
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna principal - ocupa 8/12 en pantallas grandes */}
        <div className="lg:col-span-8 space-y-6">
          {/* Estadísticas */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b dark:border-gray-700">Resumen</h2>
            <div className="p-4">
              <DashboardStats />
            </div>
          </section>

          {/* Temporizador de estudio */}
          <section id="study-timer" className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b dark:border-gray-700">Temporizador de estudio</h2>
            <div className="p-6">
              <StudyTimer />
            </div>
          </section>
        </div>
        
        {/* Columna lateral - ocupa 4/12 en pantallas grandes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Acciones rápidas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b dark:border-gray-700">Acciones rápidas</h2>
            <div className="p-4">
              <QuickActions />
              
              {/* Botón para mostrar/ocultar formulario de recursos */}
              <button 
                onClick={() => setShowResourceForm(!showResourceForm)}
                className="mt-3 w-full flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-800"
              >
                {showResourceForm ? 'Ocultar formulario de recursos' : '+ Agregar recurso rápido'}
              </button>
              
              {/* Formulario condicional para agregar recursos */}
              {showResourceForm && (
                <div className="mt-3">
                  <QuickResourceForm />
                </div>
              )}
              
              {/* Agregar búsqueda de recursos */}
              <SearchResources />
            </div>
          </div>
          
          {/* Horario del día con navegación */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={goToPreviousDay}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Día anterior"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <h2 className="text-lg font-semibold dark:text-white">
                  {isSameDay(selectedDate, new Date())
                    ? 'Horario de hoy'
                    : isSameDay(selectedDate, addDays(new Date(), 1))
                      ? 'Horario de mañana'
                      : `Horario del ${format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}`}
                </h2>
                
                <button 
                  onClick={goToNextDay}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Día siguiente"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {!isSameDay(selectedDate, new Date()) && (
                <button 
                  onClick={goToToday}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  title="Ir a hoy"
                >
                  Volver a hoy
                </button>
              )}
            </div>
            
            <div className="p-4">
              <DailySchedule schedule={todaySchedule} selectedDate={selectedDate} />
            </div>
          </section>
          
          {/* Tareas pendientes */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b dark:border-gray-700">Tareas pendientes</h2>
            <div className="p-4">
              <UpcomingEvents />
            </div>
          </section>
          
          {/* Recursos recientes - Nueva sección */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b dark:border-gray-700 flex justify-between items-center">
              <span>Recursos</span>
              <button 
                onClick={() => router.push('/resources')}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                title="Ver todos los recursos"
              >
                <span className="mr-1">Ver todos</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </h2>
            <div className="p-4">
              <RecentResources />
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  // Check for auth cookie instead of NextAuth session
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