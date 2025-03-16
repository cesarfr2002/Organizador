import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function TaskResources({ taskId }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [availableResources, setAvailableResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const router = useRouter();

  useEffect(() => {
    if (taskId) {
      fetchRelatedResources();
    }
  }, [taskId]);

  const fetchRelatedResources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/resources`);
      if (res.ok) {
        const data = await res.json();
        setResources(data);
      } else {
        throw new Error('Error al cargar recursos relacionados');
      }
    } catch (error) {
      console.error('Error fetching related resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableResources = async () => {
    try {
      const res = await fetch('/api/resources');
      if (res.ok) {
        // Si la API devuelve { resources, pagination }
        const data = await res.json();
        const resourceList = Array.isArray(data) ? data : data.resources;
        
        // Filtrar los recursos que ya están vinculados
        const relatedIds = resources.map(r => r._id);
        setAvailableResources(resourceList.filter(r => !relatedIds.includes(r._id)));
      }
    } catch (error) {
      console.error('Error fetching available resources:', error);
      toast.error('Error al cargar recursos');
    }
  };

  const handleOpenLinkModal = async () => {
    await fetchAvailableResources();
    setShowLinkModal(true);
  };

  const handleResourceSelection = (resourceId) => {
    setSelectedResources(prev => {
      if (prev.includes(resourceId)) {
        return prev.filter(id => id !== resourceId);
      } else {
        return [...prev, resourceId];
      }
    });
  };

  const handleLinkResources = async () => {
    if (selectedResources.length === 0) {
      setShowLinkModal(false);
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${taskId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceIds: selectedResources,
          operation: 'link'
        })
      });

      if (res.ok) {
        toast.success('Recursos vinculados correctamente');
        setShowLinkModal(false);
        setSelectedResources([]);
        fetchRelatedResources();
      } else {
        throw new Error('Error al vincular recursos');
      }
    } catch (error) {
      console.error('Error linking resources:', error);
      toast.error('Error al vincular recursos');
    }
  };

  const handleUnlinkResource = async (resourceId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resourceIds: [resourceId],
          operation: 'unlink'
        })
      });

      if (res.ok) {
        toast.success('Recurso desvinculado');
        setResources(resources.filter(r => r._id !== resourceId));
      } else {
        throw new Error('Error al desvincular recurso');
      }
    } catch (error) {
      console.error('Error unlinking resource:', error);
      toast.error('Error al desvincular recurso');
    }
  };

  // Función para determinar el tipo de icono según el tipo de recurso
  const getResourceIcon = (resourceType) => {
    switch (resourceType) {
      case 'pdf':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'image':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'slides':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'document':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'link':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Recursos relacionados</h3>
        <div className="flex gap-2">
          <button
            onClick={handleOpenLinkModal}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            title="Vincular recursos existentes"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Vincular recursos
          </button>
          <button
            onClick={() => router.push(`/resources/new?taskId=${taskId}`)}
            className="text-green-600 hover:text-green-800 text-sm flex items-center"
            title="Crear nuevo recurso"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo recurso
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : resources.length > 0 ? (
        <div className="space-y-3">
          {resources.map(resource => (
            <div key={resource._id} className="flex items-center group p-2 hover:bg-gray-50 rounded">
              <div className="mr-2 flex-shrink-0">
                {getResourceIcon(resource.type)}
              </div>
              
              <div className="flex-grow min-w-0">
                <a 
                  href={resource.url || resource.fileUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm truncate block"
                >
                  {resource.title}
                </a>
                {resource.description && (
                  <p className="text-xs text-gray-500 truncate">{resource.description}</p>
                )}
              </div>
              
              <button
                onClick={() => handleUnlinkResource(resource._id)}
                className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                title="Desvincular recurso"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm mb-2">No hay recursos vinculados a esta tarea</p>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleOpenLinkModal}
              className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Vincular recursos existentes
            </button>
          </div>
        </div>
      )}

      {/* Modal para vincular recursos */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Vincular recursos a esta tarea</h3>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {availableResources.length > 0 ? (
                <div className="space-y-2">
                  {availableResources.map(resource => (
                    <div key={resource._id} className="flex items-start border-b pb-2">
                      <input
                        type="checkbox"
                        id={`link-resource-${resource._id}`}
                        checked={selectedResources.includes(resource._id)}
                        onChange={() => handleResourceSelection(resource._id)}
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`link-resource-${resource._id}`} className="ml-2 block cursor-pointer">
                        <div className="flex items-center">
                          {getResourceIcon(resource.type)}
                          <span className="ml-2 font-medium">{resource.title}</span>
                        </div>
                        {resource.description && (
                          <p className="text-xs text-gray-500 mt-1">{resource.description}</p>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No hay recursos adicionales disponibles</p>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setSelectedResources([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleLinkResources}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${
                  selectedResources.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={selectedResources.length === 0}
              >
                Vincular seleccionados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
