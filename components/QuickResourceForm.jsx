import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function QuickResourceForm({ subjects }) {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'link',
    subjectId: subjects.length > 0 ? subjects[0]._id : '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Debes iniciar sesión para agregar recursos');
      return;
    }

    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
        }),
      });

      if (response.ok) {
        router.push('/resources');
      } else {
        const error = await response.json();
        alert(`Error al crear el recurso: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Ocurrió un error al guardar el recurso');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Agregar Recurso Rápido</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Título
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            rows={3}
          ></textarea>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            URL
          </label>
          <input
            type="url"
            name="url"
            value={formData.url}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="link">Enlace</option>
            <option value="document">Documento</option>
            <option value="video">Video</option>
            <option value="article">Artículo</option>
            <option value="other">Otro</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Asignatura
          </label>
          <select
            name="subjectId"
            value={formData.subjectId}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {subjects.map(subject => (
              <option key={subject._id} value={subject._id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-200"
          >
            Guardar Recurso
          </button>
        </div>
      </form>
    </div>
  );
}
