import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ResourceViewer from './ResourceViewer';
import ResourceForm from './ResourceForm';

export default function ResourceList({ subjectId = null }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    tag: '',
    important: false,
    search: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchResources();
    if (!subjectId) {
      fetchSubjects();
    }
  }, [subjectId, filters, pagination.page]);
  
  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      let url = subjectId 
        ? `/api/subjects/${subjectId}/resources`
        : '/api/resources';
      
      // Añadir filtros como parámetros de consulta
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.important) params.append('important', 'true');
      if (filters.search) params.append('search', filters.search);
      
      // Añadir parámetros de paginación
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Error al cargar los recursos');
      }
      
      let data = await res.json();
      
      // El endpoint /api/resources devuelve { resources, pagination }
      // Pero el endpoint /api/subjects/[id]/resources devuelve directamente el array
      if (Array.isArray(data)) {
        setResources(data);
      } else {
        setResources(data.resources);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Error al cargar los recursos');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Resetear la paginación cuando se cambian los filtros
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchResources();
    toast.success('Recurso añadido correctamente');
  };

  const handleEditSuccess = () => {
    setEditingResource(null);
    fetchResources();
    toast.success('Recurso actualizado correctamente');
  };

  const handleDeleteResource = (deletedId) => {
    setResources(prev => prev.filter(resource => resource._id !== deletedId));
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setShowAddForm(false);
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Extraer todas las etiquetas únicas de los recursos
  const allTags = [...new Set(resources.flatMap(resource => resource.tags || []))];

  return (
    <div>
      {/* Panel de filtros */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar por título o descripción"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              id="type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="pdf">PDF</option>
              <option value="link">Enlace</option>
              <option value="slides">Diapositivas</option>
              <option value="video">Video</option>
              <option value="image">Imagen</option>
              <option value="document">Documento</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700 mb-1">
              Etiqueta
            </label>
            <select
              id="tag"
              name="tag"
              value={filters.tag}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          
          <div className="self-end flex items-center h-10">
            <input
              type="checkbox"
              id="important"
              name="important"
              checked={filters.important}
              onChange={handleFilterChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="important" className="ml-2 block text-sm text-gray-900">
              Solo importantes
            </label>
          </div>
        </div>
      </div>
      
      {/* Botón de agregar recurso */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {subjectId ? 'Recursos de la asignatura' : 'Todos los recursos'}
        </h2>
        
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingResource(null);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          {showAddForm ? 'Cancelar' : 'Añadir recurso'}
        </button>
      </div>
      
      {/* Formulario para agregar o editar */}
      {showAddForm && (
        <div className="mb-8">
          <ResourceForm
            subjectId={subjectId}
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
            subjects={subjects}
          />
        </div>
      )}
      
      {editingResource && (
        <div className="mb-8">
          <ResourceForm
            resource={editingResource}
            onSuccess={handleEditSuccess}
            onCancel={() => setEditingResource(null)}
            subjects={subjects}
          />
        </div>
      )}
      
      {/* Lista de recursos */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay recursos</h3>
          <p className="mt-1 text-sm text-gray-500">Añade nuevos recursos para esta asignatura.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Añadir recurso
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {resources.map(resource => (
              <ResourceViewer
                key={resource._id}
                resource={resource}
                onEdit={handleEditResource}
                onDelete={handleDeleteResource}
              />
            ))}
          </div>
          
          {/* Paginación */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="inline-flex rounded-md shadow">
                <button
                  onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } text-sm font-medium`}
                >
                  Anterior
                </button>
                
                {/* Mostrar números de página */}
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter(page => 
                    // Mostrar página actual, primera, última y páginas cercanas
                    page === 1 || 
                    page === pagination.pages || 
                    Math.abs(page - pagination.page) <= 1
                  )
                  .map((page, i, arr) => (
                    <React.Fragment key={page}>
                      {i > 0 && arr[i - 1] !== page - 1 && (
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border ${
                          pagination.page === page
                            ? 'bg-blue-50 text-blue-600 border-blue-500'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        } text-sm font-medium`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))
                }
                
                <button
                  onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                  disabled={pagination.page === pagination.pages}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border ${
                    pagination.page === pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } text-sm font-medium`}
                >
                  Siguiente
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
}
