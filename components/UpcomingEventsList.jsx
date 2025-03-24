import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function UpcomingEventsList({ events = [], isLoading = false, emptyMessage = "No hay eventos próximos" }) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-gray-200 dark:bg-gray-700 h-16 rounded"></div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div 
          key={event._id} 
          className="flex items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md p-2 text-center w-14">
            <div className="text-xs uppercase font-semibold">
              {event.startTime ? format(new Date(event.startTime), 'MMM', { locale: es }) : '---'}
            </div>
            <div className="text-xl font-bold">
              {event.startTime ? format(new Date(event.startTime), 'dd', { locale: es }) : '--'}
            </div>
          </div>
          
          <div className="ml-4 flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {event.title}
            </h4>
            
            <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
              <svg className="mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {event.startTime && (
                <span>
                  {format(new Date(event.startTime), 'HH:mm', { locale: es })}
                  {event.endTime && ` - ${format(new Date(event.endTime), 'HH:mm', { locale: es })}`}
                </span>
              )}
            </div>
            
            {event.location && (
              <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                <svg className="mr-1 h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
              </div>
            )}
          </div>
          
          {event.type && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              event.type === 'clase' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              event.type === 'examen' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              event.type === 'reunión' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {event.type}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
