import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Notes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    subject: 'all',
    tag: ''
  });
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchSubjects();
      fetchNotes();
    }
  }, [status, filter]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filter.subject !== 'all') {
        queryParams.append('subject', filter.subject);
      }
      
      if (filter.tag) {
        queryParams.append('tag', filter.tag);
      }
      
      const res = await fetch(`/api/notes?${queryParams.toString()}`);
      const data = await res.json();
      setNotes(data);
      
      // Extraer todos los tags únicos para el filtro
      const tags = new Set();
      data.forEach(note => {
        if (note.tags && note.tags.length > 0) {
          note.tags.forEach(tag => tags.add(tag));
        }
      });
      setAllTags(Array.from(tags).sort());
      
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta nota? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Nota eliminada correctamente');
        fetchNotes();
      } else {
        throw new Error('Error al eliminar la nota');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error al eliminar la nota');
    }
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy', { locale: es });
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

  return (
    <Layout>
      <Head>
        <title>Mis Apuntes | UniOrganizer</title>
      </Head>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Mis Apuntes</h1>
        <Link 
          href="/notes/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
        >
          Nueva Nota
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asignatura
            </label>
            <select
              name="subject"
              value={filter.subject}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Etiqueta
            </label>
            <select
              name="tag"
              value={filter.tag}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {notes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">No hay notas que coincidan con los filtros</p>
          <Link href="/notes/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Crear nueva nota
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note._id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {note.title}
                  </h2>
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
                </div>

                <div className="text-sm text-gray-500 mb-3">
                  Actualizado: {formatDate(note.updatedAt)}
                </div>

                <div className="text-gray-700 text-sm line-clamp-2 mb-4">
                  {note.content ? note.content.substring(0, 150) : 'Sin contenido'}
                </div>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {note.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 mt-auto pt-2">
                  <Link
                    href={`/notes/${note._id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/notes/${note._id}/edit`}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
