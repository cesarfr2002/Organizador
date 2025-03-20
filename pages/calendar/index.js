import { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';
import EventModal from '../../components/calendar/EventModal';
import EventDetails from '../../components/calendar/EventDetails';
import FilterControls from '../../components/calendar/FilterControls';
import Head from 'next/head';

// Set up Spanish localization
moment.locale('es');
const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filters, setFilters] = useState({
    showCompleted: false,
    categories: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const response = await fetch('/api/calendar/events');
      const data = await response.json();
      
      if (response.ok) {
        // Transform data for Calendar component
        const formattedEvents = data.map(event => ({
          ...event,
          start: new Date(event.start),
          end: event.end ? new Date(event.end) : undefined,
          allDay: event.allDay || false,
        }));
        
        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Apply filters to events
  const filteredEvents = events.filter(event => {
    if (!filters.showCompleted && event.completed) {
      return false;
    }
    
    if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
      return false;
    }
    
    return true;
  });

  // Calendar event handlers
  const handleSelectSlot = ({ start }) => {
    setSelectedDate(start);
    setShowAddModal(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowDetailModal(true);
  };

  // Event modal handlers
  const handleAddEvent = async (newEvent) => {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });

      if (response.ok) {
        const savedEvent = await response.json();
        setEvents([...events, {
          ...savedEvent,
          start: new Date(savedEvent.start),
          end: savedEvent.end ? new Date(savedEvent.end) : undefined,
        }]);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleUpdateEvent = async (updatedEvent) => {
    try {
      const response = await fetch(`/api/calendar/events/${updatedEvent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
      });

      if (response.ok) {
        setEvents(events.map(event => 
          event._id === updatedEvent._id ? {
            ...updatedEvent,
            start: new Date(updatedEvent.start),
            end: updatedEvent.end ? new Date(updatedEvent.end) : undefined,
          } : event
        ));
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(events.filter(event => event._id !== eventId));
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Calendario | UniOrganizer</title>
        </Head>
        
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Calendario</h1>
          
          <FilterControls 
            filters={filters} 
            setFilters={setFilters} 
            events={events}
          />
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mt-4">
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="h-[75vh]">
                <Calendar
                  localizer={localizer}
                  events={filteredEvents}
                  startAccessor="start"
                  endAccessor="end"
                  selectable
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  defaultView="month"
                  views={['month', 'week', 'day', 'agenda']}
                  eventPropGetter={(event) => {
                    const backgroundColor = event.color || '#3174ad';
                    return { style: { backgroundColor } };
                  }}
                />
              </div>
            )}
          </div>
        </div>
        
        {showAddModal && (
          <EventModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={handleAddEvent}
            initialDate={selectedDate}
          />
        )}
        
        {showDetailModal && selectedEvent && (
          <EventDetails
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            event={selectedEvent}
            onUpdate={handleUpdateEvent}
            onDelete={handleDeleteEvent}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}
