import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

const QuickResourceForm = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'link',
    url: '',
    subject: '',
    important: false,
  });

  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.url || !formData.subject) {
      toast.error("Título, URL y asignatura son obligatorios");
      return;
    }
    
    setLoading(true);
    
    try {
      const userId = user?.id;
      const res = await fetch(`/api/subjects/${formData.subject}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        throw new Error("Error al guardar el recurso");
      }
      
      toast.success('Recurso guardado correctamente');
      
      // Limpiar el formulario
      setFormData({
        title: '',
        description: '',
        type: 'link',
        url: '',
        subject: formData.subject, // Mantener la última asignatura seleccionada
        important: false,
      });
      
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <h2 className="text-lg font-semibold mb-4">Agregar recurso rápido</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              required
              placeholder="Nombre del recurso"
            />
          </div>
          
          {/* Asignatura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asignatura *</label>
            <select
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              required
            >
              <option value="">-- Seleccionar asignatura --</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
            <input
              type="url"
              name="url"
              value={formData.url}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              required
              placeholder="https://..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Tipo de recurso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2 text-sm"
              >
                <option value="link">Enlace</option>
                <option value="pdf">PDF</option>
                <option value="slides">Diapositivas</option>
                <option value="video">Video</option>
                <option value="document">Documento</option>
                <option value="other">Otro</option>
              </select>
            </div>
            
            {/* Checkbox para marcar como importante */}
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="important"
                name="important"
                checked={formData.important}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="important" className="ml-2 text-sm text-gray-700">
                Marcar como importante
              </label>
            </div>
          </div>
          
          {/* Descripción (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              className="w-full border border-gray-300 rounded-md p-2 text-sm"
              placeholder="Descripción opcional"
            ></textarea>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Guardando...' : 'Guardar recurso'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickResourceForm;
