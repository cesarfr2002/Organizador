import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import ResourceList from '../../components/ResourceList';

export default function Resources() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (status === 'loading') {
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
        <title>Recursos | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mis Recursos</h1>
        <p className="text-gray-600">
          Administra tus recursos educativos y materiales de estudio
        </p>
      </div>

      <ResourceList />
    </Layout>
  );
}
