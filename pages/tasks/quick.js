import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import QuickTaskForm from '../../components/QuickTaskForm';
import TaskList from '../../components/TaskList';
import { toast } from 'react-toastify';

export default function QuickTasks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchRecentTasks();
    }
  }, [status, router]);

  const fetchRecentTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks?limit=5&sortBy=createdAt&order=desc');
      if (res.ok) {
        const data = await res.json();
        setRecentTasks(data);
      } else {
        throw new Error('Error al cargar tareas recientes');
      }
    } catch (error) {
      console.error('Error fetching recent tasks:', error);
      toast.error('No se pudieron cargar las tareas recientes');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = () => {
    fetchRecentTasks();
    toast.success('¡Tarea creada! 🚀');
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
        <title>Tareas Rápidas | UniOrganizer</title>
      </Head>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-6">Crear Tarea Rápida</h1>
          <QuickTaskForm onSuccess={handleTaskCreated} />
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Consejos de productividad</h2>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Consejo:</strong> Divide las tareas grandes en subtareas más pequeñas y específicas. 
                Esto facilita el seguimiento del progreso y reduce la procrastinación.
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <button 
                  onClick={() => router.push('/tasks/eisenhower')}
                  className="text-blue-600 hover:text-blue-800 font-medium flex items-center mt-1"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Ver matriz de Eisenhower para priorizar tareas
                </button>
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Tareas Recientes</h2>
            <button
              onClick={() => router.push('/tasks')}
              className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
            >
              Ver todas
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>
          
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-20 rounded-md"></div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-4">
              <TaskList 
                tasks={recentTasks} 
                onTaskUpdate={fetchRecentTasks}
                showCategory={true}
                showPriority={true}
              />
            </div>
          )}
          
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-3">Acciones rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => router.push('/tasks/new')}
                className="flex items-center justify-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Tarea detallada
              </button>
              <button 
                onClick={() => router.push('/calendar/new')}
                className="flex items-center justify-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                Nuevo evento
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
