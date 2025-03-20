import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { toast } from 'react-toastify';
import SubjectForm from '../../components/SubjectForm';
import SubjectSchedule from '../../components/SubjectSchedule';
import SubjectTasks from '../../components/SubjectTasks';
import SubjectResources from '../../components/SubjectResources';
import Link from 'next/link';
import { format, isPast, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

export default function SubjectDetailPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'schedule', 'tasks', 'resources'
  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [completedTasksCount, setCompletedTasksCount] = useState(0);
  const [resources, setResources] = useState([]);
  const [resourcesCount, setResourcesCount] = useState(0);
  const [featuredResources, setFeaturedResources] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (id) {
      fetchSubject();
    }
  }, [id, isAuthenticated, router]);

  useEffect(() => {
    if (subject) {
      fetchSubjectData();
    }
  }, [subject, activeTab]);

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

  const fetchSubjectData = async () => {
    // Solo cargar datos adicionales cuando sea necesario
    if (activeTab === 'tasks' || activeTab === 'overview') {
      fetchTasks();
    }
    
    if (activeTab === 'resources' || activeTab === 'overview') {
      fetchResources();
    }
  };

  const fetchTasks = async () => {
    try {
      // Tareas pendientes
      const pendingRes = await fetch(`/api/subjects/${id}/tasks?filter=pending`);
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingTasks(pendingData);
        setPendingTasksCount(pendingData.length);
      }
      
      // Tareas completadas
      const completedRes = await fetch(`/api/subjects/${id}/tasks?filter=completed`);
      if (completedRes.ok) {
        const completedData = await completedRes.json();
        setCompletedTasks(completedData);
        setCompletedTasksCount(completedData.length);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch(`/api/subjects/${id}/resources`);
      if (res.ok) {
        const data = await res.json();
        setResources(data);
        setResourcesCount(data.length);
        
        // Filtrar recursos destacados
        const featured = data.filter(resource => resource.important);
        setFeaturedResources(featured);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const calculateProgress = () => {
    const totalTasks = pendingTasksCount + completedTasksCount;
    if (totalTasks === 0) return 0;
    return Math.round((completedTasksCount / totalTasks) * 100);
  };

  const formatLocation = (location) => {
    if (!location) return "";
    
    if (typeof location === 'string') return location;
    
    const parts = [];
    if (location.campus) parts.push(location.campus);
    if (location.building) parts.push(`Edificio ${location.building}`);
    if (location.floor) parts.push(`Piso ${location.floor}`);
    if (location.room) parts.push(`Sala ${location.room}`);
    
    return parts.join(', ');
  };

  const getDayName = (day) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[day - 1] || '';
  };

  const getNextClasses = () => {
    if (!subject || !subject.schedule) return [];
    
    // Organizar por día de la semana
    return subject.schedule.sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.startTime.localeCompare(b.startTime);
    });
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'link':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
          </svg>
        );
      case 'slides':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"></path>
            <path d="M9 13h2v5a1 1 0 11-2 0v-5z"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const trackResourceAccess = async (resourceId) => {
    try {
      await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH'
      });
    } catch (error) {
      console.error('Error tracking resource access:', error);
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
                {pendingTasksCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {pendingTasksCount}
                  </span>
                )}
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
                {resourcesCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {resourcesCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Resumen
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
            
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Progreso */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-3">Progreso</h3>
                  <div className="flex items-center mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${calculateProgress()}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 ml-2">
                      {calculateProgress()}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-green-50 p-2 rounded">
                      <span className="text-green-800 block">Completadas</span>
                      <span className="text-green-800 font-bold text-lg">{completedTasksCount}</span>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <span className="text-blue-800 block">Pendientes</span>
                      <span className="text-blue-800 font-bold text-lg">{pendingTasksCount}</span>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Link 
                      href={`/tasks?subject=${subject._id}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Ver todas las tareas
                    </Link>
                  </div>
                </div>
                
                {/* Próximas clases */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-3">Próximas clases</h3>
                  {subject.schedule && subject.schedule.length > 0 ? (
                    <div className="space-y-3">
                      {getNextClasses().map((session, idx) => (
                        <div key={idx} className="flex items-start">
                          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-2 mt-0.5">
                            {getDayName(session.day)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{session.startTime} - {session.endTime}</p>
                            {session.location && (
                              <p className="text-xs text-gray-500">{formatLocation(session.location)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay clases programadas</p>
                  )}
                </div>

                {/* Tareas pendientes */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-3">Tareas pendientes</h3>
                  <div className="space-y-3">
                    {pendingTasks.length > 0 ? (
                      pendingTasks.slice(0, 5).map(task => (
                        <div key={task._id} className="flex items-center">
                          <div 
                            className={`w-1.5 h-1.5 rounded-full mr-2 ${
                              task.priority === 'Alta' ? 'bg-red-500' : 
                              task.priority === 'Media' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                          ></div>
                          <Link
                            href={`/tasks/${task._id}/edit`}
                            className="text-sm text-gray-700 hover:text-blue-600 flex-grow truncate"
                          >
                            {task.title}
                          </Link>
                          <span className="text-xs text-gray-500">
                            {task.dueDate ? format(new Date(task.dueDate), 'd MMM', { locale: es }) : 'Sin fecha'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No hay tareas pendientes</p>
                    )}
                    
                    {pendingTasks.length > 5 && (
                      <div className="text-right">
                        <button 
                          onClick={() => setActiveTab('tasks')}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Ver todas ({pendingTasks.length})
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/tasks/new?subject=${subject._id}`}
                      className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Nueva tarea
                    </Link>
                  </div>
                </div>
                
                {/* Recursos destacados */}
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-3">Recursos destacados</h3>
                  {featuredResources.length > 0 ? (
                    <div className="space-y-3">
                      {featuredResources.slice(0, 5).map(resource => (
                        <div key={resource._id} className="flex items-center">
                          <div className="text-blue-500 mr-2">
                            {getResourceIcon(resource.type)}
                          </div>
                          <a 
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-gray-700 hover:text-blue-600 truncate flex-grow"
                            onClick={() => trackResourceAccess(resource._id)}
                          >
                            {resource.title}
                          </a>
                          {resource.important && (
                            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                        </div>
                      ))}
                      
                      {featuredResources.length > 0 && resources.length > featuredResources.length && (
                        <div className="text-right">
                          <button 
                            onClick={() => setActiveTab('resources')}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Ver todos los recursos ({resourcesCount})
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay recursos destacados</p>
                  )}
                  <div className="mt-4">
                    <Link
                      href={`/subjects/${subject._id}/resources/new`}
                      className="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1 rounded-md inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Añadir recurso
                    </Link>
                  </div>
                </div>

                {/* Información académica */}
                <div className="md:col-span-2 bg-white rounded-lg shadow p-5">
                  <h3 className="text-lg font-medium mb-3">Información académica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Profesor</h4>
                      <p>{subject.professor || 'No especificado'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Email</h4>
                      <p>{subject.professorEmail || 'No especificado'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Créditos</h4>
                      <p>{subject.credits || 'No especificado'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Aula virtual</h4>
                      {subject.virtualClassroomUrl ? (
                        <a 
                          href={subject.virtualClassroomUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Abrir aula virtual
                        </a>
                      ) : (
                        <p>No especificado</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Estado</h4>
                      <div className="flex items-center">
                        <span 
                          className={`inline-block w-2 h-2 rounded-full mr-2 ${
                            subject.status === 'active' ? 'bg-green-500' : 
                            subject.status === 'completed' ? 'bg-blue-500' : 'bg-yellow-500'
                          }`}
                        ></span>
                        <span>
                          {subject.status === 'active' ? 'Activa' : 
                           subject.status === 'completed' ? 'Completada' : 
                           subject.status === 'planned' ? 'Planificada' : 'No especificado'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Notas</h4>
                      <div className="flex items-center">
                        <span className="font-bold text-lg mr-2">
                          {subject.currentGrade || '—'}
                        </span>
                        <span className="text-sm text-gray-500">
                          / {subject.finalGrade || 100}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
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
