import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Add onNoteClick prop to enable gamification rewards

export default function NotesList({ notes, deleteNote, onNoteClick }) {
  const router = useRouter();
  
  // Handle note click with optional reward callback
  const handleNoteClick = (noteId) => {
    router.push(`/notes/${noteId}`);
    if (onNoteClick) {
      onNoteClick(noteId);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No hay notas</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comienza creando una nueva nota.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push('/notes/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Nota
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {notes.map(note => (
        <div key={note._id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
          <div 
            onClick={() => handleNoteClick(note._id)}
            className="p-5 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">{note.title}</h2>
              {note.subject && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {note.subject.name}
                </span>
              )}
            </div>
            <div className="mt-2">
              <p className="text-gray-600 dark:text-gray-300 line-clamp-3">{note.content?.replace(/<[^>]+>/g, ' ')}</p>
            </div>
            {note.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {note.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {note.updatedAt && formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true, locale: es })}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push(`/notes/edit/${note._id}`)}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNote(note._id);
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
