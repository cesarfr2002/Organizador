import React from 'react';
import { format } from 'date-fns';

export default function TaskProgressChart({ task }) {
  if (!task || !task.studySessions || task.studySessions.length === 0) {
    return null;
  }

  // Organizar las sesiones por fecha
  const sessionsByDate = {};
  task.studySessions.forEach(session => {
    const date = format(new Date(session.date), 'yyyy-MM-dd');
    if (!sessionsByDate[date]) {
      sessionsByDate[date] = 0;
    }
    sessionsByDate[date] += session.minutes;
  });

  // Obtener las últimas 7 fechas con sesiones para mostrar en el gráfico
  const dates = Object.keys(sessionsByDate).sort().slice(-7);
  const maxMinutes = Math.max(...dates.map(date => sessionsByDate[date]));

  return (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Tiempo de estudio (últimos 7 días)</h4>
      <div className="flex items-end h-32 space-x-2">
        {dates.map(date => {
          const minutes = sessionsByDate[date];
          const height = Math.max((minutes / maxMinutes) * 100, 10); // Al menos 10% de altura para visibilidad
          const displayDate = format(new Date(date), 'dd/MM');
          
          return (
            <div key={date} className="flex flex-col items-center flex-1">
              <div className="w-full flex justify-center">
                <div 
                  className="bg-blue-500 rounded-t w-4/5" 
                  style={{ height: `${height}%` }}
                  title={`${minutes} minutos`}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 w-full text-center">
                {displayDate}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Leyenda */}
      <div className="mt-2 text-right">
        <span className="text-xs text-gray-500">
          Tiempo total: {task.studyTime} minutos
        </span>
      </div>
    </div>
  );
}
