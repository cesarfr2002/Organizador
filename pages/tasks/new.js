import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Layout from '../../components/Layout';
import TaskForm from '../../components/TaskForm';
import Head from 'next/head';
import { toast } from 'react-toastify';

export default function NewTask() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Obtener el subject preseleccionado si existe en la URL
  const initialData = {};
  if (router.query.subject) {
    initialData.subject = router.query.subject;
  }
  
  // Si estamos en modo de tarea rápida (vía URL)
  const isQuickTask = router.pathname.includes('/tasks/quick');

  if (status === 'loading') {
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

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    try {
      console.log("Enviando datos de tarea:", formData);
      
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al crear la tarea');
      }
      
      toast.success('Tarea creada con éxito');
      
      // Si es modo rápido, volver a la página anterior, si no ir a lista de tareas
      if (isQuickTask) {
        router.back();
      } else {
        router.push('/tasks');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Error al crear la tarea');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>{isQuickTask ? 'Tarea Rápida' : 'Nueva Tarea'} | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">{isQuickTask ? 'Tarea Rápida' : 'Nueva Tarea'}</h1>
        <p className="text-gray-600 mt-1">
          {isQuickTask 
            ? 'Crea una tarea rápidamente con los campos esenciales' 
            : 'Añade una nueva tarea a tu lista con todos los detalles necesarios'}
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <TaskForm 
          initialData={initialData}
          onSubmit={handleSubmit}
          submitText="Crear Tarea"
          isLoading={isLoading}
        />
      </div>
    </Layout>
  );
}
