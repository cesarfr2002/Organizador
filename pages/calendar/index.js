import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchEvents();
      fetchTasks();
    }
  }, [status, router]);

  useEffect(() => {
    if (selectedDay) {
      const selectedDate = new Date(selectedDay);
      
      // Filtrar eventos del día seleccionado
      const filteredEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === selectedDate.toDateString();
      });
      setDayEvents(filteredEvents);
      
      // Filtrar tareas del día seleccionado
      const filteredTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === selectedDate.toDateString();
      });
      setDayTasks(filteredTasks);
    }
  }, [selectedDay, events, tasks]);

  const fetchEvents = async () => {
    try {
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

  // Verificar si una fecha tiene eventos o tareas
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const hasEvent = events.some(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
    
    const hasTask = tasks.some(task => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
    
    if (hasEvent || hasTask) {
      return (
        <div className="flex justify-center">
          <div className="flex space-x-1 mt-1">
            {hasEvent && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
            {hasTask && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
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

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="text-gray-600 mt-2">
          Vista de tus clases, eventos y fechas límite de tareas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-4">
            <Calendar
              onChange={setDate}
              value={date}
              onClickDay={handleDayClick}
              tileContent={tileContent}
              locale="es-ES"
              className="w-full border-0"
            />
          </div>
        </div>

        {/* Eventos del día seleccionado */}
        <div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">
              {selectedDay ? format(new Date(selectedDay), "EEEE, d 'de' MMMM", { locale: es }) : 'Selecciona un día'}
            </h2>

            {selectedDay && (
              <div>
                {dayEvents.length === 0 && dayTasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay eventos ni tareas para este día</p>
                ) : (
                  <div className="space-y-4">
                    {dayEvents.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2 text-blue-700">Eventos y Clases</h3>
                        <ul className="space-y-2">
                          {dayEvents.map((event, index) => (
                            <li key={index} className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                              <div className="flex items-start">
                                <div 
                                  className="flex-shrink-0 w-3 h-3 mt-1.5 mr-2 rounded-full"
                                  style={{ backgroundColor: event.color || '#3f51b5' }}
                                ></div>
                                <div>
                                  <p className="font-medium">{event.name || event.title}</p>
                                  <p className="text-sm text-gray-600">{formatEventTime(event)}</p>
                                  {event.location && (
                                    <p className="text-xs text-gray-500">{event.location}</p>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {dayTasks.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2 text-red-700">Tareas</h3>
                        <ul className="space-y-2">
                          {dayTasks.map((task) => (
                            <li key={task._id} className="p-2 rounded-lg bg-red-50 border border-red-100">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() => {}}
                                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                />
                                <div>
                                  <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                    {task.title}
                                  </p>
                                  {task.subject && (
                                    <p className="text-xs" style={{ color: task.subject.color }}>
                                      {task.subject.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
