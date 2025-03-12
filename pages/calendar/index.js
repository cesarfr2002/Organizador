import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, addDays, subDays, parseISO, isValid, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Configuración del localizador de momentjs para el calendario
moment.locale('es');
const localizer = momentLocalizer(moment);

// Función para formatear objetos de ubicación antes de renderizarlos
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

export default function CalendarView() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  const [dayTasks, setDayTasks] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
  const [displayedMonth, setDisplayedMonth] = useState(new Date()); // Para la navegación del calendario

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchEvents();
      fetchTasks();
      // Inicializar el día seleccionado como hoy
      setSelectedDay(new Date());
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedDay) {
      const selectedDate = new Date(selectedDay);
      
      // Filtrar eventos del día seleccionado
      const filteredEvents = events.filter(event => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        return isSameDay(eventDate, selectedDate);
      });
      setDayEvents(filteredEvents);
      
      // Filtrar tareas del día seleccionado
      const filteredTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return isSameDay(taskDate, selectedDate);
      });
      setDayTasks(filteredTasks);
    }
  }, [selectedDay, events, tasks]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/calendar/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      } else {
        throw new Error('Error al cargar eventos');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error al cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/calendar/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      } else {
        throw new Error('Error al cargar tareas');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error al cargar las tareas');
    }
  };

  // Verificar si una fecha tiene eventos o tareas y devolver las clases adecuadas
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    let eventDots = [];
    let taskDots = [];
    
    // Buscar eventos para esta fecha
    events.forEach(event => {
      if (!event.date) return;
      const eventDate = new Date(event.date);
      if (isSameDay(eventDate, date)) {
        eventDots.push({
          type: 'event',
          color: event.color || '#3182CE'
        });
      }
    });
    
    // Buscar tareas para esta fecha
    tasks.forEach(task => {
      if (!task.dueDate) return;
      const taskDate = new Date(task.dueDate);
      if (isSameDay(taskDate, date)) {
        const priorityColor = task.priority === 'Alta' ? '#E53E3E' : 
                              task.priority === 'Media' ? '#ED8936' : '#38A169';
        taskDots.push({
          type: 'task',
          color: priorityColor
        });
      }
    });
    
    if (eventDots.length > 0 || taskDots.length > 0) {
      return (
        <div className="flex justify-center">
          <div className="flex space-x-1 mt-1">
            {/* Mostrar hasta 3 puntos, priorizar por tipo */}
            {[...eventDots, ...taskDots].slice(0, 3).map((dot, index) => (
              <div 
                key={index}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: dot.color }}
              ></div>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };

  const handleDayClick = (value) => {
    setSelectedDay(value);
  };

  const formatEventTime = (event) => {
    if (event.startTime && event.endTime) {
      return `${event.startTime} - ${event.endTime}`;
    } else if (event.time) {
      return event.time;
    }
    return 'Todo el día';
  };

  const getFormattedDate = () => {
    if (!selectedDay) return '';
    return format(new Date(selectedDay), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  };

  const navigateToday = () => {
    const today = new Date();
    setSelectedDay(today);
    setDate(today);
    setDisplayedMonth(today);
  };

  const createNewEvent = () => {
    // Pasar fecha seleccionada como query param para pre-llenar el formulario
    const dateParam = selectedDay ? format(new Date(selectedDay), 'yyyy-MM-dd') : '';
    router.push(`/calendar/new?date=${dateParam}`);
  };
  
  // Navegar entre períodos (semana, mes)
  const navigatePeriod = (direction) => {
    let newDate;
    if (viewMode === 'month') {
      // Navegar meses
      newDate = new Date(displayedMonth);
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      // Navegar semanas
      newDate = new Date(displayedMonth);
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      // Navegar días
      newDate = new Date(displayedMonth);
      newDate.setDate(newDate.getDate() + direction);
    }
    setDisplayedMonth(newDate);
    setDate(newDate);
  };

  // Componente para renderizar evento en el calendario (donde posiblemente esté el error)
  const EventComponent = ({ event }) => (
    <div title={`${event.title} - ${formatLocation(event.location)}`} className="overflow-hidden">
      <p className="text-sm font-medium truncate">{event.title}</p>
      {event.location && (
        <p className="text-xs truncate">
          {/* Usar formatLocation en lugar del objeto directo */}
          {formatLocation(event.location)}
        </p>
      )}
    </div>
  );

  // Componente para la información detallada al hacer clic en un evento
  const EventDetails = ({ event }) => (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-medium">{event.title}</h3>
      {event.description && <p className="mt-1 text-gray-600">{event.description}</p>}
      {event.subject && <p className="text-sm text-gray-600">Asignatura: {event.subject}</p>}
      {event.type && <p className="text-sm text-gray-600">Tipo: {event.type}</p>}
      {event.location && (
        <p className="text-sm text-gray-600">
          Ubicación: {formatLocation(event.location)}
        </p>
      )}
      <p className="text-sm text-gray-600">
        Fecha: {moment(event.start).format('DD/MM/YYYY')}
      </p>
      <p className="text-sm text-gray-600">
        Hora: {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
      </p>
    </div>
  );

  // Asegurarse de que en todas las partes donde pueda haber un objeto location, se use formatLocation
  const processEvents = (events) => {
    return events.map(event => ({
      ...event,
      // Si se necesita pasar la ubicación como texto para algún componente, 
      // se puede agregar una propiedad locationText
      locationText: formatLocation(event.location)
    }));
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
        <title>Calendario | UniOrganizer</title>
      </Head>

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Calendario</h1>
          <p className="text-gray-600 mt-1">
            Vista de tus clases, eventos y fechas límite de tareas
          </p>
        </div>
        
        {/* Botones de acción */}
        <div className="flex space-x-2">
          <button 
            onClick={navigateToday}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 focus:outline-none"
          >
            Hoy
          </button>
          <button 
            onClick={createNewEvent}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Evento
          </button>
        </div>
      </div>
      
      {/* Controles de navegación y vistas */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex justify-between items-center">
          {/* Controles de navegación */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigatePeriod(-1)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-lg font-medium">
              {viewMode === 'month' 
                ? format(displayedMonth, 'MMMM yyyy', { locale: es })
                : viewMode === 'week'
                  ? `Semana del ${format(startOfWeek(displayedMonth, {weekStartsOn: 1}), 'd MMM', { locale: es })} al ${format(endOfWeek(displayedMonth, {weekStartsOn: 1}), 'd MMM', { locale: es })}`
                  : format(displayedMonth, "d 'de' MMMM", { locale: es })
              }
            </h2>
            
            <button 
              onClick={() => navigatePeriod(1)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Selector de vista */}
          <div className="bg-gray-100 rounded-lg inline-flex">
            <button 
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-lg ${viewMode === 'month' ? 'bg-white shadow' : ''}`}
            >
              Mes
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-lg ${viewMode === 'week' ? 'bg-white shadow' : ''}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-sm rounded-lg ${viewMode === 'day' ? 'bg-white shadow' : ''}`}
            >
              Día
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4">
            <BigCalendar
              localizer={localizer}
              events={processEvents(events)}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 500 }}
              messages={{
                // ...existing code...
              }}
              components={{
                event: EventComponent, // Usar el componente personalizado para evitar renderizado directo
                // ...existing code...
              }}
              // ...existing code...
            />
            {/* Leyenda */}
            <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span>Eventos</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span>Tareas prioritarias</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span>Tareas regulares</span>
              </div>
            </div>
          </div>
        </div>

        {/* Eventos del día seleccionado */}
        <div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">
                {getFormattedDate()}
              </h2>
              <button 
                onClick={() => router.push(`/calendar/new?date=${format(new Date(selectedDay), 'yyyy-MM-dd')}`)}
                className="text-blue-600 hover:text-blue-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>

            {selectedDay && (
              <div>
                {dayEvents.length === 0 && dayTasks.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p>No hay actividades para este día</p>
                    <button 
                      onClick={() => router.push(`/calendar/new?date=${format(new Date(selectedDay), 'yyyy-MM-dd')}`)}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Agregar un evento
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cronología del día */}
                    <div className="relative">
                      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      <div className="space-y-2">
                        {dayEvents.length > 0 && dayEvents
                          .sort((a, b) => {
                            const timeA = a.startTime || a.time || '00:00';
                            const timeB = b.startTime || b.time || '00:00';
                            return timeA.localeCompare(timeB);
                          })
                          .map((event, index) => (
                            <div key={index} className="relative pl-8">
                              <div className="absolute left-0 mt-1.5 w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center">
                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div 
                                className="p-2 rounded-lg bg-blue-50 border border-blue-100"
                                style={{ backgroundColor: event.color ? `${event.color}10` : '' }}
                              >
                                <p className="text-sm font-medium">{formatEventTime(event)}</p>
                                <p className="font-medium">{event.name || event.title}</p>
                                {event.location && (
                                  <p className="text-xs text-gray-500 flex items-center">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                    {formatLocation(event.location)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        }

                        {/* Tareas con vencimiento en este día */}
                        {dayTasks.length > 0 && (
                          <div className="mt-4 relative pl-8">
                            <div className="absolute left-0 mt-1.5 w-6 h-6 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div className="p-2 rounded-lg bg-red-50 border border-red-100">
                              <h3 className="font-medium mb-2">Tareas para hoy</h3>
                              <ul className="space-y-2">
                                {dayTasks.map((task) => (
                                  <li key={task._id} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={task.completed}
                                      onChange={async () => {
                                        try {
                                          await fetch(`/api/tasks/${task._id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ completed: !task.completed })
                                          });
                                          fetchTasks();
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      }}
                                      className="mr-2 h-4 w-4 rounded border-gray-300"
                                    />
                                    <div className="flex-1">
                                      <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                        {task.title}
                                      </p>
                                      {task.subject && (
                                        <div className="flex items-center">
                                          <span 
                                            className="inline-block h-2 w-2 rounded-full mr-1"
                                            style={{ backgroundColor: task.subject.color }}
                                          ></span>
                                          <span className="text-xs text-gray-500">
                                            {task.subject.name}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    {task.priority && (
                                      <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${
                                        task.priority === 'Alta' ? 'bg-red-100 text-red-800' :
                                        task.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {task.priority}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .react-calendar {
          border: none;
          font-family: inherit;
        }
        .react-calendar__tile {
          padding: 1em 0.5em;
          position: relative;
        }
        .react-calendar__tile--now {
          background: #EBF8FF;
        }
        .react-calendar__tile--active {
          background: #BEE3F8;
          color: black;
        }
        .react-calendar__month-view__days__day--weekend {
          color: #F56565;
        }
        .react-calendar__tile--hasContent {
          font-weight: bold;
        }
      `}</style>
    </Layout>
  );
}
