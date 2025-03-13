import React, { useState, useEffect } from 'react';
import { format, formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';

export default function StudyTimeDisplay({ task }) {
  const [studyTime, setStudyTime] = useState(0);
  const [lastStudySession, setLastStudySession] = useState(null);

  useEffect(() => {
    if (task && task.studyTime) {
      setStudyTime(task.studyTime.total || 0);
      
      if (task.studyTime.sessions && task.studyTime.sessions.length > 0) {
        const lastSession = task.studyTime.sessions[task.studyTime.sessions.length - 1];
        setLastStudySession(lastSession);
      }
    }
  }, [task]);

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`;
    }
  };

  const formatSessionDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // Formatear la fecha relativa (ej: "hace 3 días")
      return formatDistanceStrict(date, new Date(), {
        addSuffix: true,
        locale: es
      });
    } catch (err) {
      return 'Fecha desconocida';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-medium mb-4 dark:text-white">Tiempo de estudio</h3>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-300">Tiempo total</span>
          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatTime(studyTime)}</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${Math.min(100, (studyTime / (task?.estimatedTime || 60)) * 100)}%` }}
          ></div>
        </div>
        
        {task?.estimatedTime ? (
          <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
            {formatTime(studyTime)} de {formatTime(task.estimatedTime)} estimados
          </div>
        ) : null}
      </div>

      {lastStudySession && (
        <div className="text-sm border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <div className="text-gray-600 dark:text-gray-300 mb-1">Última sesión:</div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">{formatSessionDate(lastStudySession.date)}</span>
            <span className="font-medium text-gray-700 dark:text-gray-200">{formatTime(lastStudySession.duration)}</span>
          </div>
        </div>
      )}

      <a 
        href={`/tasks/${task?._id}/study`} 
        className="mt-4 block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md dark:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
      >
        Iniciar sesión de estudio
      </a>
    </div>
  );
}
