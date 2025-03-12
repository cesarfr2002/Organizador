import { useState, useEffect } from 'react';
import { format, parseISO, isWithinInterval, addMinutes } from 'date-fns';

export default function DailySchedule({ schedule = [] }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nextClass, setNextClass] = useState(null);
  const [processedSchedule, setProcessedSchedule] = useState([]);
  
  // Actualizar la hora actual cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Procesar el horario para categorizar las clases y eliminar duplicados
  useEffect(() => {
    if (schedule.length > 0) {
      const now = new Date();
      
      // Eliminar duplicados primero (basado en nombre y hora de inicio)
      const uniqueClasses = schedule.filter((item, index, self) => 
        index === self.findIndex(
          t => t.name === item.name && t.startTime === item.startTime
        )
      );
      
      // Ordenar el horario por hora de inicio
      const sortedSchedule = [...uniqueClasses].sort((a, b) => {
        const timeA = parseTimeString(a.startTime);
        const timeB = parseTimeString(b.startTime);
        return timeA - timeB;
      });
      
      // Agregar el estado de cada clase (pasada, actual, futura)
      const processedClasses = sortedSchedule.map(item => {
        const startTime = parseTimeString(item.startTime);
        const endTime = parseTimeString(item.endTime);
        
        let status = 'upcoming'; // Por defecto es futura
        
        if (now > endTime) {
          status = 'past'; // Ya pasó
        } else if (isWithinInterval(now, { start: startTime, end: endTime })) {
          status = 'current'; // Está ocurriendo ahora
        }
        
        return {
          ...item,
          status
        };
      });
      
      setProcessedSchedule(processedClasses);
      
      // Encontrar la próxima clase o clase actual para destacar
      const next = processedClasses.find(item => 
        item.status === 'current' || 
        (item.status === 'upcoming' && processedClasses.filter(cls => cls.status === 'current').length === 0)
      );
      
      setNextClass(next);
    } else {
      setProcessedSchedule([]);
      setNextClass(null);
    }
  }, [schedule, currentTime]);
  
  // Convertir una cadena de tiempo (HH:MM) a un objeto Date
  const parseTimeString = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // Formatear la ubicación de la clase
  const formatLocation = (location) => {
    if (!location) return "Sin ubicación especificada";
    
    if (typeof location === 'string') return location;
    
    const parts = [];
    if (location.campus) parts.push(location.campus);
    if (location.building) parts.push(`Edificio ${location.building}`);
    if (location.floor) parts.push(`Piso ${location.floor}`);
    if (location.room) parts.push(`Sala ${location.room}`);
    
    const mainLocation = parts.join(', ');
    
    if (location.additionalInfo) {
      return (
        <>
          <span className="font-medium">{mainLocation}</span>
          <span className="block text-xs italic mt-0.5">{location.additionalInfo}</span>
        </>
      );
    }
    
    return mainLocation;
  };
  
  // Calcular el tiempo restante antes de la próxima clase
  const getTimeUntilNextClass = () => {
    if (!nextClass) return null;
    
    const now = new Date();
    const startTime = parseTimeString(nextClass.startTime);
    
    // Si la clase ya ha comenzado, devolver null
    if (now >= startTime) return null;
    
    const diffMs = startTime - now;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `en ${diffMins} min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `en ${hours}h ${mins > 0 ? `${mins}min` : ''}`;
    }
  };
  
  // Verificar si es necesario dirigirse a otra sede/edificio
  const needsTravel = (current, next) => {
    if (!current || !next) return false;
    if (!current.location || !next.location) return false;
    
    // Si es un string, comparar directamente
    if (typeof current.location === 'string' || typeof next.location === 'string') {
      return current.location !== next.location;
    }
    
    // Comparar campus y edificio
    return (
      current.location.campus !== next.location.campus ||
      current.location.building !== next.location.building
    );
  };
  
  // Si no hay horario para mostrar
  if (schedule.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <p>No hay clases programadas para hoy</p>
      </div>
    );
  }

  // Encontrar la clase anterior a la próxima (para detectar si hay que cambiar de edificio)
  const getCurrentOrPreviousClass = () => {
    if (!nextClass) return null;
    
    const now = new Date();
    const sortedSchedule = [...schedule].sort((a, b) => {
      const timeA = parseTimeString(a.startTime);
      const timeB = parseTimeString(b.startTime);
      return timeA - timeB;
    });
    
    const nextIndex = sortedSchedule.findIndex(item => item === nextClass);
    if (nextIndex <= 0) return null;
    
    return sortedSchedule[nextIndex - 1];
  };
  
  const previousClass = getCurrentOrPreviousClass();
  const timeUntilNext = getTimeUntilNextClass();
  const requiresTravel = needsTravel(previousClass, nextClass);

  // Agrupar clases que ocurren dentro del mismo bloque de 2 horas
  const groupScheduleByTimeBlock = () => {
    const blocks = {};
    
    processedSchedule.forEach(item => {
      const startHour = parseInt(item.startTime.split(':')[0]);
      // Determinar en qué bloque de 2 horas cae esta clase (6-8, 8-10, etc.)
      // Si la hora es par, es el inicio del bloque; si es impar, tomamos la hora anterior
      const blockStart = startHour % 2 === 0 ? startHour : startHour - 1;
      const blockKey = `${blockStart}:00-${blockStart + 2}:00`;
      
      if (!blocks[blockKey]) {
        blocks[blockKey] = [];
      }
      
      blocks[blockKey].push(item);
    });
    
    // Convertir el objeto a un arreglo ordenado por hora
    return Object.entries(blocks)
      .map(([timeBlock, classes]) => ({
        timeBlock,
        classes,
        // Calcular el estado del bloque (pasado, actual, futuro)
        status: calculateBlockStatus(timeBlock)
      }))
      .sort((a, b) => {
        const hourA = parseInt(a.timeBlock.split(':')[0]);
        const hourB = parseInt(b.timeBlock.split(':')[0]);
        return hourA - hourB;
      });
  };
  
  // Determinar si un bloque de tiempo ya pasó, es actual o es futuro
  const calculateBlockStatus = (timeBlock) => {
    const now = new Date();
    const [start, end] = timeBlock.split('-');
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    
    const blockStart = new Date();
    blockStart.setHours(startHour, 0, 0, 0);
    
    const blockEnd = new Date();
    blockEnd.setHours(endHour, 0, 0, 0);
    
    if (now < blockStart) {
      return 'upcoming';
    } else if (now > blockEnd) {
      return 'past';
    } else {
      return 'current';
    }
  };

  const groupedSchedule = groupScheduleByTimeBlock();

  return (
    <div>
      {/* Próxima clase o clase actual */}
      {nextClass && (
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-1 flex justify-between items-center">
            <div>
              {nextClass.status === 'current' ? 'Clase actual' : 'Próxima clase'} 
              {timeUntilNext && <span className="ml-1 text-blue-600">{timeUntilNext}</span>}
            </div>
            {requiresTravel && (
              <div className="text-amber-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-xs">Cambio de ubicación</span>
              </div>
            )}
          </div>
          <div 
            className="rounded-md p-3 border-l-4"
            style={{ 
              borderColor: nextClass.color || '#3182ce',
              backgroundColor: nextClass.color ? `${nextClass.color}10` : '#ebf8ff'
            }}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{nextClass.name}</h3>
                {nextClass.professor && (
                  <p className="text-xs text-gray-600 mt-1">Prof. {nextClass.professor}</p>
                )}
              </div>
              <span className="text-sm bg-white px-2 py-1 rounded">
                {nextClass.startTime} - {nextClass.endTime}
              </span>
            </div>
            {nextClass.location && (
              <div className="mt-2 text-sm text-gray-600 flex items-start">
                <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <div>
                  {formatLocation(nextClass.location)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resto del horario del día */}
      <div className="space-y-2">
        {processedSchedule.map((item, index) => {
          if (item === nextClass) return null; // No repetir la próxima clase
          
          const isActive = isWithinInterval(currentTime, { 
            start: parseTimeString(item.startTime), 
            end: parseTimeString(item.endTime) 
          });
          
          const isPast = currentTime > parseTimeString(item.endTime);
          
          return (
            <div 
              key={index}
              className={`p-2 rounded-md border flex items-start ${
                isActive ? 'border-blue-500 bg-blue-50' : 
                isPast ? 'border-gray-200 bg-gray-50 opacity-60' : 
                'border-gray-200'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full mr-2 mt-1"
                style={{ backgroundColor: item.color || '#CBD5E0' }}
              ></div>
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${isPast ? 'text-gray-500' : 'text-gray-800'}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.startTime} - {item.endTime}
                  </span>
                </div>
                {item.location && (
                  <div className="text-xs text-gray-500 mt-0.5 flex">
                    <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    </svg>
                    <div>{formatLocation(item.location)}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bloques de horario agrupados con indicación visual de estado */}
      <div className="space-y-2 mt-4">
        {groupedSchedule.map((block, blockIndex) => (
          <div 
            key={blockIndex} 
            className={`rounded-md p-2 ${
              block.status === 'past' 
                ? 'bg-gray-100 opacity-60' 
                : block.status === 'current' 
                  ? 'bg-blue-50 border border-blue-100' 
                  : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium text-gray-500">{block.timeBlock}</div>
              {block.status === 'current' && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Ahora
                </span>
              )}
              {block.status === 'past' && (
                <span className="text-xs text-gray-500">
                  Finalizado
                </span>
              )}
            </div>
            
            <div className="space-y-1">
              {block.classes.map((item, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded-md border flex items-start ${
                    item.status === 'past' 
                      ? 'bg-white opacity-60' 
                      : item.status === 'current' 
                        ? 'bg-white border-blue-200' 
                        : 'bg-white'
                  }`}
                  style={{ 
                    borderLeftWidth: '4px',
                    borderLeftColor: item.color || '#CBD5E0',
                  }}
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          item.status === 'past' ? 'text-gray-500' : 'text-gray-800'
                        }`}>
                          {item.name}
                        </span>
                        {item.status === 'current' && (
                          <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {item.startTime} - {item.endTime}
                      </span>
                    </div>
                    {item.location && (
                      <div className="text-xs text-gray-500 mt-0.5 flex">
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        </svg>
                        <div>{formatLocation(item.location)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {groupedSchedule.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No hay más clases programadas para hoy
          </div>
        )}
      </div>

      {/* Leyenda del estado */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center space-x-4 text-xs text-gray-500">
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          Clase actual
        </div>
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
          Clase pasada
        </div>
        <div className="flex items-center">
          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
          Por comenzar
        </div>
      </div>
    </div>
  );
}
