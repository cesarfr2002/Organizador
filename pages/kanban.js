import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';

export default function KanbanPage() {
  const router = useRouter();
  
  // This page should redirect to the tasks page with kanban view
  useEffect(() => {
    router.replace('/tasks?view=kanban');
  }, [router]);
  
  return (
    <Layout>
      <Head>
        <title>Kanban | UniOrganizer</title>
      </Head>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3">Redirecting to Kanban view...</p>
      </div>
    </Layout>
  );
}
