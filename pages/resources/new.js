import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Layout from '../../components/Layout';
import ResourceForm from '../../components/ResourceForm';
import { toast } from 'react-toastify';

export default function NewResource() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { subjectId } = router.query;
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
        throw new Error('Error al cargar asignaturas');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error al cargar las asignaturas');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    toast.success('Recurso creado exitosamente');
    if (subjectId) {
      router.push(`/subjects/${subjectId}`);
    } else {
      router.push('/resources');
    }
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
        <title>Nuevo Recurso | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Crear Nuevo Recurso</h1>
      </div>

      <ResourceForm 
        subjects={subjects}
        subjectId={subjectId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Layout>
  );
}

// Add this to make the page require authentication and disable automatic static optimization
export async function getServerSideProps(context) {
  return {
    props: {}, // will be passed to the page component as props
  };
}
