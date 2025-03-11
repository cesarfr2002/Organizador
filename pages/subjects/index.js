import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';

export default function Subjects() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (status === 'authenticated') {
      fetchSubjects();
    }
  }, [status, router]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error al cargar las asignaturas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta asignatura? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Asignatura eliminada correctamente');
        fetchSubjects();
      } else {
        throw new Error('Error al eliminar la asignatura');
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Error al eliminar la asignatura');
    }
  };

  if (status === 'loading' || loading) {
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
        <title>Mis Asignaturas | UniOrganizer</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Asignaturas</h1>
        <Link 
          href="/subjects/new" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Nueva Asignatura
        </Link>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">No tienes asignaturas registradas</p>
          <Link href="/subjects/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Crear primera asignatura
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <div 
              key={subject._id} 
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
            >
              <div 
                className="h-2"
                style={{ backgroundColor: subject.color }}
              ></div>
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{subject.name}</h3>
                
                {subject.professor && (
                  <p className="text-gray-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {subject.professor}
                  </p>
                )}
                
                <p className="text-gray-600 text-sm mt-2">
                  {subject.schedule.length} {subject.schedule.length === 1 ? 'clase' : 'clases'} programada{subject.schedule.length !== 1 ? 's' : ''}
                </p>
                
                <div className="flex justify-end mt-4 space-x-2">
                  <Link
                    href={`/subjects/${subject._id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Ver detalles
                  </Link>
                  <Link
                    href={`/subjects/${subject._id}/edit`}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDelete(subject._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
