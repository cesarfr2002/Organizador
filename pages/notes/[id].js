import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { marked } from 'marked';
import Layout from '../../components/Layout';
import NoteRelatedTasks from '../../components/NoteRelatedTasks';
import Link from 'next/link';
import Head from 'next/head';

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
    
    // Configurar marked para manejar correctamente el Markdown
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true,
      sanitize: false
    });
    
    if (status === 'authenticated' && id) {
      fetchNote();
    }
  }, [status, id, router]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setNote(data);
      } else {
        throw new Error('Error al cargar la nota');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
      toast.error('No se pudo cargar la nota');
      router.push('/notes');
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async () => {
    if (!confirm('¿Estás seguro de eliminar esta nota?')) {
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
        <div className="text-center">
          <p>No se encontró la nota solicitada.</p>
          <Link href="/notes" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
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
        <h1 className="text-2xl font-bold">{note.title}</h1>
        <div className="flex space-x-2">
          <Link href="/notes" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a la lista
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenido principal de la nota */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {note.subject && (
                <span
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ 
                    backgroundColor: `${note.subject.color}20`,
                    color: note.subject.color 
                  }}
                >
                  {note.subject.name}
                </span>
              )}
              {note.tags && note.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800"
                >
                  #{tag}
                </span>
              ))}
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                {format(new Date(note.updatedAt), 'PPP', { locale: es })}
              </span>
            </div>

            <div className="prose prose-sm md:prose lg:prose-lg max-w-none mb-6">
              {note.content ? (
                <div dangerouslySetInnerHTML={{ __html: marked.parse(note.content) }} />
              ) : (
                <p className="text-gray-500 italic">Esta nota no tiene contenido.</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/notes/${note._id}/edit`)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Editar
                </button>
                <button
                  onClick={deleteNote}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Eliminar
                </button>
              </div>
              
              {note.contentStats && (
                <div className="text-sm text-gray-500">
                  {note.contentStats.words} palabras · {note.contentStats.readingTime} min lectura
                </div>
              )}
            </div>
          </div>
          
          {/* Imágenes de la nota */}
          {note.images && note.images.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Imágenes ({note.images.length})</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {note.images.map((img, index) => (
                  <div key={index} className="border rounded overflow-hidden">
                    <a href={img} target="_blank" rel="noopener noreferrer">
                      <img
                        src={img}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar con tareas relacionadas */}
        <div className="space-y-6">
          {/* Componente de tareas vinculadas */}
          <NoteRelatedTasks noteId={id} />
          
          {/* Metadatos de la nota */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium mb-3">Detalles</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span className="text-gray-600">Fecha de creación:</span>
                <span className="font-medium">
                  {note.createdAt && format(new Date(note.createdAt), 'dd/MM/yyyy', { locale: es })}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-600">Última actualización:</span>
                <span className="font-medium">
                  {note.updatedAt && format(new Date(note.updatedAt), 'dd/MM/yyyy', { locale: es })}
                </span>
              </li>
              {note.contentStats && (
                <>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Palabras:</span>
                    <span className="font-medium">{note.contentStats.words}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Caracteres:</span>
                    <span className="font-medium">{note.contentStats.chars}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Tiempo de lectura:</span>
                    <span className="font-medium">{note.contentStats.readingTime} minutos</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
