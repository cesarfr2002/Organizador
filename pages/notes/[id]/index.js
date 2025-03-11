import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { marked } from 'marked';

export default function NoteDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && id) {
      fetchNote();
    }
  }, [status, id]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${id}`);
      
      if (!res.ok) {
        throw new Error('Error al obtener la nota');
      }
      
      const data = await res.json();
      setNote(data);
    } catch (error) {
      console.error('Error fetching note:', error);
      toast.error('Error al cargar la nota');
      router.push('/notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta nota? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Nota eliminada correctamente');
        router.push('/notes');
      } else {
        throw new Error('Error al eliminar la nota');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error al eliminar la nota');
    }
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: es });
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

  if (!note) {
    return (
      <Layout>
        <div className="text-center py-10">
          <h2 className="text-xl font-semibold text-red-600">Nota no encontrada</h2>
          <Link href="/notes" className="mt-4 inline-block text-blue-600">
            Volver a la lista de notas
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{note.title} | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <Link href="/notes" className="text-blue-600 hover:text-blue-800">
          &larr; Volver a la lista
        </Link>
        
        <div className="flex space-x-3">
          <Link href={`/notes/${id}/edit`} className="text-gray-600 hover:text-gray-800">
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800"
          >
            Eliminar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          {/* Cabecera */}
          <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
              {note.subject && (
                <span
                  className="px-3 py-1 text-sm rounded-full"
                  style={{
                    backgroundColor: `${note.subject.color}20`,
                    color: note.subject.color
                  }}
                >
                  {note.subject.name}
                </span>
              )}
            </div>

            <div className="mt-2 text-sm text-gray-500">
              <p>Creada: {formatDate(note.createdAt)}</p>
              <p>Actualizada: {formatDate(note.updatedAt)}</p>
            </div>

            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {note.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: marked(note.content || '') }} />
        </div>
      </div>
    </Layout>
  );
}
