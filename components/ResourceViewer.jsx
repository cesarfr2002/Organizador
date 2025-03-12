import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ResourceViewer({ resource, onEdit, onDelete, showActions = true }) {
  const [loading, setLoading] = useState(false);
  const isFileResource = !!resource.fileUrl;
  
  // Actualizar contador de accesos al abrir el recurso
  const trackResourceAccess = async () => {
    try {
      await fetch(`/api/resources/${resource._id}`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Error tracking resource access:', error);
    }
  };
  
  // Determinar el tipo de icono según el tipo de recurso
  const getResourceIcon = () => {
    switch (resource.type) {
      case 'pdf':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'image':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'slides':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'document':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'link':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
    }
  };
  
  // Formatear tamaño del archivo
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este recurso?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/${resource._id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Error al eliminar el recurso');
      }
      
      toast.success('Recurso eliminado correctamente');
      if (onDelete) onDelete(resource._id);
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Error al eliminar el recurso');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el componente
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
      resource.important ? 'border-yellow-500' : 'border-blue-500'
    }`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="mr-3 flex-shrink-0">
            {getResourceIcon()}
          </div>
          
          <div className="flex-grow">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 mb-1">
              {resource.title}
            </h3>
            
            {resource.description && (
              <p className="text-gray-600 text-sm mb-2">{resource.description}</p>
            )}
            
            <div className="flex flex-wrap gap-2 mb-2">
              {resource.tags && resource.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="bg-gray-100 text-xs text-gray-800 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className="flex flex-wrap text-xs text-gray-500 gap-x-4 gap-y-1">
              {isFileResource && resource.fileName && (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {resource.fileName}
                </span>
              )}
              
              {resource.fileSize && (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
                  </svg>
                  {formatFileSize(resource.fileSize)}
                </span>
              )}
              
              {resource.lastAccessed && (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDistanceToNow(new Date(resource.lastAccessed), { 
                    addSuffix: true,
                    locale: es 
                  })}
                </span>
              )}
              
              {resource.accessCount > 0 && (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {resource.accessCount} {resource.accessCount === 1 ? 'vez' : 'veces'}
                </span>
              )}
            </div>
            
            <div className="mt-3 flex items-center gap-2">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackResourceAccess}
                className="text-sm bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded transition-colors"
              >
                {isFileResource ? 'Descargar' : 'Abrir enlace'}
              </a>
              
              {showActions && (
                <>
                  <button
                    onClick={() => onEdit(resource)}
                    className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded transition-colors"
                  >
                    Editar
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className={`text-sm bg-red-100 hover:bg-red-200 text-red-800 py-1 px-3 rounded transition-colors ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
