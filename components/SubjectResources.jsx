import { useState } from 'react';
import ResourceList from './ResourceList';
import ResourceForm from './ResourceForm';
import { toast } from 'react-toastify';

export default function SubjectResources({ subject }) {
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleAddClick = () => {
    setEditingResource(null);
    setShowForm(true);
  };
  
  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setShowForm(true);
  };
  
  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingResource(null);
    setRefreshTrigger(prev => prev + 1); // Trigger a refresh of the resource list
  };
  
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingResource(null);
  };
  
  if (!subject || !subject._id) {
    return (
      <div className="text-center py-10">
        <p>Selecciona una materia para administrar sus recursos</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recursos para {subject.name}</h2>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Agregar recurso
        </button>
      </div>
      
      {showForm ? (
        <div className="mb-6">
          <ResourceForm
            subjectId={subject._id}
            resource={editingResource}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      ) : null}
      
      <ResourceList
        subjectId={subject._id}
        onEdit={handleEditResource}
        onRefresh={refreshTrigger}
      />
    </div>
  );
}
