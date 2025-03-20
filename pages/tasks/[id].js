import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import TaskNotes from '../../components/TaskNotes';
import TaskResources from '../../components/TaskResources';

export default function TaskDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (id) {
      fetchTask();
    }
  }, [id, isAuthenticated, router]);

  const fetchTask = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data);
      } else {
        throw new Error('Error al cargar la tarea');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('No se pudo cargar la tarea');
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async () => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (res.ok) {
        const updatedTask = await res.json();
        setTask(updatedTask);
        toast.success(updatedTask.completed ? '¡Tarea completada!' : 'Tarea marcada como pendiente');
      } else {
        throw new Error('Error al actualizar la tarea');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error al actualizar la tarea');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="text-center">
          <p>No se encontró la tarea solicitada.</p>
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Volver a la lista de tareas
          </Link>
        </div>
      </Layout>
    );
  }

  // Determinar el color basado en la prioridad
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'Alta': return 'bg-red-100 text-red-800';
      case 'Media': return 'bg-yellow-100 text-yellow-800';
      case 'Baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <Head>
        <title>{task.title} | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <div className="flex space-x-2">
          <Link href="/tasks" className="text-blue-600 hover:text-blue-800 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a la lista
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalles de la tarea */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {task.subject && (
                <span
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ 
                    backgroundColor: `${task.subject.color}20`,
                    color: task.subject.color 
                  }}
                >
                  {task.subject.name}
                </span>
              )}
              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor()}`}>
                {task.priority}
              </span>
              {task.dueDate && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && !task.completed
                    ? 'bg-red-100 text-red-800'
                    : isToday(new Date(task.dueDate))
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                }`}>
                  {format(new Date(task.dueDate), 'PPP', { locale: es })}
                </span>
              )}
              <span className={`px-2 py-1 text-xs rounded-full ${
                task.completed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {task.completed ? 'Completada' : 'Pendiente'}
              </span>
            </div>

            {task.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Descripción</h2>
                <p className="text-gray-700 whitespace-pre-line">{task.description}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/tasks/${task._id}/edit`)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => router.push(`/pomodoro?taskId=${task._id}`)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Pomodoro
                </button>
              </div>
              <button
                onClick={toggleTaskStatus}
                className={`px-4 py-2 rounded ${
                  task.completed 
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar con notas relacionadas */}
        <div className="space-y-6">
          {/* Componente de notas vinculadas */}
          <TaskNotes taskId={id} />
          
          {/* Recursos vinculados - Nuevo componente */}
          <TaskResources taskId={id} />
          
          {/* Detalles adicionales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium mb-3">Detalles</h3>
            <ul className="space-y-2 text-sm">
              {task.estimatedTime > 0 && (
                <li className="flex justify-between">
                  <span className="text-gray-600">Tiempo estimado:</span>
                  <span className="font-medium">{task.estimatedTime} minutos</span>
                </li>
              )}
              {task.studyTime > 0 && (
                <li className="flex justify-between">
                  <span className="text-gray-600">Tiempo estudiado:</span>
                  <span className="font-medium">{task.studyTime} minutos</span>
                </li>
              )}
              {task.weight > 0 && (
                <li className="flex justify-between">
                  <span className="text-gray-600">Peso en la nota:</span>
                  <span className="font-medium">{task.weight}%</span>
                </li>
              )}
              {task.difficulty && (
                <li className="flex justify-between">
                  <span className="text-gray-600">Dificultad:</span>
                  <span className="font-medium">
                    {task.difficulty === 'facil' ? 'Fácil' :
                     task.difficulty === 'media' ? 'Media' : 'Difícil'}
                  </span>
                </li>
              )}
              <li className="flex justify-between">
                <span className="text-gray-600">Fecha de creación:</span>
                <span className="font-medium">
                  {task.createdAt && format(new Date(task.createdAt), 'dd/MM/yyyy', { locale: es })}
                </span>
              </li>
              {task.completedAt && (
                <li className="flex justify-between">
                  <span className="text-gray-600">Fecha de finalización:</span>
                  <span className="font-medium">
                    {format(new Date(task.completedAt), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res, params }) {
  const cookies = req.headers.cookie || '';
  const hasAuthCookie = cookies.includes('uorganizer_auth_token=');
  
  if (!hasAuthCookie) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: {}
  };
}
