import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import KanbanTaskCard from '../../components/KanbanTaskCard';
import CalendarTaskView from '../../components/CalendarTaskView';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Añadimos este fix para React.StrictMode
// Esta función arregla problemas con react-beautiful-dnd en React 18 / StrictMode
const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  
  if (!enabled) {
    return null;
  }
  
  return <Droppable {...props}>{children}</Droppable>;
};

export default function Tasks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'pending', // 'all', 'pending', 'completed'
    subject: 'all',
    priority: 'all'
  });
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'kanban'
  const [statistics, setStatistics] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    upcoming: 0
  });
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchSubjects();
      fetchTasks();
    }
  }, [status, filter]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (filter.status !== 'all') {
        queryParams.append('status', filter.status);
      }
      
      if (filter.subject !== 'all') {
        queryParams.append('subject', filter.subject);
      }
      
      if (filter.priority !== 'all') {
        queryParams.append('priority', filter.priority);
      }
      
      const res = await fetch(`/api/tasks?${queryParams.toString()}`);
      const data = await res.json();
      setTasks(data);
      
      // Calculate statistics
      updateTaskStatistics(data);
      
      // Prepare weekly tasks view
      prepareWeeklyTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  // New function to update task statistics
  const updateTaskStatistics = (tasksData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const stats = {
      total: tasksData.length,
      completed: tasksData.filter(t => t.completed).length,
      pending: tasksData.filter(t => !t.completed).length,
      overdue: tasksData.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < today).length,
      upcoming: tasksData.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) <= nextWeek).length
    };
    
    setStatistics(stats);
  };
  
  // New function to prepare weekly tasks view
  const prepareWeeklyTasks = (tasksData) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + (startOfWeek.getDay() === 0 ? -6 : 1)); // Start on Monday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // End on Sunday
    
    const weekTasks = [];
    
    // Create array for each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(currentDay.getDate() + i);
      
      const tasksForDay = tasksData.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.getDate() === currentDay.getDate() && 
               taskDate.getMonth() === currentDay.getMonth() && 
               taskDate.getFullYear() === currentDay.getFullYear();
      });
      
      weekTasks.push({
        date: new Date(currentDay),
        tasks: tasksForDay,
        isToday: currentDay.getDate() === today.getDate() && 
                currentDay.getMonth() === today.getMonth() && 
                currentDay.getFullYear() === today.getFullYear()
      });
    }
    
    setWeeklyTasks(weekTasks);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) {
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Tarea eliminada correctamente');
        fetchTasks();
      } else {
        throw new Error('Error al eliminar la tarea');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error al eliminar la tarea');
    }
  };

  const toggleTaskStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      if (res.ok) {
        toast.success(`Tarea ${!currentStatus ? 'completada' : 'marcada como pendiente'}`);
        fetchTasks();
      } else {
        throw new Error('Error al actualizar la tarea');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error al actualizar la tarea');
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return { text: 'Alta', class: 'bg-red-100 text-red-800' };
      case 2: return { text: 'Media', class: 'bg-yellow-100 text-yellow-800' };
      case 3: return { text: 'Baja', class: 'bg-green-100 text-green-800' };
      default: return { text: 'Normal', class: 'bg-gray-100 text-gray-800' };
    }
  };

  const formatDueDate = (date) => {
    if (!date) return 'Sin fecha';
    return format(new Date(date), 'dd MMM yyyy', { locale: es });
  };

  const handleStartTask = (taskId) => {
    router.push(`/pomodoro?taskId=${taskId}`);
  };

  // Nueva función para manejar el final del drag and drop
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    
    // Si no hay destino (usuario soltó fuera de una columna) o
    // si el destino es el mismo que la fuente, no hacer nada
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Obtener la tarea que se está moviendo
    const taskId = draggableId;
    
    // Determinar el nuevo estado basado en la columna de destino
    let newStatus;
    let completed = false;
    
    switch (destination.droppableId) {
      case 'pending':
        newStatus = 'pendiente';
        completed = false;
        break;
      case 'in-progress':
        newStatus = 'en_progreso';
        completed = false;
        break;
      case 'completed':
        newStatus = 'completada';
        completed = true;
        break;
      default:
        return;
    }
    
    try {
      // Actualizamos el estado de la tarea en la base de datos
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          completed: completed
        }),
      });

      if (res.ok) {
        toast.success(`Tarea movida a ${newStatus.replace('_', ' ')}`);
        fetchTasks();
      } else {
        throw new Error('Error al actualizar la tarea');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Error al actualizar la tarea');
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
        <title>Mis Tareas | UniOrganizer</title>
      </Head>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Mis Tareas</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => router.push('/tasks/quick')}
            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 focus:outline-none flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Tarea Rápida
          </button>
          <button 
            onClick={() => router.push('/tasks/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Tarea
          </button>
        </div>
      </div>
      
      {/* Task Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-gray-500 text-sm mb-1">Total</span>
          <span className="text-2xl font-bold">{statistics.total}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-gray-500 text-sm mb-1">Pendientes</span>
          <span className="text-2xl font-bold text-amber-600">{statistics.pending}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-gray-500 text-sm mb-1">Completadas</span>
          <span className="text-2xl font-bold text-green-600">{statistics.completed}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-gray-500 text-sm mb-1">Atrasadas</span>
          <span className="text-2xl font-bold text-red-600">{statistics.overdue}</span>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <span className="text-gray-500 text-sm mb-1">Próximas</span>
          <span className="text-2xl font-bold text-blue-600">{statistics.upcoming}</span>
        </div>
      </div>
      
      {/* Weekly Calendar View */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Esta Semana</h2>
        <div className="grid grid-cols-7 gap-2">
          {weeklyTasks.map((day, index) => (
            <div 
              key={index} 
              className={`border rounded-lg p-3 ${day.isToday ? 'border-blue-500 bg-blue-50' : ''}`}
            >
              <div className="text-center mb-2">
                <div className="text-xs text-gray-500">
                  {format(day.date, 'EEE', { locale: es })}
                </div>
                <div className={`text-lg font-medium ${day.isToday ? 'text-blue-600' : ''}`}>
                  {format(day.date, 'd')}
                </div>
              </div>
              
              {day.tasks.length > 0 ? (
                <div className="space-y-1">
                  {day.tasks.slice(0, 3).map(task => (
                    <div 
                      key={task._id} 
                      className={`text-xs p-1 rounded truncate
                        ${task.completed 
                          ? 'bg-gray-100 text-gray-500 line-through' 
                          : task.priority === 'Alta' 
                            ? 'bg-red-100 text-red-800 font-medium' 
                            : task.priority === 'Media'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'}`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {day.tasks.length > 3 && (
                    <div className="text-xs text-center text-gray-500 mt-1">
                      +{day.tasks.length - 3} más
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-center text-gray-400 h-12 flex items-center justify-center">
                  Sin tareas
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* View Mode Selector */}
      <div className="mb-4 flex justify-end">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 text-sm font-medium rounded-l-lg border 
              ${viewMode === 'list' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 text-sm font-medium border-t border-b
              ${viewMode === 'calendar' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Calendario
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 text-sm font-medium border
              ${viewMode === 'kanban' 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Kanban
          </button>
          <button
            type="button"
            onClick={() => router.push('/tasks/eisenhower')}
            className={`px-4 py-2 text-sm font-medium rounded-r-lg border
              bg-white text-gray-700 border-gray-300 hover:bg-gray-50`}
          >
            Eisenhower
          </button>
        </div>
      </div>

      {/* Regular filters section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asignatura
            </label>
            <select
              name="subject"
              value={filter.subject}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad
            </label>
            <select
              name="priority"
              value={filter.priority}
              onChange={handleFilterChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              <option value="1">Alta</option>
              <option value="2">Media</option>
              <option value="3">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">No hay tareas que coincidan con los filtros</p>
          <Link href="/tasks/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Crear nueva tarea
          </Link>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarea
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asignatura
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha límite
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => {
                const priority = getPriorityLabel(task.priority);
                
                return (
                  <tr key={task._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {task.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.subject ? (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ 
                            backgroundColor: `${task.subject.color}20`,
                            color: task.subject.color 
                          }}>
                          {task.subject.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">Sin asignatura</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDueDate(task.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${priority.class}`}>
                        {priority.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <input 
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskStatus(task._id, task.completed)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2">{task.completed ? 'Completada' : 'Pendiente'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleStartTask(task._id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                        title="Comenzar con Pomodoro"
                      >
                        Realizar
                      </button>
                      <Link href={`/tasks/${task._id}/edit`} className="text-blue-600 hover:text-blue-900 mr-3">
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(task._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="bg-white rounded-lg shadow p-4">
          <CalendarTaskView tasks={tasks} />
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Columna: Pendientes */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                Pendientes
              </h3>
              <StrictModeDroppable droppableId="pending">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] p-2 ${
                      snapshot.isDraggingOver ? 'bg-yellow-50 border-2 border-dashed border-yellow-200' : ''
                    }`}
                  >
                    {tasks
                      .filter(task => !task.completed && (!task.status || task.status === 'pendiente'))
                      .map((task, index) => (
                        <Draggable 
                          key={task._id} 
                          draggableId={task._id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'opacity-75' : ''}
                            >
                              <KanbanTaskCard 
                                task={task} 
                                onStatusChange={() => toggleTaskStatus(task._id, task.completed)}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                    {tasks.filter(task => !task.completed && (!task.status || task.status === 'pendiente')).length === 0 && (
                      <div className="text-center p-4 text-gray-500 text-sm border border-dashed border-gray-300 rounded">
                        Arrastra tareas aquí
                      </div>
                    )}
                  </div>
                )}
              </StrictModeDroppable>
            </div>
            
            {/* Columna: En progreso */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                En progreso
              </h3>
              <StrictModeDroppable droppableId="in-progress">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] p-2 ${
                      snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-dashed border-blue-200' : ''
                    }`}
                  >
                    {tasks
                      .filter(task => !task.completed && task.status === 'en_progreso')
                      .map((task, index) => (
                        <Draggable 
                          key={task._id} 
                          draggableId={task._id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'opacity-75' : ''}
                            >
                              <KanbanTaskCard 
                                task={task} 
                                onStatusChange={() => toggleTaskStatus(task._id, task.completed)}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                    {tasks.filter(task => !task.completed && task.status === 'en_progreso').length === 0 && (
                      <div className="text-center p-4 text-gray-500 text-sm border border-dashed border-gray-300 rounded">
                        Arrastra tareas aquí
                      </div>
                    )}
                  </div>
                )}
              </StrictModeDroppable>
            </div>
            
            {/* Columna: Completadas */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Completadas
              </h3>
              <StrictModeDroppable droppableId="completed">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-3 min-h-[200px] p-2 ${
                      snapshot.isDraggingOver ? 'bg-green-50 border-2 border-dashed border-green-200' : ''
                    }`}
                  >
                    {tasks
                      .filter(task => task.completed)
                      .map((task, index) => (
                        <Draggable 
                          key={task._id} 
                          draggableId={task._id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={snapshot.isDragging ? 'opacity-75' : ''}
                            >
                              <KanbanTaskCard 
                                task={task} 
                                onStatusChange={() => toggleTaskStatus(task._id, task.completed)}
                                isDragging={snapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                    {tasks.filter(task => task.completed).length === 0 && (
                      <div className="text-center p-4 text-gray-500 text-sm border border-dashed border-gray-300 rounded">
                        Arrastra tareas aquí
                      </div>
                    )}
                  </div>
                )}
              </StrictModeDroppable>
            </div>
          </div>
        </DragDropContext>
      )}
    </Layout>
  );
}
