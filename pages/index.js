import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
import QuickResourceForm from '../components/QuickResourceForm'; // Importar el nuevo componente
import SearchResources from '../components/SearchResources';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showResourceForm, setShowResourceForm] = useState(false); // Estado para controlar la visibilidad del formulario
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch subjects for today's schedule
      const subjectsRes = await fetch('/api/subjects');
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        setSubjects(subjectsData);
        
        // Process schedule for today
        const today = new Date().getDay() || 7; // 1-7, where 1 is Monday
        const todayClasses = [];
        
        subjectsData.forEach(subject => {
          const todaySlots = (subject.schedule || []).filter(slot => slot.day === today);
          
          todaySlots.forEach(slot => {
            todayClasses.push({
              ...slot,
              subjectId: subject._id,
              name: subject.name,
              professor: subject.professor,
              color: subject.color
            });
          });
        });
        
        // Sort by start time
        todayClasses.sort((a, b) => {
          return a.startTime.localeCompare(b.startTime);
        });
        
        setTodaySchedule(todayClasses);
      }
    } catch (error) {
      console.error('Error fetching dashboard data', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
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
        <title>Dashboard | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {session ? `¡Hola, ${session.user.name}!` : 'Dashboard'}
        </h1>
        <p className="text-gray-600">
          Bienvenido a tu panel de control académico
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna principal - ocupa 8/12 en pantallas grandes */}
        <div className="lg:col-span-8 space-y-6">
          {/* Estadísticas */}
          <section className="bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b">Resumen</h2>
            <div className="p-4">
              <DashboardStats />
            </div>
          </section>
          
          {/* Temporizador de estudio */}
          <section id="study-timer" className="bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b">Temporizador de estudio</h2>
            <div className="p-6">
              <StudyTimer />
            </div>
          </section>
        </div>
        
        {/* Columna lateral - ocupa 4/12 en pantallas grandes */}
        <div className="lg:col-span-4 space-y-6">
          {/* Acciones rápidas */}
          <div className="bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b">Acciones rápidas</h2>
            <div className="p-4">
              <QuickActions />
              
              {/* Botón para mostrar/ocultar formulario de recursos */}
              <button 
                onClick={() => setShowResourceForm(!showResourceForm)}
                className="mt-3 w-full flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
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
          
          {/* Horario del día */}
          <section className="bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b">Horario de hoy</h2>
            <div className="p-4">
              <DailySchedule schedule={todaySchedule} />
            </div>
          </section>
          
          {/* Tareas pendientes (antes "Próximos eventos") */}
          <section className="bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b">Tareas pendientes</h2>
            <div className="p-4">
              <UpcomingEvents />
            </div>
          </section>
          
          {/* Recursos recientes - Nueva sección */}
          <section className="bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold p-4 border-b flex justify-between items-center">
              <span>Recursos</span>
              <button 
                onClick={() => router.push('/resources')}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
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
