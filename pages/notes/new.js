import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import NoteEditor from '../../components/NoteEditor';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function NewNote() {
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
        <title>Nueva Nota | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Nueva Nota</h1>
        <Link href="/notes" className="text-blue-600 hover:text-blue-800">
          Volver a la lista
        </Link>
      </div>

      <NoteEditor />
    </Layout>
  );
}
