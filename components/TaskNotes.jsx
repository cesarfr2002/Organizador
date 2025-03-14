import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function TaskNotes({ taskId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (taskId) {
      fetchRelatedNotes();
    }
  }, [taskId]);

  const fetchRelatedNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notes?taskId=${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      } else {
        throw new Error('Error al cargar las notas relacionadas');
      }
    } catch (error) {
      console.error('Error fetching related notes:', error);
      toast.error('Error al cargar notas relacionadas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-16 rounded-md"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-800">Notas vinculadas</h3>
        <Link 
          href={`/notes/new?taskId=${taskId}`}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva nota
        </Link>
      </div>
      
      {notes.length > 0 ? (
        <div className="space-y-2">
          {notes.map(note => (
            <Link href={`/notes/${note._id}`} key={note._id}>
              <div className="p-3 border rounded hover:bg-gray-50 transition cursor-pointer">
                <h4 className="font-medium text-gray-900">{note.title}</h4>
                {note.content && (
                  <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {note.content.replace(/[#*`>_]/g, '').substring(0, 100)}
                    {note.content.length > 100 && '...'}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500">
          <p className="mb-2">No hay notas vinculadas a esta tarea</p>
          <Link 
            href={`/notes/new?taskId=${taskId}`} 
            className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Crear la primera nota
          </Link>
        </div>
      )}
    </div>
  );
}
