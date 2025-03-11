import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

export default function NoteEditor({ noteId }) {
  const router = useRouter();
  const [note, setNote] = useState({
    title: '',
    content: '',
    subject: '',
    tags: []
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchSubjects();
    
    if (noteId) {
      fetchNote();
    }
  }, [noteId]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchNote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`);
      const data = await res.json();
      setNote(data);
    } catch (error) {
      console.error('Error fetching note:', error);
      toast.error('No se pudo cargar la nota');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNote(prevNote => ({
      ...prevNote,
      [name]: value
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !note.tags.includes(newTag.trim())) {
      setNote(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const saveNote = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const url = noteId ? `/api/notes/${noteId}` : '/api/notes';
      const method = noteId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(note)
      });
      
      if (res.ok) {
        toast.success('Nota guardada correctamente');
        if (!noteId) {
          router.push('/notes');
        }
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Error al guardar la nota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <form onSubmit={saveNote}>
        <div className="mb-4">
          <input
            type="text"
            name="title"
            value={note.title}
            onChange={handleChange}
            placeholder="Título de la nota"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div className="mb-4">
          <select
            name="subject"
            value={note.subject}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">Selecciona una asignatura</option>
            {subjects.map(subject => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex mb-4 gap-2">
          <button
            type="button"
            className={`px-4 py-2 rounded ${!previewMode ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setPreviewMode(false)}
          >
            Editar
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded ${previewMode ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setPreviewMode(true)}
          >
            Vista previa
          </button>
        </div>

        {!previewMode ? (
          <textarea
            name="content"
            value={note.content}
            onChange={handleChange}
            placeholder="Contenido de la nota (soporta Markdown)"
            className="w-full h-64 px-3 py-2 border rounded-md"
          />
        ) : (
          <div 
            className="w-full h-64 px-3 py-2 border rounded-md overflow-auto prose"
            dangerouslySetInnerHTML={{ __html: marked(note.content) }}
          />
        )}

        <div className="mt-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Añadir etiqueta"
              className="px-3 py-2 border rounded-md flex-grow"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Añadir
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-200 px-2 py-1 rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-red-500 font-bold"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {loading ? 'Guardando...' : noteId ? 'Actualizar nota' : 'Guardar nota'}
          </button>
        </div>
      </form>
    </div>
  );
}
