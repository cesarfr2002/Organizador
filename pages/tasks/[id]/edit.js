import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../../components/Layout';
import TaskForm from '../../../components/TaskForm';
import Head from 'next/head';
import { toast } from 'react-toastify';

export default function EditTask() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Cargar los datos de la tarea al montar el componente
  useEffect(() => {
    if (id && status === 'authenticated') {
      fetchTask();
    }
  }, [id, status]);

  const fetchTask = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (!res.ok) {
        throw new Error('Error al cargar la tarea');
      }
      
      const data = await res.json();
      
      // Asegurarse de que la fecha se muestre correctamente
      if (data.dueDate) {
        console.log("Fecha recibida:", data.dueDate);
      }
      
      setTask(data);
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Error al cargar los datos de la tarea');
      router.push('/tasks');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    try {
      console.log("Actualizando tarea con datos:", formData);
      
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar la tarea');
      }
      
      toast.success('Tarea actualizada con éxito');
      router.push('/tasks');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.message || 'Error al actualizar la tarea');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isFetching) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    // Redireccionar al login si no hay sesión
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  if (!task) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-xl text-gray-600 mb-4">No se encontró la tarea</p>
          <button 
            onClick={() => router.push('/tasks')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver a tareas
          </button>
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
          Modifica los detalles de tu tarea
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <TaskForm 
          initialData={task}
          onSubmit={handleSubmit}
          submitText="Actualizar Tarea"
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
}
