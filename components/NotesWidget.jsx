import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export default function NotesWidget({ limit = 3 }) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/notes?limit=${limit}&sortBy=updatedAt&order=desc`);
        
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        
        const data = await res.json();
        setNotes(data.notes || []);
      } catch (error) {
        console.error('Error fetching notes:', error);
        setError('No se pudieron cargar las notas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [limit]);

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 h-24 rounded"></div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        {error}
      </div>
    );
  }

  // Empty state
  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        No tienes notas recientes
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <Link 
          href={`/notes/${note._id}`} 
          key={note._id}
          className="block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-1">
              {note.title || 'Sin título'}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(note.updatedAt || note.createdAt), 'dd MMM yyyy', { locale: es })}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {note.content?.replace(/(<([^>]+)>)/gi, '') || 'Sin contenido'}
          </p>
          
          {note.subject && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {note.subject.name}
              </span>
            </div>
          )}
        </Link>
      ))}
      
      <div className="text-center pt-2">
        <Link 
          href="/notes" 
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          Ver todas las notas →
        </Link>
      </div>
    </div>
  );
}
