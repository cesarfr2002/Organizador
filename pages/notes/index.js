import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import NoteCard from '../../components/NoteCard';

export default function Notes() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    subject: 'all',
    tag: '',
    search: ''
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('updatedAt'); // 'updatedAt', 'createdAt', 'title'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [allTags, setAllTags] = useState([]);
  const [stats, setStats] = useState({
    totalNotes: 0,
    bySubject: [],
    byTag: [],
    recentlyUpdated: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchSubjects();
      fetchNotes();
    }
  }, [status, filter, sortBy, sortOrder]);

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
      
      if (filter.search) {
        queryParams.append('search', filter.search);
      }
      
      queryParams.append('sort', sortBy);
      queryParams.append('order', sortOrder);
      
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
      const tagsList = Array.from(tags).sort();
      setAllTags(tagsList);
      
      // Calcular estadísticas
      calculateStats(data, tagsList);
      
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (notesData, tagsList) => {
    // Total de notas
    const totalNotes = notesData.length;
    
    // Notas por asignatura
    const subjectCounts = {};
    notesData.forEach(note => {
      if (note.subject) {
        const subjectId = note.subject._id;
        subjectCounts[subjectId] = (subjectCounts[subjectId] || 0) + 1;
      }
    });
    
    const bySubject = subjects.map(subject => ({
      id: subject._id,
      name: subject.name,
      color: subject.color,
      count: subjectCounts[subject._id] || 0
    })).filter(item => item.count > 0).sort((a, b) => b.count - a.count);
    
    // Notas por etiqueta
    const tagCounts = {};
    notesData.forEach(note => {
      if (note.tags && note.tags.length > 0) {
        note.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    const byTag = tagsList.map(tag => ({
      name: tag,
      count: tagCounts[tag] || 0
    })).sort((a, b) => b.count - a.count);
    
    // Notas actualizadas recientemente (en las últimas 48 horas)
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);
    
    const recentlyUpdated = notesData.filter(note => 
      new Date(note.updatedAt) >= twoDaysAgo
    ).length;
    
    setStats({
      totalNotes,
      bySubject,
      byTag,
      recentlyUpdated
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilter(prev => ({
      ...prev,
      search: value
    }));
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    // value format: "field-order" (e.g., "updatedAt-desc")
    const [field, order] = value.split('-');
    setSortBy(field);
    setSortOrder(order);
  };
  
  const handleTagClick = (tag) => {
    setFilter(prev => ({
      ...prev,
      tag: prev.tag === tag ? '' : tag
    }));
  };

  const resetFilters = () => {
    setFilter({
      subject: 'all',
      tag: '',
      search: ''
    });
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
    return format(parseISO(date), 'dd MMM yyyy', { locale: es });
  };
  
  const getContentPreview = (content) => {
    if (!content) return 'Sin contenido';
    
    // Eliminar marcado Markdown para la vista previa
    return content
      .replace(/#+\s/g, '') // Remove headings
      .replace(/\*\*/g, '') // Remove bold
      .replace(/\*/g, '')   // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with just text
      .replace(/!\[([^\]]+)\]\([^)]+\)/g, '[Imagen: $1]') // Replace images
      .replace(/```[^`]*```/g, '[Código]') // Replace code blocks
      .replace(/`([^`]+)`/g, '$1') // Replace inline code
      .substring(0, 150) + (content.length > 150 ? '...' : '');
  };

  const countContentStats = (content) => {
    if (!content) return { words: 0, chars: 0 };
    
    const words = content.trim().split(/\s+/).length;
    const chars = content.length;
    
    return { words, chars };
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
        <div>
          <h1 className="text-2xl font-bold">Mis Apuntes</h1>
          <p className="text-gray-600">Organiza tus apuntes y documentos de estudio</p>
        </div>
        <div className="flex space-x-2">
          <Link 
            href="/notes/new" 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva Nota
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <span className="text-gray-500 text-sm">Total de Apuntes</span>
          <span className="text-2xl font-bold mt-1">{stats.totalNotes}</span>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <span className="text-gray-500 text-sm">Actualizados Recientemente</span>
          <span className="text-2xl font-bold mt-1 text-blue-600">{stats.recentlyUpdated}</span>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <span className="text-gray-500 text-sm">Asignatura Principal</span>
          <span className="text-xl font-bold mt-1 truncate">
            {stats.bySubject[0] ? (
              <span className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: stats.bySubject[0].color }}
                ></span>
                {stats.bySubject[0].name}
              </span>
            ) : (
              "Sin asignaturas"
            )}
          </span>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <span className="text-gray-500 text-sm">Etiqueta más usada</span>
          <span className="text-xl font-bold mt-1 truncate">
            {stats.byTag[0] ? stats.byTag[0].name : "Sin etiquetas"}
          </span>
        </div>
      </div>

      {/* Búsqueda y controles */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-grow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar en mis notas..."
                value={filter.search}
                onChange={handleSearchChange}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={handleSortChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="updatedAt-desc">Recientes primero</option>
              <option value="updatedAt-asc">Antiguos primero</option>
              <option value="title-asc">Título A-Z</option>
              <option value="title-desc">Título Z-A</option>
            </select>
            
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-500'} border border-gray-300 rounded-l-md`}
                title="Vista de cuadrícula"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-500'} border border-gray-300 rounded-r-md`}
                title="Vista de lista"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Filtros */}
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
          
          <div className="flex items-end gap-2">
            <div className="flex-grow">
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
            
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              title="Reiniciar filtros"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tag Cloud */}
        {allTags.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Etiquetas populares:</p>
            <div className="flex flex-wrap gap-2">
              {stats.byTag.slice(0, 10).map((tag) => (
                <button 
                  key={tag.name}
                  onClick={() => handleTagClick(tag.name)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filter.tag === tag.name
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {tag.name} <span className="ml-1 text-xs opacity-80">({tag.count})</span>
                </button>
              ))}
              {allTags.length > 10 && (
                <span className="text-xs text-gray-500 flex items-center px-2">
                  +{allTags.length - 10} más
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="flex flex-col items-center justify-center py-10">
            <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 mb-4">No hay notas que coincidan con los filtros</p>
            {(filter.subject !== 'all' || filter.tag || filter.search) ? (
              <button 
                onClick={resetFilters}
                className="bg-blue-100 text-blue-600 px-4 py-2 rounded hover:bg-blue-200 mb-4"
              >
                Quitar filtros
              </button>
            ) : null}
            <Link href="/notes/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Crear nueva nota
            </Link>
          </div>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.map((note) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  onDelete={() => handleDelete(note._id)}
                  formatDate={formatDate}
                  getContentPreview={getContentPreview}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nota
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asignatura
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Etiquetas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actualizado
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notes.map((note) => {
                    const { words } = countContentStats(note.content);
                    return (
                      <tr key={note._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 flex items-center justify-center rounded">
                              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                <Link href={`/notes/${note._id}`} className="hover:text-blue-600">
                                  {note.title}
                                </Link>
                              </div>
                              <div className="text-xs text-gray-500">
                                {words} palabras
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {note.subject ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                              style={{ 
                                backgroundColor: `${note.subject.color}20`,
                                color: note.subject.color 
                              }}>
                              {note.subject.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {note.tags && note.tags.length > 0 ? note.tags.map((tag, index) => (
                              <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                                {tag}
                              </span>
                            )) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(note.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <Link
                              href={`/notes/${note._id}`}
                              className="text-blue-600 hover:text-blue-800"
                              title="Ver nota"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </Link>
                            <Link
                              href={`/notes/${note._id}/edit`}
                              className="text-gray-600 hover:text-gray-800"
                              title="Editar nota"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => handleDelete(note._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar nota"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
