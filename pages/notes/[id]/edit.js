import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import NoteEditor from '../../../components/NoteEditor';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function EditNote() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (status === 'loading' || !id) {
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
        <title>Editar Nota | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Editar Nota</h1>
        <Link href="/notes" className="text-blue-600 hover:text-blue-800">
          Volver a la lista
        </Link>
      </div>

      <NoteEditor noteId={id} />
    </Layout>
  );
}
