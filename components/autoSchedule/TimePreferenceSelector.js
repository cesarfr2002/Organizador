import { useState } from 'react';

export default function TimePreferenceSelector({ preferences, onChange }) {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const timeSlots = [
    { id: 'morning', label: 'Mañana (8:00 - 12:00)' },
    { id: 'afternoon', label: 'Tarde (12:00 - 18:00)' },
    { id: 'evening', label: 'Noche (18:00 - 22:00)' },
  ];

  // Initialize local state with provided preferences
  const [localPrefs, setLocalPrefs] = useState(preferences || {
    days: {
      Lunes: true,
      Martes: true,
      Miércoles: true,
      Jueves: true,
      Viernes: true,
      Sábado: false,
      Domingo: false
    },
    timeSlots: {
      morning: true,
      afternoon: true,
      evening: false
    },
    breakTime: 15, // minutes between study sessions
    maxDuration: 120 // maximum duration for a single study session
  });

  const handleDayToggle = (day) => {
    const updatedDays = {
      ...localPrefs.days,
      [day]: !localPrefs.days[day]
    };
    
    const updatedPrefs = {
      ...localPrefs,
      days: updatedDays
    };
    
    setLocalPrefs(updatedPrefs);
    onChange(updatedPrefs);
  };

  const handleTimeSlotToggle = (timeSlot) => {
    const updatedTimeSlots = {
      ...localPrefs.timeSlots,
      [timeSlot]: !localPrefs.timeSlots[timeSlot]
    };
    
    const updatedPrefs = {
      ...localPrefs,
      timeSlots: updatedTimeSlots
    };
    
    setLocalPrefs(updatedPrefs);
    onChange(updatedPrefs);
  };

  const handleNumberChange = (field, value) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    const updatedPrefs = {
      ...localPrefs,
      [field]: numValue
    };
    
    setLocalPrefs(updatedPrefs);
    onChange(updatedPrefs);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">
          Días disponibles
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {days.map(day => (
            <div key={day} className="flex items-center">
              <input
                type="checkbox"
                id={`day-${day}`}
                checked={localPrefs.days[day]}
                onChange={() => handleDayToggle(day)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`day-${day}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {day}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">
          Bloques de tiempo preferidos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {timeSlots.map(slot => (
            <div key={slot.id} className="flex items-center">
              <input
                type="checkbox"
                id={`timeslot-${slot.id}`}
                checked={localPrefs.timeSlots[slot.id]}
                onChange={() => handleTimeSlotToggle(slot.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor={`timeslot-${slot.id}`} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {slot.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="breakTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tiempo de descanso entre sesiones (minutos)
          </label>
          <input
            type="number"
            id="breakTime"
            min="5"
            max="60"
            step="5"
            value={localPrefs.breakTime}
            onChange={(e) => handleNumberChange('breakTime', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        
        <div>
          <label htmlFor="maxDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Duración máxima de sesión (minutos)
          </label>
          <input
            type="number"
            id="maxDuration"
            min="30"
            max="240"
            step="15"
            value={localPrefs.maxDuration}
            onChange={(e) => handleNumberChange('maxDuration', e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
}
