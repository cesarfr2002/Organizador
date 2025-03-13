import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

export default function CalendarTaskView({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  
  useEffect(() => {
    // Generate calendar days for the month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add days from previous and next month to complete weeks
    const firstDayOfWeek = monthStart.getDay() || 7; // 1 for Monday, 7 for Sunday
    const lastDayOfWeek = monthEnd.getDay() || 7;
    
    const previousMonthDays = [];
    for (let i = firstDayOfWeek - 1; i > 0; i--) {
      const date = new Date(monthStart);
      date.setDate(date.getDate() - i);
      previousMonthDays.push(date);
    }
    
    const nextMonthDays = [];
    for (let i = 1; i <= 7 - lastDayOfWeek; i++) {
      const date = new Date(monthEnd);
      date.setDate(date.getDate() + i);
      nextMonthDays.push(date);
    }
    
    setCalendarDays([...previousMonthDays, ...daysInMonth, ...nextMonthDays]);
  }, [currentDate]);
  
  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(new Date(task.dueDate), day);
    });
  };
  
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };
  
  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-800';
      case 'Media': return 'bg-yellow-100 text-yellow-800';
      case 'Baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div>
      {/* Calendar header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Hoy
          </button>
          <button
            onClick={goToNextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded">
        {/* Day headers */}
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, i) => {
          const tasksForDay = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={i} 
              className={`bg-white p-2 min-h-32 border-t ${
                isCurrentMonth ? '' : 'text-gray-400 bg-gray-50'
              } ${
                isCurrentDay ? 'border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="text-right font-medium text-sm">
                {format(day, 'd')}
              </div>
              <div className="mt-1 space-y-1">
                {tasksForDay.slice(0, 3).map(task => (
                  <Link href={`/tasks/${task._id}`} key={task._id}>
                    <div className={`text-xs p-1 rounded truncate ${
                      task.completed 
                        ? 'bg-gray-100 text-gray-500 line-through' 
                        : getPriorityColor(task.priority)
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  </Link>
                ))}
                {tasksForDay.length > 3 && (
                  <div className="text-xs text-center text-gray-500">
                    +{tasksForDay.length - 3} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
