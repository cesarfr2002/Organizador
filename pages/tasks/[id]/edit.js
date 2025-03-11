import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/Layout';
import { toast } from 'react-toastify';
import Link from 'next/link';

export default function EditTask() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: '2',
    subject: '',
    completed: false
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && id) {
      fetchSubjects();
      fetchTask();
    }
  }, [status, id]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error al cargar las asignaturas');
    }
  };

  const fetchTask = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      
      if (!res.ok) {
        throw new Error('Error al obtener la tarea');
      }
      
      const data = await res.json();
      
      // Formatear fecha para el input date
      let formattedTask = { ...data };
      if (formattedTask.dueDate) {
        const date = new Date(formattedTask.dueDate);
        formattedTask.dueDate = date.toISOString().split('T')[0];
      }
      
      setTask(formattedTask);
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Error al cargar la tarea');
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTask(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });

      if (res.ok) {
        toast.success('Tarea actualizada correctamente');
        router.push('/tasks');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Error al actualizar la tarea');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error(error.message || 'Error al actualizar la tarea');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || (loading && id)) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Editar Tarea | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Editar Tarea</h1>
        <Link href="/tasks" className="text-blue-600 hover:text-blue-800">
          Volver a la lista
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={task.title}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={task.description || ''}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            ></textarea>
          </div>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha límite
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={task.dueDate || ''}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                id="priority"
                name="priority"
                value={task.priority}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="1">Alta</option>
                <option value="2">Media</option>
                <option value="3">Baja</option>
              </select>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Asignatura
              </label>
              <select
                id="subject"
                name="subject"
                value={task.subject || ''}
                onChange={handleChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sin asignatura</option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="completed"
                name="completed"
                checked={task.completed}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="completed" className="ml-2 block text-sm text-gray-900">
                Marcar como completada
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-5">
            <button
              type="button"
              onClick={() => router.push('/tasks')}
              className="bg-gray-200 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Actualizar tarea'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
