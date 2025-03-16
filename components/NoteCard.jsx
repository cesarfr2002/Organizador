import React, { useState } from 'react';
import { useRouter } from 'next/router';

const NoteCard = ({ note, onDelete, onFavorite, formatDate, getContentPreview }) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  
  // Detectar tipo de nota basado en el contenido
  const getNoteType = (content) => {
    if (!content) return { type: 'empty', icon: 'document', color: 'gray' };
    
    // Verificar si tiene código
    if (content.includes('```') || content.match(/`[^`]+`/g)) {
      return { 
        type: 'code',
        icon: 'code',
        color: 'indigo'
      };
    }
    
    // Verificar si tiene imágenes
    if (content.match(/!\[.*?\]\(.*?\)/g)) {
      return { 
        type: 'image',
        icon: 'image',
        color: 'green'
      };
    }
    
    // Verificar si tiene listas
    if (content.match(/^[\s-*+]+\s/gm)) {
      return { 
        type: 'list',
        icon: 'list',
        color: 'amber'
      };
    }
    
    // Por defecto es texto
    return { 
      type: 'text',
      icon: 'document',
      color: 'blue'
    };
  };
  
  const noteType = getNoteType(note.content);
  const borderColor = note.isImportant ? '#F59E0B' : note.subject?.color || '#e5e7eb';
  
  return (
    <div 
      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow border-t-4"
      style={{ borderTopColor: borderColor }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/notes/${note._id}`)}
    >
      <div className="p-5">
        {/* Encabezado con título y tipo */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            {note.isImportant && (
              <svg className="w-5 h-5 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
            <h2 className="font-semibold text-lg text-gray-900 line-clamp-1">
              {note.title}
            </h2>
          </div>
          
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            noteType.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' : 
            noteType.color === 'green' ? 'bg-green-100 text-green-600' : 
            noteType.color === 'amber' ? 'bg-amber-100 text-amber-600' : 
            'bg-blue-100 text-blue-600'
          }`}>
            {noteType.icon === 'code' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            )}
            {noteType.icon === 'image' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            {noteType.icon === 'list' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            )}
            {noteType.icon === 'document' && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          </div>
        </div>
        
        {/* Fecha de actualización */}
        <div className="text-xs text-gray-500 mb-2">
          Actualizado: {formatDate(note.updatedAt)}
        </div>
        
        {/* Vista previa del contenido */}
        <div className="text-sm text-gray-600 line-clamp-3 mb-3 h-14">
          {getContentPreview(note.content)}
        </div>
        
        {/* Etiquetas y materia */}
        <div className="flex flex-wrap gap-1 mb-2">
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
          
          {note.tags?.length > 0 && note.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index} 
              className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700"
            >
              #{tag}
            </span>
          ))}
          {note.tags?.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
              +{note.tags.length - 3} más
            </span>
          )}
        </div>
      </div>
      
      {/* Barra de acciones */}
      <div 
        className={`bg-gray-50 px-4 py-2 flex justify-end transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(note);
          }}
          className={`p-1 rounded ${note.isImportant ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
          title={note.isImportant ? "Quitar de destacados" : "Marcar como importante"}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/notes/${note._id}/edit`);
          }}
          className="p-1 text-gray-400 hover:text-blue-500"
          title="Editar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note._id);
          }}
          className="p-1 text-gray-400 hover:text-red-500"
          title="Eliminar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NoteCard;
