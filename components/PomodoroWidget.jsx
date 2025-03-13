import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutos en segundos
  const [isActive, setIsActive] = useState(false);
  const [isWorkTime, setIsWorkTime] = useState(true);
  const timerRef = useRef(null);
  
  useEffect(() => {
    return () => {
      // Limpiar el intervalo cuando se desmonte el componente
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current);
            // Al finalizar el tiempo, cambiar entre trabajo y descanso
            setIsWorkTime(!isWorkTime);
            // Establecer el nuevo tiempo según el modo
            return isWorkTime ? 5 * 60 : 25 * 60; // Cambiar entre 5 y 25 min
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isWorkTime]);
  
  const toggleTimer = () => {
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isWorkTime ? 25 * 60 : 5 * 60);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium dark:text-white">Pomodoro Rápido</h2>
        <Link href="/pomodoro" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
          Versión completa
        </Link>
      </div>
      
      <div className="text-center">
        <div className={`inline-block rounded-full border-4 p-3 mb-3 ${
          isWorkTime ? 'border-red-500' : 'border-green-500'
        }`}>
          <span className="text-2xl font-mono font-bold dark:text-white">
            {formatTime(timeLeft)}
          </span>
        </div>
        
        <div className="text-sm mb-3 dark:text-gray-300">
          {isWorkTime ? '🧠 Tiempo de concentración' : '☕ Tiempo de descanso'}
        </div>
        
        <div className="flex justify-center space-x-2">
          <button 
            onClick={toggleTimer}
            className={`px-4 py-1 rounded-md ${
              isActive 
                ? 'bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            }`}
          >
            {isActive ? 'Pausa' : 'Iniciar'}
          </button>
          <button 
            onClick={resetTimer}
            className="px-4 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Reiniciar
          </button>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          La técnica Pomodoro: 25 minutos de trabajo, 5 minutos de descanso
        </p>
      </div>
    </div>
  );
}
