import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import SubjectForm from '../../components/SubjectForm';
import SubjectSchedule from '../../components/SubjectSchedule';
import SubjectTasks from '../../components/SubjectTasks';
import SubjectResources from '../../components/SubjectResources';
import { toast } from 'react-toastify';

export default function SubjectDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'schedule', 'tasks', 'resources'

  useEffect(() => {
    if (id) {
      fetchSubject();
    }
  }, [id]);

  const fetchSubject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subjects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSubject(data);
      } else {
        if (res.status === 404) {
          toast.error('La materia no se encontró');
          router.push('/subjects');
        } else {
          throw new Error('Error al obtener los datos de la materia');
        }
      }
    } catch (error) {
      console.error('Error fetching subject:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuccess = (updatedSubject) => {
    setSubject(updatedSubject);
    toast.success('Materia actualizada correctamente');
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta materia? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Materia eliminada correctamente');
        router.push('/subjects');
      } else {
        throw new Error('Error al eliminar la materia');
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Error al eliminar la materia');
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

  return (
    <Layout>
      <Head>
        <title>{subject ? `${subject.name} | UniOrganizer` : 'Detalle de Materia | UniOrganizer'}</title>
      </Head>

      {subject && (
        <>
          {/* Cabecera con nombre de la materia */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center">
              <div
                className="w-4 h-4 rounded-full mr-2"
                style={{ backgroundColor: subject.color || '#CBD5E0' }}
              ></div>
              {subject.name}
              {subject.code && <span className="text-sm text-gray-500 ml-2">({subject.code})</span>}
            </h1>
            
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800"
              title="Eliminar materia"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Pestañas para navegación */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-6">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Detalles
              </button>
              
              <button
                onClick={() => setActiveTab('schedule')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'schedule'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Horario
              </button>
              
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'tasks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tareas
              </button>
              
              <button
                onClick={() => setActiveTab('resources')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'resources'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Recursos
              </button>
            </nav>
          </div>

          {/* Contenido según la pestaña activa */}
          <div>
            {activeTab === 'details' && (
              <SubjectForm subject={subject} onSuccess={handleSaveSuccess} />
            )}
            
            {activeTab === 'schedule' && (
              <SubjectSchedule subject={subject} onSuccess={handleSaveSuccess} />
            )}
            
            {activeTab === 'tasks' && (
              <SubjectTasks subject={subject} />
            )}
            
            {activeTab === 'resources' && (
              <SubjectResources subject={subject} />
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
