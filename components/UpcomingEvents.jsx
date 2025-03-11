import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export default function UpcomingEvents({ events = [] }) {
  // Función para formatear la fecha
  const formatEventTime = (date, startTime) => {
    if (!date) return startTime || 'Hora no especificada';
    
    // Convertir la cadena de fecha ISO a objeto Date
    const eventDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Determinar si es hoy, mañana o mostrar la fecha completa
    if (eventDate.toDateString() === today.toDateString()) {
      return `Hoy, ${startTime || 'horario no especificado'}`;
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      return `Mañana, ${startTime || 'horario no especificado'}`;
    } else {
      return `${format(eventDate, 'EEEE, d MMM', { locale: es })}, ${startTime || 'horario no especificado'}`;
    }
  };
  
  // Función para obtener el nombre del día de la semana
  const getDayName = (dayNumber) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayNumber];
  };

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 mb-4">No hay clases o eventos próximos</p>
        <Link href="/schedule" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Ver horario completo
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {events.map((event, index) => (
          <li key={index} className="p-4 hover:bg-gray-50">
            <div className="flex space-x-3">
              <div 
                className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: event.color + '30', color: event.color }}
              >
                <span className="font-bold">{
                  // Si tiene día específico, mostrar inicial del día, sino el número de evento
                  event.day !== undefined ? getDayName(event.day)[0] : index + 1
                }</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {event.name || event.title}
                </p>
                
                <p className="text-sm text-gray-500">
                  {event.startTime && event.endTime ? (
                    `${event.startTime} - ${event.endTime}`
                  ) : (
                    formatEventTime(event.date, event.time)
                  )}
                </p>
                
                {event.location && (
                  <p className="text-xs text-gray-500 mt-1">
                    <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </p>
                )}

                {event.professor && (
                  <p className="text-xs text-gray-500">
                    <svg className="inline-block w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {event.professor}
                  </p>
                )}
              </div>
              
              {event.type === 'exam' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Examen
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
      
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-right">
        <Link href="/schedule" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          Ver horario completo
          <span aria-hidden="true"> &rarr;</span>
        </Link>
      </div>
    </div>
  );
}
