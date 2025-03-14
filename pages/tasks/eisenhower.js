import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import EisenhowerMatrix from '../../components/EisenhowerMatrix';
import { toast } from 'react-toastify';

export default function EisenhowerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchTasks();
    }
  }, [status, router]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Obtener todas las tareas pendientes
      const res = await fetch('/api/tasks?completed=false');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        throw new Error('Error al cargar tareas');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('No se pudieron cargar las tareas');
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
        <title>Matriz de Eisenhower | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Matriz de Eisenhower</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => router.push('/tasks')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Vista lista
          </button>
          <button 
            onClick={() => router.push('/tasks/quick')}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 focus:outline-none flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Tarea Rápida
          </button>
          <button 
            onClick={() => router.push('/tasks/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Tarea
          </button>
        </div>
      </div>

      <EisenhowerMatrix tasks={tasks} />
    </Layout>
  );
}
