import React, { useState } from 'react';
import Link from 'next/link';
import { marked } from 'marked';

const NoteCard = ({ note, onDelete, formatDate, getContentPreview }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Contar estadísticas del contenido
  const countContentStats = (content) => {
    if (!content) return { words: 0, chars: 0, readingTime: 0 };
    
    const words = content.trim().split(/\s+/).length;
    const chars = content.length;
    // Tiempo de lectura estimado (palabras / 200 palabras por minuto)
    const readingTime = Math.max(1, Math.ceil(words / 200));
    
    return { words, chars, readingTime };
  };
  
  // Detectar tipo de nota basado en el contenido
  const getNoteType = (content) => {
    if (!content) return { type: 'empty', icon: 'document' };
    
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
  
  const { words, readingTime } = countContentStats(note.content);
  const noteType = getNoteType(note.content);
  
  return (
    <div 
      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`p-4 border-t-4 ${`border-${noteType.color}-500`}`}>
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-900 truncate flex-grow">
            <Link href={`/notes/${note._id}`} className="hover:text-blue-600">
              {note.title}
            </Link>
          </h2>
          {noteType.type !== 'empty' && (
            <div className={`flex-shrink-0 p-1 rounded-full bg-${noteType.color}-100 text-${noteType.color}-600`} title={`Tipo: ${noteType.type}`}>
              {noteType.icon === 'document' && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
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
            </div>
          )}
        </div>
        
        {note.subject && (
          <div className="mb-2">
            <span
              className="px-2 py-1 text-xs rounded-full inline-flex items-center"
              style={{
                backgroundColor: `${note.subject.color}20`,
                color: note.subject.color
              }}
            >
              <span 
                className="w-2 h-2 rounded-full mr-1" 
                style={{ backgroundColor: note.subject.color }}
              ></span>
              {note.subject.name}
            </span>
          </div>
        )}

        <div className="text-sm text-gray-500 mb-2">
          Actualizado: {formatDate(note.updatedAt)}
        </div>

        <div className="text-gray-700 text-sm line-clamp-3 mb-4 min-h-[4.5rem] break-words">
          {getContentPreview(note.content)}
        </div>
        
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
          <div>{words} palabras</div>
          {readingTime > 0 && <div>Lectura: {readingTime} min</div>}
        </div>
        
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4 max-h-14 overflow-hidden">
            {note.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className={`flex justify-end space-x-2 transition-opacity duration-200 
          ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <Link
            href={`/notes/${note._id}`}
            className="text-blue-600 hover:text-blue-800 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          <Link
            href={`/notes/${note._id}/edit`}
            className="text-gray-600 hover:text-gray-800 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Link>
          <button
            onClick={() => onDelete(note._id)}
            className="text-red-600 hover:text-red-800 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
