import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import NotesList from '../../components/NotesList';
import Head from 'next/head';
import { toast } from 'react-toastify';
import { useGamification } from '../../context/GamificationContext';

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
  
  // Add gamification hooks
  const { addPoints, unlockAchievement, gamificationEnabled } = useGamification() || {};

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchSubjects();
      fetchNotes();
      
      // Award points for visiting notes page
      if (gamificationEnabled && typeof addPoints === 'function') {
        addPoints(5, 'Revisar notas');
      }
    }
  }, [status, filter]);

  // Track notes count for achievements
  useEffect(() => {
    if (notes.length && gamificationEnabled && typeof unlockAchievement === 'function') {
      // Achievements for note milestones
      if (notes.length >= 5) {
        unlockAchievement({
          id: 'notes-5',
          name: 'Coleccionista Principiante',
          description: 'Has creado tus primeras 5 notas',
          icon: '📝'
        });
      }
      
      if (notes.length >= 20) {
        unlockAchievement({
          id: 'notes-20',
          name: 'Erudito',
          description: 'Has acumulado 20 notas. ¡Impresionante!',
          icon: '🧠'
        });
      }
    }
  }, [notes.length]);

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
      
      const res = await fetch(`/api/notes?${queryParams.toString()}`);
      const data = await res.json();
      setNotes(data);
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
    
    // Award points for filtering/searching
    if (gamificationEnabled && name !== 'search' && typeof addPoints === 'function') {
      addPoints(2, 'Organizar notas');
    }
  };

  const deleteNote = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta nota?')) {
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

  const toggleFavorite = async (note) => {
    try {
      const updatedNote = { ...note, isImportant: !note.isImportant };
      
      const res = await fetch(`/api/notes/${note._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote)
      });
      
      if (res.ok) {
        setNotes(notes.map(n => n._id === note._id ? 
          { ...n, isImportant: !n.isImportant } : n));
          
        if (!note.isImportant) {
          setFavoriteNote(note._id);
          setTimeout(() => setFavoriteNote(null), 1500);
          
          // Otorgar puntos por marcar una nota como importante
          if (gamificationEnabled && typeof addPoints === 'function') {
            addPoints(5, 'Nota importante destacada');
          }
        }
      }
    } catch (error) {
      console.error('Error al marcar favorito:', error);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
      if (gamificationEnabled && typeof addPoints === 'function') {
        addPoints(1, 'Filtrar por etiqueta');
      }
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

  return (
    <Layout>
      <Head>
        <title>Mis Notas | UniOrganizer</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Notas</h1>
        <button
          onClick={() => {
            router.push('/notes/new');
            if (gamificationEnabled && typeof addPoints === 'function') {
              addPoints(10, 'Iniciativa de nueva nota');
            }
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Nota
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <input
              type="text"
              name="tag"
              value={filter.tag}
              onChange={handleFilterChange}
              placeholder="Filtrar por etiqueta"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Búsqueda
            </label>
            <input
              type="text"
              name="search"
              value={filter.search}
              onChange={handleFilterChange}
              placeholder="Buscar en título y contenido"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Usar el componente NotesList que hace las notas clickeables */}
      <NotesList 
        notes={notes} 
        deleteNote={deleteNote} 
        onNoteClick={
          // Only provide the callback if addPoints is a function
          gamificationEnabled && typeof addPoints === 'function' 
            ? () => addPoints(3, 'Leer una nota') 
            : null
        }
      />
    </Layout>
  );
}
