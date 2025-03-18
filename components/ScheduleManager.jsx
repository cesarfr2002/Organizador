import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
// Modificado para usar bloques de 2 horas comenzando a las 6 (6-8, 8-10, etc.)
const HOURS = Array.from({ length: 8 }, (_, i) => 6 + i * 2); 

export default function ScheduleManager({ subjects }) {
  const [schedule, setSchedule] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // 'week', 'list'
  const [campusFilter, setCampusFilter] = useState('all');
  const [availableCampuses, setAvailableCampuses] = useState([]);
  
  useEffect(() => {
    if (subjects && subjects.length > 0) {
      // Extraer todos los campus disponibles para el filtro
      const campuses = new Set();
      subjects.forEach(subject => {
        subject.schedule.forEach(slot => {
          if (slot.location && slot.location.campus) {
            campuses.add(slot.location.campus);
          }
        });
      });
      setAvailableCampuses(Array.from(campuses));
      
      // Organizar las materias por día y hora para mostrarlas en el horario
      const scheduleMap = {};
      
      subjects.forEach(subject => {
        subject.schedule.forEach(slot => {
          // Si hay un filtro de campus activo, aplicarlo
          if (campusFilter !== 'all' && 
              (!slot.location || !slot.location.campus || slot.location.campus !== campusFilter)) {
            return;
          }
          
          const day = slot.day;
          // Normalizar el formato de hora (quitar ceros a la izquierda)
          const normalizedStartTime = normalizeTimeFormat(slot.startTime);
          const key = `${day}-${normalizedStartTime}`;
          
          if (!scheduleMap[key]) {
            scheduleMap[key] = [];
          }
          
          scheduleMap[key].push({
            subjectId: subject._id,
            name: subject.name,
            professor: subject.professor,
            location: slot.location,
            startTime: slot.startTime,
            endTime: slot.endTime,
            color: subject.color
          });
        });
      });
      
      setSchedule(scheduleMap);
    }
  }, [subjects, campusFilter]);

  // Función para normalizar el formato de hora (08:00 → 8:00)
  const normalizeTimeFormat = (timeString) => {
    if (!timeString) return '';
    const parts = timeString.split(':');
    if (parts.length !== 2) return timeString;
    
    const hours = parseInt(parts[0], 10);
    return `${hours}:${parts[1]}`;
  };

  const formatLocation = (location) => {
    if (!location) return "Sin ubicación";
    
    if (typeof location === 'string') return location;
    
    const parts = [];
    if (location.campus) parts.push(location.campus);
    if (location.building) parts.push(`Edificio ${location.building}`);
    if (location.floor) parts.push(`Piso ${location.floor}`);
    if (location.room) parts.push(`Sala ${location.room}`);
    
    return parts.join(', ');
  };

  const handleClassClick = (classInfo) => {
    setSelectedClass(classInfo === selectedClass ? null : classInfo);
  };

  const renderWeekView = () => (
    <div className="border dark:border-gray-700 rounded-lg shadow overflow-x-auto">
      <table className="w-full min-w-max">
        <thead>
          <tr>
            <th className="border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">Hora</th>
            {DAYS.map(day => (
              <th key={day} className="border p-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(hour => (
            <tr key={hour} className="dark:bg-gray-900">
              <td className="border p-2 text-center dark:border-gray-700 dark:text-gray-300">
                {`${hour}:00 - ${hour + 2}:00`}
              </td>
              {DAYS.map((_, dayIndex) => {
                // Modificado para soportar bloques de 2 horas
                const hourStr = `${hour}:00`;
                const nextHourStr = `${hour + 1}:00`;
                
                // Usar versiones normalizadas de horas para las claves
                const dayKey1 = `${dayIndex + 1}-${hourStr}`;
                const dayKey2 = `${dayIndex + 1}-${nextHourStr}`;
                
                // También buscar versiones con ceros a la izquierda
                const paddedHourStr = `${'0'.repeat(hour < 10 ? 1 : 0)}${hour}:00`;
                const paddedNextHourStr = `${'0'.repeat(hour + 1 < 10 ? 1 : 0)}${hour + 1}:00`;
                
                const paddedDayKey1 = `${dayIndex + 1}-${paddedHourStr}`;
                const paddedDayKey2 = `${dayIndex + 1}-${paddedNextHourStr}`;
                
                // Combinar resultados de ambas búsquedas
                const classes = [
                  ...(schedule[dayKey1] || []), 
                  ...(schedule[dayKey2] || []),
                  ...(schedule[paddedDayKey1] || []), 
                  ...(schedule[paddedDayKey2] || [])
                ];
                
                // Eliminar duplicados basados en el nombre de la clase y el tiempo
                const uniqueClasses = classes.filter((cls, index, self) => 
                  index === self.findIndex(c => c.name === cls.name && c.startTime === cls.startTime)
                );
                
                return (
                  <td key={dayIndex} className="border p-0 h-24 relative dark:border-gray-700">
                    {uniqueClasses.map((cls, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleClassClick(cls)}
                        className="absolute inset-0 m-1 p-2 rounded overflow-hidden text-xs cursor-pointer hover:shadow-md transition-shadow dark:text-gray-200"
                        style={{ 
                          backgroundColor: `${cls.color}${darkMode ? '60' : '40'}`, 
                          borderLeft: `4px solid ${cls.color}` 
                        }}
                      >
                        <div className="font-bold">{cls.name}</div>
                        {cls.location && (
                          <div className="text-xs truncate flex items-center">
                            <svg className="w-3 h-3 mr-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            </svg>
                            {formatLocation(cls.location).split(',')[0]}
                          </div>
                        )}
                        <div>
                          {cls.startTime} - {cls.endTime}
                        </div>
                      </div>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderListView = () => {
    const classesByDay = {};
    
    // Agrupar clases por día
    DAYS.forEach((day, index) => {
      const dayNumber = index + 1;
      classesByDay[dayNumber] = [];
      
      for (const key in schedule) {
        if (key.startsWith(`${dayNumber}-`)) {
          schedule[key].forEach(cls => {
            classesByDay[dayNumber].push(cls);
          });
        }
      }
      
      // Ordenar por hora
      classesByDay[dayNumber].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
    });
    
    return (
      <div className="space-y-6">
        {DAYS.map((day, index) => {
          const dayNumber = index + 1;
          const classes = classesByDay[dayNumber];
          
          return (
            <div key={day} className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="font-medium text-lg p-3 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-700">{day}</h3>
              {classes.length > 0 ? (
                <div className="divide-y dark:divide-gray-700">
                  {classes.map((cls, idx) => (
                    <div 
                      key={idx} 
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleClassClick(cls)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium flex items-center">
                            <span
                              className="w-3 h-3 rounded-full mr-2"
                              style={{ backgroundColor: cls.color }}
                            ></span>
                            {cls.name}
                          </div>
                          {cls.professor && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Prof. {cls.professor}</div>
                          )}
                        </div>
                        <div className="text-sm dark:text-gray-300">{cls.startTime} - {cls.endTime}</div>
                      </div>
                      {cls.location && (
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 flex items-center">
                          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                          </svg>
                          {formatLocation(cls.location)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No hay clases programadas para este día
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold dark:text-gray-200">Mi Horario</h2>
        
        <div className="flex space-x-3">
          {/* Filtro de campus */}
          {availableCampuses.length > 1 && (
            <select 
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 rounded px-3 py-1 text-sm bg-white dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="all">Todos los campus</option>
              {availableCampuses.map(campus => (
                <option key={campus} value={campus}>{campus}</option>
              ))}
            </select>
          )}
          
          {/* Selector de vista */}
          <div className="flex border rounded overflow-hidden dark:border-gray-700">
            <button 
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm ${viewMode === 'week' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-200'}`}
            >
              Semana
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 dark:text-gray-200'}`}
            >
              Lista
            </button>
          </div>
        </div>
      </div>
      
      {/* Detalles de clase seleccionada */}
      {selectedClass && (
        <div className="mb-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow border-l-4" style={{ borderLeftColor: selectedClass.color }}>
          <div className="flex justify-between">
            <h3 className="text-xl font-medium dark:text-gray-200">{selectedClass.name}</h3>
            <button 
              onClick={() => setSelectedClass(null)} 
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-2 space-y-2">
            {selectedClass.professor && (
              <div className="flex">
                <span className="font-medium w-24 dark:text-gray-200">Profesor:</span>
                <span className="dark:text-gray-300">{selectedClass.professor}</span>
              </div>
            )}
            
            <div className="flex">
              <span className="font-medium w-24 dark:text-gray-200">Horario:</span>
              <span className="dark:text-gray-300">{DAYS[parseInt(selectedClass.startTime.split('-')[0]) - 1]}, {selectedClass.startTime} - {selectedClass.endTime}</span>
            </div>
            
            {selectedClass.location && (
              <div className="flex items-start">
                <span className="font-medium w-24 dark:text-gray-200">Ubicación:</span>
                <div className="dark:text-gray-300">
                  {typeof selectedClass.location === 'string' ? (
                    <span>{selectedClass.location}</span>
                  ) : (
                    <div>
                      {selectedClass.location.campus && <div>Campus: {selectedClass.location.campus}</div>}
                      {selectedClass.location.building && <div>Edificio: {selectedClass.location.building}</div>}
                      {selectedClass.location.floor && <div>Piso: {selectedClass.location.floor}</div>}
                      {selectedClass.location.room && <div>Sala: {selectedClass.location.room}</div>}
                      {selectedClass.location.additionalInfo && (
                        <div className="mt-1 text-sm italic">{selectedClass.location.additionalInfo}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end">
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatLocation(selectedClass.location))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-600"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Ver en mapa
            </a>
          </div>
        </div>
      )}

      {/* Visualización del horario */}
      {viewMode === 'week' ? renderWeekView() : renderListView()}
    </div>
  );
}
