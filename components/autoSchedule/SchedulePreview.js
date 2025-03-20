import { useEffect, useState } from 'react';

export default function SchedulePreview({ events }) {
  const [groupedEvents, setGroupedEvents] = useState({});
  
  useEffect(() => {
    // Group events by day
    const grouped = events.reduce((acc, event) => {
      const date = new Date(event.start);
      const dateKey = date.toLocaleDateString(undefined, { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      acc[dateKey].push(event);
      return acc;
    }, {});
    
    // Sort events within each day by start time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => new Date(a.start) - new Date(b.start));
    });
    
    setGroupedEvents(grouped);
  }, [events]);

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getDurationInMinutes = (start, end) => {
    return Math.round((new Date(end) - new Date(start)) / (1000 * 60));
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500';
      case 'medium':
        return 'border-l-4 border-yellow-500';
      case 'low':
        return 'border-l-4 border-green-500';
      default:
        return 'border-l-4 border-blue-500';
    }
  };

  return (
    <div className="space-y-8">
      {Object.keys(groupedEvents).length === 0 ? (
        <p className="text-center py-4 text-gray-500 dark:text-gray-400">
          No hay eventos programados para mostrar.
        </p>
      ) : (
        Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {date}
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {dayEvents.map((event, index) => (
                <div 
                  key={event._id || index} 
                  className={`${getPriorityColor(event.priority)} p-4 ${
                    index !== dayEvents.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </h4>
                      
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        <span>
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </span>
                        <span className="mx-2">•</span>
                        <span>
                          {getDurationInMinutes(event.start, event.end)} minutos
                        </span>
                      </div>
                      
                      {event.description && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    
                    {event.subjectName && (
                      <div className="mt-2 sm:mt-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {event.subjectName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
