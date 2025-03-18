import { useState, useEffect } from 'react';
import { format, differenceInDays, addDays, addWeeks, startOfWeek, endOfWeek, startOfDay, isSameDay, isBefore, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AcademicGanttChart({ tasks = [], showAllTasks = false }) {
  const [visibleWeeks, setVisibleWeeks] = useState([]);
  const [itemsToShow, setItemsToShow] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayPosition, setTodayPosition] = useState(50); // Default centered

  // Procesar las tareas y preparar los datos para visualización Gantt
  useEffect(() => {
    setLoading(true);
    
    // Filtrar las tareas según lo que queremos mostrar
    let filteredTasks = [];
    
    if (showAllTasks) {
      // Mostrar todas las tareas no completadas con fecha
      filteredTasks = tasks.filter(task => task.dueDate && !task.completed);
    } else {
      // Solo mostrar tareas importantes (exámenes, proyectos, etc.)
      const importantTaskTypes = ['examen', 'proyecto', 'trabajo', 'presentación'];
      filteredTasks = tasks.filter(task => 
        task.dueDate && 
        !task.completed && 
        ((task.type && importantTaskTypes.includes(task.type.toLowerCase())) || task.priority === 'Alta')
      );
    }
    
    // Preparar las tareas con fechas normalizadas
    const processedItems = filteredTasks.map(task => {
      const dueDate = startOfDay(new Date(task.dueDate));
      
      return {
        id: task._id,
        name: task.title,
        dueDate,
        color: task.subject?.color || '#3182CE',
        type: task.type || 'Tarea',
        subject: task.subject?.name || '',
        priority: task.priority || 'Media',
        completed: task.completed
      };
    });
    
    // Si no hay tareas, mostrar solo las próximas 4 semanas
    if (processedItems.length === 0) {
      const today = startOfDay(new Date());
      const startWeek = startOfWeek(today, { weekStartsOn: 1 });
      const weeks = Array(4).fill().map((_, i) => {
        const weekStart = addWeeks(startWeek, i);
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        return { start: weekStart, end: weekEnd };
      });
      
      setVisibleWeeks(weeks);
      setItemsToShow([]);
      setLoading(false);
      return;
    }
    
    // Encontrar el rango de fechas a mostrar
    const today = startOfDay(new Date());
    
    // Ordenar tareas por fecha de vencimiento
    processedItems.sort((a, b) => a.dueDate - b.dueDate);
    
    // Encontrar la fecha de vencimiento más temprana y más tardía
    const earliestDue = processedItems[0].dueDate;
    const latestDue = processedItems[processedItems.length - 1].dueDate;
    
    // Asegurarnos de incluir al menos 1 semana antes de la primera tarea y 1 después de la última
    const startDate = startOfWeek(
      isBefore(earliestDue, today) ? earliestDue : today, 
      { weekStartsOn: 1 }
    );
    const endDate = endOfWeek(
      isAfter(latestDue, addWeeks(today, 3)) ? latestDue : addWeeks(today, 3),
      { weekStartsOn: 1 }
    );
    
    // Calcular cuántas semanas mostrar
    const totalDays = differenceInDays(endDate, startDate);
    const numWeeks = Math.ceil(totalDays / 7);
    
    // Generar array de semanas
    const weeks = Array(numWeeks).fill().map((_, i) => {
      const weekStart = addWeeks(startDate, i);
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      return { start: weekStart, end: weekEnd };
    });
    
    // Calcular posición relativa de "hoy"
    const todayOffset = differenceInDays(today, startDate);
    const todayPercent = (todayOffset / totalDays) * 100;
    setTodayPosition(Math.max(0, Math.min(100, todayPercent)));
    
    setVisibleWeeks(weeks);
    setItemsToShow(processedItems);
    setLoading(false);
  }, [tasks, showAllTasks]);

  // Obtener color para tipo de tarea o prioridad
  const getTaskColor = (item) => {
    // Por tipo de tarea
    if (item.type === 'examen') return '#E53E3E'; // Rojo para exámenes
    if (item.type === 'proyecto') return '#805AD5'; // Morado para proyectos
    
    // Por prioridad
    switch (item.priority) {
      case 'Alta': return '#E53E3E'; // Rojo
      case 'Media': return '#ED8936'; // Naranja
      case 'Baja': return '#38A169'; // Verde
      default: return '#3182CE'; // Azul por defecto
    }
  };

  // Determinar en qué semana cae una tarea
  const getTaskWeekPosition = (task) => {
    // Si la tarea está fuera del rango visible
    if (visibleWeeks.length === 0) return null;
    
    const taskDate = task.dueDate;
    
    // Encontrar en qué semana cae la fecha de vencimiento
    for (let i = 0; i < visibleWeeks.length; i++) {
      if (taskDate >= visibleWeeks[i].start && taskDate <= visibleWeeks[i].end) {
        // Determinar en qué día de la semana cae (0-6)
        const weekStart = visibleWeeks[i].start;
        const dayOffset = differenceInDays(taskDate, weekStart);
        
        return {
          weekIndex: i,
          dayOffset: dayOffset,
          isToday: isSameDay(taskDate, new Date())
        };
      }
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Día de la semana en español
  const getDayName = (dayIndex) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[dayIndex];
  };

  // Día actual
  const today = startOfDay(new Date());

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4 dark:text-white">Cronograma de Proyectos Académicos</h3>
      
      {itemsToShow.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No hay proyectos o tareas para mostrar en el cronograma</p>
        </div>
      ) : (
        <div className="relative">
          {/* Línea de tiempo actual (HOY) */}
          <div 
            className="absolute top-0 bottom-0 border-l-2 border-red-500 dark:border-red-400 z-10"
            style={{ left: `${todayPosition}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-red-500 dark:bg-red-400 -ml-1.5"></div>
            <div className="absolute -top-6 -ml-7 text-xs text-red-600 dark:text-red-400 font-bold bg-white dark:bg-gray-800 px-1">HOY</div>
          </div>
          
          {/* Cabecera con fechas de semanas */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex">
              {visibleWeeks.map((week, idx) => (
                <div key={idx} className="flex-1 px-1 text-center">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {format(week.start, "dd MMM", { locale: es })} - {format(week.end, "dd MMM", { locale: es })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rejilla para las semanas */}
          <div className="grid grid-cols-1 gap-2">
            {/* Cabecera para días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {Array(7).fill().map((_, day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  {getDayName(day)}
                </div>
              ))}
            </div>
            
            {/* Semanas */}
            <div className="grid grid-cols-1 gap-4">
              {visibleWeeks.map((week, weekIdx) => (
                <div key={weekIdx} className="grid grid-cols-7 gap-1 h-20">
                  {/* Días de la semana */}
                  {Array(7).fill().map((_, day) => {
                    const currentDate = addDays(week.start, day);
                    const isCurrentDate = isSameDay(currentDate, today);
                    
                    return (
                      <div 
                        key={day} 
                        className={`border rounded-md p-1 relative dark:border-gray-700 ${
                          isCurrentDate ? 'border-red-500 bg-red-50 dark:bg-red-900/30 dark:border-red-700' : 'dark:bg-gray-700'
                        }`}
                      >
                        <div className="text-xs font-medium text-right text-gray-500 dark:text-gray-400">
                          {format(currentDate, "d", { locale: es })}
                        </div>
                        
                        {/* Tareas que vencen este día */}
                        <div className="mt-1 space-y-1 overflow-auto max-h-14">
                          {itemsToShow.filter(task => isSameDay(task.dueDate, currentDate)).map(task => (
                            <div 
                              key={task.id}
                              className="text-xs p-1 rounded dark:text-white"
                              style={{ 
                                backgroundColor: `${getTaskColor(task)}${darkMode ? '70' : '40'}`, 
                                borderLeft: `3px solid ${getTaskColor(task)}` 
                              }}
                              title={`${task.name} (${format(task.dueDate, "dd/MM/yyyy")})`}
                            >
                              <div className="truncate">{task.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Leyenda */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">Leyenda:</div>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-1"></div>
            <span>Examen</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 rounded mr-1"></div>
            <span>Proyecto</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-amber-500 rounded mr-1"></div>
            <span>Media Prioridad</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-1"></div>
            <span>Baja Prioridad</span>
          </div>
          <div className="flex items-center">
            <div className="border-l-2 border-red-500 h-4 mx-2"></div>
            <span>Hoy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
