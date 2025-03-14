import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function NotesList({ notes, deleteNote }) {
  const router = useRouter();
  
  // Función para navegar al detalle de la nota
  const navigateToNoteDetail = (noteId) => {
    router.push(`/notes/${noteId}`);
  };
  
  // Función para formatear fecha
  const formatDate = (dateString) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
  };

  return (
    <div className="space-y-4">
      {notes.length > 0 ? (
        notes.map(note => (
          <div 
            key={note._id} 
            className="bg-white p-4 rounded-lg shadow-sm border-l-4 hover:shadow-md transition-shadow cursor-pointer" 
            style={{ borderLeftColor: note.subject?.color || '#e5e7eb' }}
            onClick={() => navigateToNoteDetail(note._id)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-lg text-gray-900">{note.title}</h3>
              
              <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/notes/${note._id}/edit`);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Editar"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNote(note._id);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Eliminar"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Vista previa del contenido */}
            {note.content && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {note.content.replace(/[#*`>_]/g, '').substring(0, 150)}
                {note.content.length > 150 ? '...' : ''}
              </p>
            )}
            
            {/* Pie de nota con etiquetas y fecha */}
            <div className="flex justify-between items-center mt-2">
              <div className="flex flex-wrap gap-1">
                {note.subject && (
                  <span 
                    className="px-2 py-0.5 text-xs rounded-full" 
                    style={{ 
                      backgroundColor: `${note.subject.color}20`,
                      color: note.subject.color 
                    }}
                  >
                    {note.subject.name}
                  </span>
                )}
                
                {/* Etiquetas */}
                {note.tags && note.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              
              <span className="text-xs text-gray-500">
                {formatDate(note.updatedAt)}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay notas que coincidan con los filtros aplicados.</p>
        </div>
      )}
    </div>
  );
}
