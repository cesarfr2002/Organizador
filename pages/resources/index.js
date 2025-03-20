import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import ResourceList from '../../components/ResourceList';
import { useAuth } from '../../context/AuthContext';

export default function ResourcesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    router.push('/login');
    return null;
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

export async function getServerSideProps({ req, res }) {
  const cookies = req.headers.cookie || '';
  const hasAuthCookie = cookies.includes('uorganizer_auth_token=');
  
  if (!hasAuthCookie) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: {}
  };
}
