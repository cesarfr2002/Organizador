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
import { useGamification } from '../../context/GamificationContext';

export default function NoteDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studyMode, setStudyMode] = useState(false);
  const [lastScrollPosition, setLastScrollPosition] = useState(0);
  const [isImportant, setIsImportant] = useState(false);
  const [viewHistory, setViewHistory] = useState(false);
  const [noteHistory, setNoteHistory] = useState([]);
  const { addPoints, gamificationEnabled } = useGamification() || {};

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

  // Guardar posición de scroll cuando se activa el modo estudio
  useEffect(() => {
    if (studyMode) {
      setLastScrollPosition(window.scrollY);
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
      
      // Otorgar puntos por usar el modo estudio
      if (gamificationEnabled && typeof addPoints === 'function') {
        addPoints(5, 'Usar modo estudio');
      }
    } else {
      document.body.style.overflow = '';
      setTimeout(() => {
        window.scrollTo(0, lastScrollPosition);
      }, 0);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [studyMode]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setNote(data);
        setIsImportant(data.isImportant || false);
        
        // También cargar el historial de revisiones si existe
        try {
          const historyRes = await fetch(`/api/notes/${id}/history`);
          if (historyRes.ok) {
            const historyData = await historyRes.json();
            setNoteHistory(historyData);
          }
        } catch (histError) {
          console.error('Error fetching note history:', histError);
        }
        
        // Otorgar puntos por leer una nota
        if (gamificationEnabled && typeof addPoints === 'function') {
          addPoints(3, 'Leer una nota');
        }
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

  const toggleImportant = async () => {
    try {
      const updatedNote = { ...note, isImportant: !isImportant };
      
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote)
      });
      
      if (res.ok) {
        setIsImportant(!isImportant);
        toast.success(isImportant ? 'Nota quitada de destacados' : 'Nota marcada como importante');
        
        if (!isImportant && gamificationEnabled && typeof addPoints === 'function') {
          addPoints(5, 'Nota importante destacada');
        }
      }
    } catch (error) {
      console.error('Error toggling important:', error);
      toast.error('Error al actualizar la nota');
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

  // Función para compartir la nota vía enlace temporal
  const shareNote = async () => {
    try {
      const res = await fetch(`/api/notes/${id}/share`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const { shareUrl } = await res.json();
        
        // Copiar al portapapeles
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            toast.success('Enlace copiado al portapapeles');
            if (gamificationEnabled && typeof addPoints === 'function') {
              addPoints(3, 'Compartir conocimiento');
            }
          })
          .catch(() => {
            // Fallback para navegadores que no soportan clipboard
            toast.info('Enlace generado: ' + shareUrl);
          });
      } else {
        throw new Error('Error al compartir la nota');
      }
    } catch (error) {
      console.error('Error sharing note:', error);
      toast.error('No se pudo compartir la nota');
    }
  };

  // Función para navegación rápida mediante atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // No capturar teclas si está en un campo de formulario
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // ESC para salir del modo estudio
      if (e.key === 'Escape' && studyMode) {
        setStudyMode(false);
      }
      
      // S para modo estudio
      if (e.key === 's' || e.key === 'S') {
        setStudyMode(!studyMode);
      }
      
      // E para editar
      if (e.key === 'e' || e.key === 'E') {
        router.push(`/notes/${id}/edit`);
      }
      
      // F para marcar como favorito/importante
      if (e.key === 'f' || e.key === 'F') {
        toggleImportant();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studyMode, id, toggleImportant]);

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

  // Renderizar modo de estudio (pantalla completa sin distracciones)
  if (studyMode) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Barra de herramientas superior */}
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-2 border-b">
            <h1 className="text-2xl font-bold">{note.title}</h1>
            <div className="flex gap-2">
              <button
                onClick={toggleImportant}
                className={`p-2 rounded-full ${isImportant ? 'text-yellow-500' : 'text-gray-400'}`}
                title={isImportant ? "Quitar de destacados" : "Marcar como importante"}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
              <button
                onClick={() => router.push(`/notes/${note._id}/edit`)}
                className="p-2 rounded-full text-gray-600 hover:text-blue-600"
                title="Editar nota"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => setStudyMode(false)}
                className="p-2 rounded-full text-gray-600 hover:text-red-600"
                title="Salir del modo estudio (ESC)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Contenido formateado */}
          <div className="prose prose-lg max-w-none mx-auto">
            <div dangerouslySetInnerHTML={{ __html: marked(note.content) }} />
          </div>

          {/* Pie de página */}
          <div className="mt-8 pt-4 border-t text-sm text-gray-500 flex justify-between">
            <div>
              Última actualización: {format(new Date(note.updatedAt), 'PPP', { locale: es })}
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">ESC</kbd> para salir
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{note.title} | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">{note.title}</h1>
          {isImportant && (
            <span className="ml-2 text-yellow-500">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleImportant}
            className={`p-1 rounded ${isImportant ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
            title={isImportant ? "Quitar de destacados" : "Marcar como importante (F)"}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
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
            {/* Barra de herramientas de la nota */}
            <div className="flex flex-wrap justify-between items-center mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
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

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setStudyMode(true)}
                  className="flex items-center px-3 py-1 text-sm bg-green-50 text-green-700 rounded-md hover:bg-green-100"
                  title="Modo estudio (S)"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  Modo estudio
                </button>
                
                <button
                  onClick={shareNote}
                  className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                  title="Compartir nota"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Compartir
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  title="Imprimir nota"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir
                </button>
              </div>
            </div>

            {/* Contenido de la nota con markdown */}
            <div className="prose prose-sm md:prose lg:prose-lg max-w-none mb-6">
              {note.content ? (
                <div dangerouslySetInnerHTML={{ __html: marked(note.content) }} />
              ) : (
                <p className="text-gray-500 italic">Esta nota no tiene contenido.</p>
              )}
            </div>

            {/* Acciones de la nota */}
            <div className="flex items-center justify-between pt-4 border-t">
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
              
              <button
                onClick={() => setViewHistory(!viewHistory)}
                className="text-sm text-gray-600 hover:text-blue-600 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {viewHistory ? 'Ocultar historial' : 'Ver historial'}
              </button>
            </div>
          </div>
          
          {/* Historial de revisiones */}
          {viewHistory && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-3">Historial de revisiones</h2>
              {noteHistory.length > 0 ? (
                <div className="space-y-3">
                  {noteHistory.map((revision, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          {format(new Date(revision.timestamp), 'PPpp', { locale: es })}
                        </span>
                        <button
                          onClick={() => router.push(`/notes/${note._id}/revision/${revision.id}`)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Ver esta versión
                        </button>
                      </div>
                      {revision.changes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {revision.changes.map((change, idx) => (
                            <div key={idx}>{change}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">No hay revisiones previas disponibles</p>
              )}
            </div>
          )}
          
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
          
          {/* Atajos de teclado */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium mb-3">Atajos de teclado</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-2">S</kbd>
                <span>Modo estudio</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-2">E</kbd>
                <span>Editar nota</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-2">F</kbd>
                <span>Marcar favorito</span>
              </div>
              <div className="flex items-center">
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs mr-2">ESC</kbd>
                <span>Salir de modo estudio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
