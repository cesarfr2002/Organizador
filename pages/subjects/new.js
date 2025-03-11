import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import SubjectForm from '../../components/SubjectForm';

export default function NewSubject() {
  const { data: session, status } = useSession();
  const router = useRouter();

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

  return (
    <Layout>
      <Head>
        <title>Nueva Asignatura | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nueva Asignatura</h1>
        <p className="text-gray-600 mt-1">
          Registra una nueva asignatura para tu semestre actual
        </p>
      </div>

      <SubjectForm />
    </Layout>
  );
}
