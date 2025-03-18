import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import ResourceForm from '../../../components/ResourceForm';
import { toast } from 'react-toastify';

export default function EditResource() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [resource, setResource] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (id && status === 'authenticated') {
      fetchResource();
      fetchSubjects();
    }
  }, [id, status, router]);

  const fetchResource = async () => {
    try {
      const res = await fetch(`/api/resources/${id}`);
      if (res.ok) {
        const data = await res.json();
        setResource(data);
        
        // También cargar las tareas relacionadas si es necesario
        try {
          const tasksRes = await fetch(`/api/resources/${id}/tasks`);
          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            // Almacenar las tareas relacionadas en el recurso
            setResource(prev => ({
              ...prev,
              relatedTasks: tasksData.map(task => task._id)
            }));
          }
        } catch (error) {
          console.error('Error fetching related tasks:', error);
        }
      } else {
        throw new Error('Error al cargar el recurso');
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
      toast.error('Error al cargar el recurso');
      router.push('/resources');
    } finally {
      setLoading(false);
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
      toast.error('Error al cargar las asignaturas');
    }
  };

  const handleSuccess = () => {
    toast.success('Recurso actualizado exitosamente');
    router.push(`/resources/${id}`);
  };

  const handleCancel = () => {
    router.back();
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
        <title>Editar Recurso | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar Recurso</h1>
      </div>

      <ResourceForm 
        resource={resource} 
        subjects={subjects} 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </Layout>
  );
}

// Add this to support server-side rendering and require authentication
export async function getServerSideProps(context) {
  return {
    props: {}, // will be passed to the page component as props
  };
}
