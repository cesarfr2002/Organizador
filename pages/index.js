import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import DashboardStats from '../components/DashboardStats';
import TaskList from '../components/TaskList';
import UpcomingEvents from '../components/UpcomingEvents';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // Fetch upcoming tasks
      const taskRes = await fetch('/api/tasks/upcoming');
      const taskData = await taskRes.json();
      setTasks(taskData);
      
      // Fetch upcoming events/classes
      const eventRes = await fetch('/api/events/upcoming');
      const eventData = await eventRes.json();
      setEvents(eventData);
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div>Cargando...</div>;
  }

  return (
    <>
      <Head>
        <title>UniOrganizer - Tu asistente académico</title>
      </Head>
      <Layout>
        <h1 className="text-2xl font-bold mb-6">Bienvenido, {session?.user?.name}</h1>
        <DashboardStats />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Tareas Pendientes</h2>
            <TaskList tasks={tasks} onTaskUpdate={fetchDashboardData} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-4">Próximas Clases</h2>
            <UpcomingEvents events={events} />
          </div>
        </div>
      </Layout>
    </>
  );
}
