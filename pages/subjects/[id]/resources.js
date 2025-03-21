import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import ResourceList from '../../../components/ResourceList';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function SubjectResources() {
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
  }, [status, id]);

  const fetchSubject = async () => {
    try {
      const res = await fetch(`/api/subjects/${id}`);
      if (!res.ok) {
        throw new Error('Error al obtener la asignatura');
      }
      const data = await res.json();
      setSubject(data);
    } catch (error) {
      console.error('Error fetching subject:', error);
      toast.error('Error al cargar la asignatura');
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
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold text-red-600">Asignatura no encontrada</h2>
          <Link href="/subjects" className="mt-4 inline-block text-blue-600">
            Volver a la lista de asignaturas
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Recursos de {subject.name} | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href={`/subjects/${id}`} className="text-blue-600 hover:text-blue-800">
            &larr; Volver a la asignatura
          </Link>
          <h1 className="text-2xl font-bold mt-2 flex items-center">
            Recursos de {subject.name}
            <span 
              className="ml-2 w-4 h-4 rounded-full" 
              style={{ backgroundColor: subject.color }}
            ></span>
          </h1>
        </div>
      </div>

      <ResourceList subjectId={id} />
    </Layout>
  );
}
