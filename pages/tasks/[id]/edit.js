import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import TaskForm from '../../../components/TaskForm';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function EditTask() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && id) {
      Promise.all([fetchTask(), fetchSubjects()]).then(() => {
        setLoading(false);
      }).catch(error => {
        console.error('Error loading data:', error);
        setLoading(false);
      });
    }
  }, [status, id]);

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      } else {
        throw new Error('Error al cargar la tarea');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('No se pudo cargar la tarea');
      router.push('/tasks');
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      } else {
        throw new Error('Error al cargar asignaturas');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('No se pudieron cargar las asignaturas');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.')) {
      try {
        const res = await fetch(`/api/tasks/${id}`, {
          method: 'DELETE'
        });
        
        if (res.ok) {
          toast.success('Tarea eliminada correctamente');
          router.push('/tasks');
        } else {
          throw new Error('Error al eliminar la tarea');
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Error al eliminar la tarea');
      }
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
        <title>Editar Tarea | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Editar Tarea</h1>
        <div className="flex space-x-2">
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a la lista
          </Link>
          <button 
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar tarea
          </button>
        </div>
      </div>

      {task && (
        <TaskForm 
          task={task} 
          subjects={subjects} 
          isEditing={true} 
        />
      )}
    </Layout>
  );
}
