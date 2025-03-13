import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_SHORT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;
const DEFAULT_POMODOROS_UNTIL_LONG_BREAK = 4;

export default function PomodoroTimer({ onSessionComplete, selectedTask, tasks, subjects }) {
  const [mode, setMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK_MINUTES * 60);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentTask, setCurrentTask] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    workTime: DEFAULT_WORK_MINUTES,
    shortBreakTime: DEFAULT_SHORT_BREAK_MINUTES,
    longBreakTime: DEFAULT_LONG_BREAK_MINUTES,
    pomodorosUntilLongBreak: DEFAULT_POMODOROS_UNTIL_LONG_BREAK,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    notifications: true
  });
  
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  // Cargar configuración del localStorage si existe
  useEffect(() => {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    // Cargar audio para notificación
    audioRef.current = new Audio('/sounds/bell.mp3');
    
    // Limpiar el intervalo cuando se desmonte el componente
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Set up selected task and subject when they change
  useEffect(() => {
    if (selectedTask) {
      setCurrentTask(selectedTask._id);
      if (selectedTask.subject) {
        setCurrentSubject(typeof selectedTask.subject === 'object' ? 
          selectedTask.subject._id : selectedTask.subject);
      }
      
      // We don't modify the timer duration based on the task's time anymore
      // The timer will use the standard settings
    }
  }, [selectedTask]);

  // Calculate remaining time for a task based on estimated time and completed time
  const calculateRemainingTime = (task) => {
    if (!task || !task.estimatedTime) return 0;
    
    const estimatedMinutes = task.estimatedTime;
    const completedMinutes = task.studiedTime || 0;
    
    // If the task is completed or we've studied more than estimated, return 0
    if (task.completed || completedMinutes >= estimatedMinutes) {
      return 0;
    }
    
    return Math.max(0, estimatedMinutes - completedMinutes);
  };

  // Calculate how many Pomodoro cycles would be needed to complete the task
  const calculatePomodorosNeeded = (task) => {
    if (!task || !task.estimatedTime) return 0;
    
    const remainingMinutes = calculateRemainingTime(task);
    if (remainingMinutes <= 0) return 0;
    
    // Calculate how many complete pomodoro cycles would be needed
    return Math.ceil(remainingMinutes / settings.workTime);
  };

  // Cargar el temporizador con la configuración correcta cuando cambia el modo
  useEffect(() => {
    switch (mode) {
      case 'work':
        setTimeLeft(settings.workTime * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreakTime * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakTime * 60);
        break;
      default:
        setTimeLeft(settings.workTime * 60);
    }
  }, [mode, settings]);

  // Manejar el temporizador
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Limpiar el intervalo cuando se desmonte el componente
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  const handleTimerComplete = () => {
    // Reproducir sonido de notificación
    if (settings.notifications && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Error playing notification sound:', e));
    }
    
    // Mostrar notificación de escritorio
    if (settings.notifications && 'Notification' in window && Notification.permission === 'granted') {
      const title = mode === 'work' 
        ? '¡Tiempo de descanso!' 
        : '¡Tiempo de volver a trabajar!';
      
      const body = mode === 'work'
        ? `Has completado ${completedPomodoros + 1} pomodoros. ¡Toma un descanso!`
        : 'Tu descanso ha terminado. ¡Hora de volver a concentrarse!';
      
      new Notification(title, { body });
    }
    
    // Actualizar estado según el modo
    if (mode === 'work') {
      // Incrementar contador de pomodoros completados
      const newCompletedPomodoros = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedPomodoros);
      
      // Si hemos llegado a cierto número de pomodoros, tomar descanso largo
      if (newCompletedPomodoros % settings.pomodorosUntilLongBreak === 0) {
        setMode('longBreak');
        toast.success('¡Pomodoro completado! Tiempo de descanso largo.');
      } else {
        setMode('shortBreak');
        toast.success('¡Pomodoro completado! Tiempo de descanso corto.');
      }
      
      // Registrar la sesión completada
      if (onSessionComplete) {
        onSessionComplete({
          duration: settings.workTime,
          subject: currentSubject,
          task: currentTask,
          date: new Date()
        });
      }
      
      // Auto-iniciar el descanso si está configurado
      if (settings.autoStartBreaks) {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    } else {
      // Después de un descanso, volver a modo de trabajo
      setMode('work');
      toast.info('¡El descanso ha terminado! Tiempo de volver al trabajo.');
      
      // Auto-iniciar el siguiente pomodoro si está configurado
      if (settings.autoStartPomodoros) {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    }
  };

  const startTimer = () => {
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  const resetTimer = () => {
    setIsActive(false);
    
    // Restablecer tiempo según el modo actual
    switch (mode) {
      case 'work':
        setTimeLeft(settings.workTime * 60);
        break;
      case 'shortBreak':
        setTimeLeft(settings.shortBreakTime * 60);
        break;
      case 'longBreak':
        setTimeLeft(settings.longBreakTime * 60);
        break;
      default:
        setTimeLeft(settings.workTime * 60);
    }
  };

  const skipTimer = () => {
    setIsActive(false);
    handleTimerComplete();
  };

  const changeMode = (newMode) => {
    setMode(newMode);
    setIsActive(false);
  };

  const resetSession = () => {
    setMode('work');
    setIsActive(false);
    setCompletedPomodoros(0);
    setTimeLeft(settings.workTime * 60);
    setCurrentSubject('');
    setCurrentTask('');
  };

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('pomodoroSettings', JSON.stringify(newSettings));
    setShowSettings(false);
    
    // Si el temporizador está activo, terminarlo y aplicar nuevos tiempos
    if (isActive) {
      setIsActive(false);
      // Actualizar tiempo restante según el modo actual
      switch (mode) {
        case 'work':
          setTimeLeft(newSettings.workTime * 60);
          break;
        case 'shortBreak':
          setTimeLeft(newSettings.shortBreakTime * 60);
          break;
        case 'longBreak':
          setTimeLeft(newSettings.longBreakTime * 60);
          break;
      }
    }
  };

  // Solicitar permisos de notificación
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  };

  // Formatear tiempo restante en formato MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {mode === 'work' ? 'Pomodoro' : 
           mode === 'shortBreak' ? 'Descanso Corto' : 
           'Descanso Largo'}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Configuración"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button 
            onClick={requestNotificationPermission}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Activar notificaciones"
            title="Activar notificaciones"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Panel de configuración */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md">
          <h3 className="font-medium mb-3">Configuración</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo de trabajo (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={settings.workTime}
                onChange={(e) => setSettings({...settings, workTime: parseInt(e.target.value) || 1})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descanso corto (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={settings.shortBreakTime}
                onChange={(e) => setSettings({...settings, shortBreakTime: parseInt(e.target.value) || 1})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descanso largo (minutos)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={settings.longBreakTime}
                onChange={(e) => setSettings({...settings, longBreakTime: parseInt(e.target.value) || 1})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pomodoros hasta descanso largo
              </label>
              <input
                type="number"
                min="1"
                max="10"
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={settings.pomodorosUntilLongBreak}
                onChange={(e) => setSettings({...settings, pomodorosUntilLongBreak: parseInt(e.target.value) || 1})}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="autoStartBreaks"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.autoStartBreaks}
                onChange={(e) => setSettings({...settings, autoStartBreaks: e.target.checked})}
              />
              <label htmlFor="autoStartBreaks" className="ml-2 text-sm text-gray-700">
                Iniciar automáticamente los descansos
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="autoStartPomodoros"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.autoStartPomodoros}
                onChange={(e) => setSettings({...settings, autoStartPomodoros: e.target.checked})}
              />
              <label htmlFor="autoStartPomodoros" className="ml-2 text-sm text-gray-700">
                Iniciar automáticamente los pomodoros
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="notifications"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={settings.notifications}
                onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
              />
              <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                Activar notificaciones
              </label>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button 
              onClick={() => setShowSettings(false)} 
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 mr-2"
            >
              Cancelar
            </button>
            <button 
              onClick={() => saveSettings(settings)} 
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Selección de asignatura y tarea */}
      {mode === 'work' && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asignatura
            </label>
            <select
              value={currentSubject}
              onChange={(e) => setCurrentSubject(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
              disabled={isActive}
            >
              <option value="">Selecciona una asignatura</option>
              {subjects && subjects.map(subject => (
                <option key={subject._id} value={subject._id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarea
            </label>
            <select
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm"
              disabled={isActive}
            >
              <option value="">Selecciona una tarea</option>
              {tasks && tasks
                .filter(task => !currentSubject || task.subject === currentSubject || 
                  (typeof task.subject === 'object' && task.subject?._id === currentSubject))
                .map(task => (
                  <option key={task._id} value={task._id}>
                    {task.title} {task.estimatedTime ? `(${task.estimatedTime} min)` : ''}
                  </option>
                ))}
            </select>
          </div>
          {selectedTask && (
            <div className="md:col-span-2">
              <div className="bg-blue-50 p-3 rounded">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Progreso de la tarea:</span> {' '}
                  {selectedTask.studiedTime || 0} de {selectedTask.estimatedTime || 'N/A'} minutos
                  {selectedTask.estimatedTime && (
                    <span className="ml-2">
                      ({Math.round((selectedTask.studiedTime || 0) / selectedTask.estimatedTime * 100)}%)
                    </span>
                  )}
                </p>
                
                {selectedTask.estimatedTime > 0 && (
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-medium">Ciclos Pomodoro estimados:</span>{' '}
                    {calculatePomodorosNeeded(selectedTask)} ciclos de {settings.workTime} minutos
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Temporizador */}
      <div className="text-center">
        <div className={`flex flex-col items-center justify-center mb-6 p-6 rounded-full w-48 h-48 mx-auto border-8 ${
          mode === 'work' ? 'border-red-500' : 
          mode === 'shortBreak' ? 'border-green-500' : 'border-blue-500'
        }`}>
          <div className="text-4xl font-mono font-bold mb-2">
            {formatTimeLeft()}
          </div>
          <div className="text-xs font-medium">
            {completedPomodoros} pomodoros completados
            {selectedTask && selectedTask.estimatedTime > 0 && (
              <span> de {calculatePomodorosNeeded(selectedTask)} estimados</span>
            )}
          </div>
        </div>

        {/* Botones del modo */}
        <div className="flex justify-center space-x-2 mb-6">
          <button
            onClick={() => changeMode('work')}
            className={`px-3 py-1 text-sm rounded-full ${
              mode === 'work'
                ? 'bg-red-100 text-red-800 border-red-300'
                : 'bg-gray-100 text-gray-800 border-gray-300'
            } border`}
          >
            Pomodoro
          </button>
          <button
            onClick={() => changeMode('shortBreak')}
            className={`px-3 py-1 text-sm rounded-full ${
              mode === 'shortBreak'
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-gray-100 text-gray-800 border-gray-300'
            } border`}
          >
            Descanso corto
          </button>
          <button
            onClick={() => changeMode('longBreak')}
            className={`px-3 py-1 text-sm rounded-full ${
              mode === 'longBreak'
                ? 'bg-blue-100 text-blue-800 border-blue-300'
                : 'bg-gray-100 text-gray-800 border-gray-300'
            } border`}
          >
            Descanso largo
          </button>
        </div>

        {/* Controles */}
        <div className="flex justify-center space-x-4">
          {isActive ? (
            <button
              onClick={pauseTimer}
              className="px-5 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
            >
              Pausa
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Iniciar
            </button>
          )}
          <button
            onClick={resetTimer}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Reiniciar
          </button>
          <button
            onClick={skipTimer}
            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            Saltar
          </button>
        </div>

        {completedPomodoros > 0 && (
          <button
            onClick={resetSession}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Reiniciar sesión completa
          </button>
        )}
      </div>
    </div>
  );
}
