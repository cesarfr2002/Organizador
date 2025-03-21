import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import SubjectForm from '../../../components/SubjectForm';
import { toast } from 'react-toastify';

export default function EditSubject() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && id) {
      fetchSubject();
    }
  }, [status, router, id]);

  const fetchSubject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subjects/${id}`);
      if (!res.ok) {
        throw new Error('Error al cargar la asignatura');
      }
      const data = await res.json();
      setSubject(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los datos de la asignatura');
      router.push('/subjects');
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

  if (!subject) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-xl text-gray-600">Asignatura no encontrada</p>
            <button 
              onClick={() => router.push('/subjects')}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Volver a asignaturas
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Editar {subject.name} | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar Asignatura</h1>
        <p className="text-gray-600 mt-1">
          Actualiza la información de {subject.name}
        </p>
      </div>

      <SubjectForm 
        subject={subject}
        isEditing={true}
      />
    </Layout>
  );
}
