import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { marked } from 'marked';

// Configuración para que Marked renderice correctamente las imágenes
marked.use({
  renderer: {
    image(href, title, text) {
      return `<img src="${href}" alt="${text || ''}" title="${title || ''}" class="max-w-full h-auto rounded-lg shadow-sm" />`;
    },
    code(code, language) {
      return `<pre class="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto"><code class="language-${language || 'text'}">${code}</code></pre>`;
    },
    heading(text, level) {
      const escapedText = text
        .toLowerCase()
        .replace(/[^\w]+/g, '-');
      return `
        <h${level} id="${escapedText}" class="group">
          <a href="#${escapedText}" class="heading-anchor opacity-0 group-hover:opacity-100 ml-2 text-blue-500">
            <span>#</span>
          </a>
          ${text}
        </h${level}>
      `;
    }
  }
});

export default function NoteDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [note, setNote] = useState(null);
  const [relatedNotes, setRelatedNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contentStats, setContentStats] = useState({ words: 0, chars: 0, readingTime: 0 });
  const contentRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && id) {
      fetchNote();
    }
  }, [status, id]);

  useEffect(() => {
    if (note && note.subject) {
      fetchRelatedNotes();
    }
  }, [note]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${id}`);
      
      if (!res.ok) {
        throw new Error('Error al obtener la nota');
      }
      
      const data = await res.json();
      setNote(data);
      calculateContentStats(data.content);
    } catch (error) {
      console.error('Error fetching note:', error);
      toast.error('Error al cargar la nota');
      router.push('/notes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedNotes = async () => {
    try {
      // Buscar notas relacionadas (misma asignatura, pero no la actual)
      const res = await fetch(`/api/notes?subject=${note.subject._id}`);
      const data = await res.json();
      // Filtrar la nota actual y limitar a 3 resultados
      setRelatedNotes(data.filter(item => item._id !== id).slice(0, 3));
    } catch (error) {
      console.error('Error fetching related notes:', error);
    }
  };

  const calculateContentStats = (content) => {
    if (!content) {
      setContentStats({ words: 0, chars: 0, readingTime: 0 });
      return;
    }
    
    const words = content.trim().split(/\s+/).length;
    const chars = content.length;
    // Tiempo de lectura estimado (palabras / 200 palabras por minuto)
    const readingTime = Math.max(1, Math.ceil(words / 200));
    
    setContentStats({ words, chars, readingTime });
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

  // Función para generar tabla de contenido
  const generateTableOfContents = (content) => {
    if (!content) return [];
    
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const toc = [];
    let match;
    
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');
      
      toc.push({ level, text, id });
    }
    
    return toc;
  };

  // Generar TOC si la nota existe
  const tableOfContents = note ? generateTableOfContents(note.content) : [];
  const hasToc = tableOfContents.length > 0;

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
        <Link href="/notes" className="text-blue-600 hover:text-blue-800 flex items-center">
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Volver a la lista
        </Link>
        
        <div className="flex items-center space-x-3">
          <Link href={`/notes/${id}/edit`} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar con info y TOC */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-4">
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3">Información</h3>
              
              {note.subject && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Asignatura</h4>
                  <div 
                    className="flex items-center px-3 py-1.5 rounded-md text-sm"
                    style={{
                      backgroundColor: `${note.subject.color}20`,
                      color: note.subject.color
                    }}
                  >
                    <span 
                      className="w-2 h-2 rounded-full mr-2" 
                      style={{ backgroundColor: note.subject.color }}
                    ></span>
                    {note.subject.name}
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Fechas</h4>
                <div className="text-sm">
                  <p><span className="font-medium">Creada:</span> {formatDate(note.createdAt)}</p>
                  <p><span className="font-medium">Actualizada:</span> {formatDate(note.updatedAt)}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Estadísticas</h4>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-blue-50 rounded p-2">
                    <div className="font-medium text-blue-700">{contentStats.words}</div>
                    <div className="text-xs text-blue-600">palabras</div>
                  </div>
                  <div className="bg-indigo-50 rounded p-2">
                    <div className="font-medium text-indigo-700">{contentStats.chars}</div>
                    <div className="text-xs text-indigo-600">caracteres</div>
                  </div>
                  <div className="bg-green-50 rounded p-2">
                    <div className="font-medium text-green-700">{contentStats.readingTime}</div>
                    <div className="text-xs text-green-600">min lectura</div>
                  </div>
                </div>
              </div>
              
              {note.tags && note.tags.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Etiquetas</h4>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag, index) => (
                      <Link 
                        href={`/notes?tag=${tag}`}
                        key={index} 
                        className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full hover:bg-gray-200"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {hasToc && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Contenido</h4>
                  <nav className="toc text-sm">
                    <ul className="space-y-1">
                      {tableOfContents.map((heading, index) => (
                        <li key={index} style={{ marginLeft: `${(heading.level - 1) * 0.75}rem` }}>
                          <a 
                            href={`#${heading.id}`} 
                            className="text-blue-600 hover:underline truncate block"
                          >
                            {heading.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}
              
              {relatedNotes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Notas relacionadas</h4>
                  <ul className="divide-y divide-gray-100">
                    {relatedNotes.map(relatedNote => (
                      <li key={relatedNote._id} className="py-1.5">
                        <Link 
                          href={`/notes/${relatedNote._id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                        >
                          {relatedNote.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              {/* Cabecera */}
              <div className="border-b pb-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">{note.title}</h1>
              </div>

              {/* Contenido */}
              <article 
                ref={contentRef}
                className="prose max-w-none prose-headings:scroll-mt-16 prose-blue prose-img:rounded-lg prose-img:shadow-md"
                dangerouslySetInnerHTML={{ __html: marked(note.content || '') }} 
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
