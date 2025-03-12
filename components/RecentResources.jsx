import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-toastify';

export default function RecentResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('recent'); // 'recent', 'important'
  const router = useRouter();

  useEffect(() => {
    fetchResources();
  }, [filter]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resources?filter=${filter}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      } else {
        throw new Error('Error al obtener los recursos');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Error al cargar los recursos');
    } finally {
      setLoading(false);
    }
  };

  const handleAccessResource = async (resource) => {
    try {
      // Registrar el acceso al recurso
      await fetch(`/api/resources/${resource._id}/access`, {
        method: 'POST'
      });
      
      // Abrir el recurso en una nueva pestaña
      window.open(resource.url, '_blank');
    } catch (error) {
      console.error('Error accessing resource:', error);
    }
  };

  // Obtener el icono según el tipo de recurso
  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'link':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
        );
      case 'slides':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="bg-gray-200 h-12 rounded-md"></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filtros */}
      <div className="flex mb-4 space-x-2">
        <button
          onClick={() => setFilter('recent')}
          className={`px-3 py-1 text-xs rounded-full ${
            filter === 'recent' 
              ? 'bg-blue-100 text-blue-800 border-blue-300' 
              : 'bg-gray-100 text-gray-800 border-gray-200'
          } border`}
        >
          Recientes
        </button>
        <button
          onClick={() => setFilter('important')}
          className={`px-3 py-1 text-xs rounded-full ${
            filter === 'important' 
              ? 'bg-amber-100 text-amber-800 border-amber-300' 
              : 'bg-gray-100 text-gray-800 border-gray-200'
          } border`}
        >
          Importantes
        </button>
      </div>

      {resources.length > 0 ? (
        <div className="space-y-2">
          {resources.map(resource => (
            <div
              key={resource._id}
              onClick={() => handleAccessResource(resource)}
              className={`border rounded-md p-2 cursor-pointer flex items-start hover:bg-gray-50 transition ${
                resource.important ? 'bg-amber-50 border-amber-200' : ''
              }`}
            >
              <div className="mt-0.5 mr-2 flex-shrink-0">
                {getResourceIcon(resource.type)}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-800 truncate">{resource.title}</span>
                  {resource.important && (
                    <span className="ml-1">
                      <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </span>
                  )}
                </div>
                
                <div className="flex text-xs text-gray-500 mt-0.5">
                  <span className="truncate">{resource.subject?.name || 'Sin materia'}</span>
                  <span className="mx-1">•</span>
                  <span className="whitespace-nowrap">
                    {resource.accessCount} {resource.accessCount === 1 ? 'acceso' : 'accesos'}
                  </span>
                </div>
              </div>
              
              <span className="ml-2 text-blue-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
            </div>
          ))}

          <button
            onClick={() => router.push('/resources')}
            className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-2"
          >
            Ver todos los recursos
          </button>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
          </svg>
          <p className="mt-1 text-sm">
            No hay recursos {filter === 'important' ? 'marcados como importantes' : 'recientes'}.
          </p>
        </div>
      )}
    </div>
  );
}
