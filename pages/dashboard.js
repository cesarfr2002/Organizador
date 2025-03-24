import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import DashboardStats from '../components/DashboardStats';
import TaskList from '../components/TaskList';
import UpcomingEventsList from '../components/UpcomingEventsList';
import QuickTaskForm from '../components/QuickTaskForm';
import NotesWidget from '../components/NotesWidget';
import { getSession } from 'next-auth/react';

export default function Dashboard() {
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch upcoming tasks
        const taskRes = await fetch('/api/tasks?limit=5&sortBy=dueDate&order=asc');
        
        if (taskRes.ok) {
          const taskData = await taskRes.json();
          setUpcomingTasks(taskData.tasks || []);
        } else {
          console.error('Error fetching tasks:', taskRes.status);
          setUpcomingTasks([]);
        }
        
        // Fetch upcoming events
        const eventRes = await fetch('/api/events?limit=5&sortBy=startTime&order=asc');
        
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setUpcomingEvents(Array.isArray(eventData.events) ? eventData.events : []);
        } else {
          console.error('Error fetching events:', eventRes.status);
          setUpcomingEvents([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set default empty arrays to prevent errors
        setUpcomingTasks([]);
        setUpcomingEvents([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Make sure upcomingEvents is always an array before using filter
  const todayEvents = Array.isArray(upcomingEvents) 
    ? upcomingEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        const today = new Date();
        return eventDate.getDate() === today.getDate() &&
               eventDate.getMonth() === today.getMonth() &&
               eventDate.getFullYear() === today.getFullYear();
      })
    : [];

  return (
    <Layout>
      <Head>
        <title>Dashboard | Organizador</title>
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h1>
        
        {/* Dashboard Stats */}
        <DashboardStats />
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Column 1 - Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-800 dark:text-white">Tareas Próximas</h2>
              </div>
              <div className="p-4">
                <TaskList tasks={upcomingTasks} isLoading={isLoading} limit={5} />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-800 dark:text-white">Eventos de Hoy</h2>
              </div>
              <div className="p-4">
                <UpcomingEventsList events={todayEvents} isLoading={isLoading} emptyMessage="No hay eventos programados para hoy" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-800 dark:text-white">Notas Recientes</h2>
              </div>
              <div className="p-4">
                <NotesWidget limit={3} />
              </div>
            </div>
          </div>
          
          {/* Column 2 - Quick Add & Widgets */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
              <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-800 dark:text-white">Añadir Tarea Rápida</h2>
              </div>
              <div className="p-4">
                <QuickTaskForm />
              </div>
            </div>
            
            {/* Add more widgets here */}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: { session }
  };
}