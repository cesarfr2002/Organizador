import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import QuickTaskForm from '../../components/QuickTaskForm';
import { toast } from 'react-toastify';

export default function QuickTask() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchSubjects();
    }
  }, [status, router]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      } else {
        toast.error('Error al cargar asignaturas');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error al cargar asignaturas');
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
        <title>Tarea Rápida | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tarea Rápida</h1>
        <p className="text-gray-600 mt-1">
          Crea una tarea rápidamente con los campos esenciales
        </p>
      </div>

      <QuickTaskForm subjects={subjects} />
    </Layout>
  );
}
