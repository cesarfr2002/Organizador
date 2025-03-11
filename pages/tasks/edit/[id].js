import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import TaskForm from '../../../components/TaskForm';
import { toast } from 'react-toastify';

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
      fetchTaskAndSubjects();
    }
  }, [status, router, id]);

  const fetchTaskAndSubjects = async () => {
    setLoading(true);
    try {
      // Cargar la tarea
      const taskRes = await fetch(`/api/tasks/${id}`);
      if (!taskRes.ok) {
        throw new Error('Error al cargar la tarea');
      }
      const taskData = await taskRes.json();
      setTask(taskData);
      
      // Cargar las asignaturas
      const subjectsRes = await fetch('/api/subjects');
      if (!subjectsRes.ok) {
        throw new Error('Error al cargar asignaturas');
      }
      const subjectsData = await subjectsRes.json();
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los datos');
      router.push('/tasks');
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

  if (!task) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-xl text-gray-600">Tarea no encontrada</p>
            <button 
              onClick={() => router.push('/tasks')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Volver a tareas
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Editar Tarea | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar Tarea</h1>
        <p className="text-gray-600 mt-1">
          Actualiza la información de tu tarea
        </p>
      </div>

      <TaskForm 
        task={task} 
        subjects={subjects}
        isEditing={true}
      />
    </Layout>
  );
}
