import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function SubjectsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    planned: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchSubjects();
  }, [isAuthenticated, router]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subjects');
      if (!res.ok) {
        throw new Error('Error al cargar asignaturas');
      }
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Error al cargar las asignaturas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Estás seguro de eliminar la asignatura "${name}"? Se perderán todos los datos asociados.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        throw new Error('Error al eliminar la asignatura');
      }
      
      toast.success('Asignatura eliminada correctamente');
      fetchSubjects();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la asignatura');
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
        <title>Mis Asignaturas | UniOrganizer</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mis Asignaturas</h1>
        <Link 
          href="/subjects/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nueva Asignatura
        </Link>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">No tienes asignaturas registradas</p>
          <Link href="/subjects/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Crear nueva asignatura
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
            <div 
              key={subject._id}
              className="bg-white rounded-lg shadow overflow-hidden border-t-4"
              style={{ borderColor: subject.color }}
            >
              <div className="p-5">
                <Link 
                  href={`/subjects/${subject._id}`}
                  className="block font-bold text-xl mb-2 hover:text-blue-700"
                >
                  {subject.name}
                </Link>
                
                {subject.code && (
                  <p className="text-sm text-gray-600 mb-2">Código: {subject.code}</p>
                )}
                
                {subject.professor && (
                  <p className="text-gray-700">Prof. {subject.professor}</p>
                )}
                
                <div className="mt-3 text-sm text-gray-600">
                  {subject.credits} créditos
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                  <Link 
                    href={`/subjects/${subject._id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Ver detalles
                  </Link>
                  
                  <div className="space-x-3">
                    <Link 
                      href={`/subjects/edit/${subject._id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(subject._id, subject.name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
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
