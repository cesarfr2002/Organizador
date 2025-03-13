import { useState, useEffect } from 'react';

export default function StudyTimer() {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro', 'shortBreak', 'longBreak'
  const [seconds, setSeconds] = useState(0);
  const [cycles, setCycles] = useState(0);
  
  // Configuración de tiempo en segundos
  const modeSettings = {
    pomodoro: 25 * 60, // 25 minutos
    shortBreak: 5 * 60, // 5 minutos
    longBreak: 15 * 60, // 15 minutos
  };

  useEffect(() => {
    let interval = null;
    
    if (isActive && !isPaused) {
      interval = setInterval(() => {
        if (seconds === 0) {
          clearInterval(interval);
          handleTimerComplete();
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isActive, isPaused, seconds]);
  
  // Cuando el temporizador llega a cero
  const handleTimerComplete = () => {
    // Reproducir sonido
    const audio = new Audio('/sounds/timer-complete.mp3');
    audio.play().catch(e => console.log('Error playing sound', e));
    
    // Mostrar notificación si está permitido
    if (Notification.permission === 'granted') {
      new Notification('UniOrganizer', { 
        body: mode === 'pomodoro' 
          ? '¡Tiempo de estudio completado! Toma un descanso.' 
          : '¡Descanso terminado! Vuelve al estudio.'
      });
    }
    
    // Cambiar automáticamente al siguiente modo
    if (mode === 'pomodoro') {
      const newCycles = cycles + 1;
      setCycles(newCycles);
      
      // Cada 4 pomodoros, tomar un descanso largo
      if (newCycles % 4 === 0) {
        switchMode('longBreak');
      } else {
        switchMode('shortBreak');
      }
    } else {
      switchMode('pomodoro');
    }
  };
  
  // Cambiar entre modos (pomodoro, descanso corto, descanso largo)
  const switchMode = (newMode) => {
    setMode(newMode);
    setSeconds(modeSettings[newMode]);
    setIsActive(false);
    setIsPaused(false);
  };
  
  // Iniciar el temporizador
  const startTimer = () => {
    if (seconds === 0) {
      setSeconds(modeSettings[mode]);
    }
    setIsActive(true);
    setIsPaused(false);
  };
  
  // Pausar el temporizador
  const pauseTimer = () => {
    setIsPaused(true);
  };
  
  // Reanudar el temporizador
  const resumeTimer = () => {
    setIsPaused(false);
  };
  
  // Reiniciar el temporizador
  const resetTimer = () => {
    setIsActive(false);
    setIsPaused(false);
    setSeconds(modeSettings[mode]);
  };
  
  // Formatear segundos a MM:SS
  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const returnedSeconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${returnedSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calcular porcentaje de progreso para la animación circular
  const calculateProgress = () => {
    const total = modeSettings[mode];
    const remaining = seconds;
    return ((total - remaining) / total) * 100;
  };
  
  // Solicitar permiso para notificaciones al montar el componente
  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    // Inicializar el timer con el modo seleccionado
    setSeconds(modeSettings[mode]);
  }, []);

  return (
    <div className="flex flex-col items-center dark:bg-gray-800 dark:text-white">
      {/* Selector de modo */}
      <div className="flex space-x-2 mb-4">
        <button 
          onClick={() => switchMode('pomodoro')}
          className={`px-3 py-1 text-sm rounded-full ${
            mode === 'pomodoro' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Pomodoro
        </button>
        <button 
          onClick={() => switchMode('shortBreak')}
          className={`px-3 py-1 text-sm rounded-full ${
            mode === 'shortBreak' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Descanso corto
        </button>
        <button 
          onClick={() => switchMode('longBreak')}
          className={`px-3 py-1 text-sm rounded-full ${
            mode === 'longBreak' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Descanso largo
        </button>
      </div>
      
      {/* Temporizador circular */}
      <div className="relative w-48 h-48">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Círculo de fondo */}
          <circle
            className="stroke-current text-gray-200 dark:text-gray-700"
            cx="50"
            cy="50"
            r="45"
            strokeWidth="8"
            fill="none"
          />
          
          {/* Círculo de progreso */}
          <circle
            className={`stroke-current ${
              mode === 'pomodoro' 
                ? 'text-red-500' 
                : mode === 'shortBreak' 
                  ? 'text-green-500' 
                  : 'text-blue-500'
            }`}
            cx="50"
            cy="50"
            r="45"
            strokeWidth="8"
            fill="none"
            strokeDasharray="283"
            strokeDashoffset={283 - (calculateProgress() / 100 * 283)}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold">
            {formatTime(seconds)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {mode === 'pomodoro' 
              ? 'Tiempo de estudio' 
              : mode === 'shortBreak' 
                ? 'Descanso corto' 
                : 'Descanso largo'
            }
          </div>
        </div>
      </div>
      
      {/* Botones de control */}
      <div className="flex space-x-4 mt-6">
        {!isActive ? (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded dark:bg-blue-600 dark:hover:bg-blue-700"
            onClick={startTimer}
          >
            Iniciar
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded dark:bg-green-600 dark:hover:bg-green-700"
                onClick={resumeTimer}
              >
                Reanudar
              </button>
            ) : (
              <button
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded dark:bg-yellow-600 dark:hover:bg-yellow-700"
                onClick={pauseTimer}
              >
                Pausar
              </button>
            )}
            <button
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded dark:bg-gray-600 dark:hover:bg-gray-700"
              onClick={resetTimer}
            >
              Reiniciar
            </button>
          </>
        )}
      </div>
      
      {/* Contador de ciclos */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Ciclos completados: {cycles}
      </div>
    </div>
  );
}
