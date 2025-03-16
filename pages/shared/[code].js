import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { marked } from 'marked';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SharedNote() {
  const router = useRouter();
  const { code } = router.query;
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  useEffect(() => {
    if (code) {
      fetchSharedNote();
    }
  }, [code]);

  const fetchSharedNote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shared/${code}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('El enlace no existe o ha expirado');
        } else {
          throw new Error('Error al cargar la nota compartida');
        }
      }
      
      const data = await res.json();
      setNote(data.note);
      setExpiresAt(data.expiresAt);
    } catch (error) {
      console.error('Error fetching shared note:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-gray-500">{error || 'No se pudo cargar la nota'}</p>
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <Head>
        <title>{note.title} | UniOrganizer - Nota compartida</title>
      </Head>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-blue-800">
              Estás viendo una nota compartida de UniOrganizer
            </p>
            {expiresAt && (
              <p className="text-sm text-blue-600">
                Este enlace expira el {format(new Date(expiresAt), 'PPP', { locale: es })}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-3 py-1 bg-white text-blue-600 rounded border border-blue-200 text-sm"
          >
            Ir a UniOrganizer
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
            
            <div className="flex flex-wrap gap-2 mt-3">
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
            </div>
          </div>
          
          <div className="px-6 py-8">
            <div className="prose prose-sm md:prose lg:prose-lg max-w-none">
              {note.content ? (
                <div dangerouslySetInnerHTML={{ __html: marked(note.content) }} />
              ) : (
                <p className="text-gray-500 italic">Esta nota no tiene contenido.</p>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 text-sm text-gray-500 flex justify-between items-center">
            <div>
              Compartido por {note.authorName || 'Un usuario de UniOrganizer'}
            </div>
            <div>
              {note.updatedAt && format(new Date(note.updatedAt), 'PPP', { locale: es })}
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Nota compartida desde <a href="/" className="text-blue-600 hover:underline">UniOrganizer</a>
          </p>
        </div>
      </div>
    </div>
  );
}
