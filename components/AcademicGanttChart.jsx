import { useState, useEffect } from 'react';
import { format, differenceInDays, addDays, parseISO, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AcademicGanttChart({ tasks = [], showAllTasks = false }) {
  const [timeRange, setTimeRange] = useState({ start: null, end: null });
  const [itemsToShow, setItemsToShow] = useState([]);
  const [loading, setLoading] = useState(true);

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
    
    // Si hay elementos para mostrar, calculamos el rango de fechas
    if (filteredTasks.length > 0) {
      // Encontrar la fecha más temprana y más tardía
      const dates = filteredTasks.map(task => new Date(task.dueDate));
      const earliestDate = new Date(Math.min(...dates));
      const latestDate = new Date(Math.max(...dates));
      
      // Añadir margen de 7 días antes y después
      const startDate = addDays(earliestDate, -7);
      const endDate = addDays(latestDate, 7);
      
      setTimeRange({ start: startDate, end: endDate });
    } else {
      // Si no hay elementos, usar fechas predeterminadas (hoy y +30 días)
      const today = new Date();
      setTimeRange({
        start: today,
        end: addDays(today, 30)
      });
    }
    
    // Procesar los elementos para el formato Gantt
    const processedItems = filteredTasks.map(task => {
      const dueDate = new Date(task.dueDate);
      // Estimar fecha de inicio según tipo de tarea o prioridad
      let startDate;
      
      if (task.type === 'examen') {
        startDate = addDays(dueDate, -7); // Una semana de estudio para exámenes
      } else if (task.type === 'proyecto' || task.type === 'trabajo') {
        startDate = addDays(dueDate, -14); // Dos semanas para proyectos
      } else if (task.priority === 'Alta') {
        startDate = addDays(dueDate, -5); // 5 días para tareas de alta prioridad
      } else if (task.priority === 'Media') {
        startDate = addDays(dueDate, -3); // 3 días para tareas de prioridad media
      } else {
        startDate = addDays(dueDate, -2); // 2 días para otras tareas
      }
      
      return {
        id: task._id,
        name: task.title,
        startDate: startDate,
        endDate: dueDate,
        color: task.subject?.color || '#3182CE',
        type: task.type || 'Tarea',
        subject: task.subject?.name || '',
        priority: task.priority || 'Media',
        completed: task.completed
      };
    });
    
    setItemsToShow(processedItems);
    setLoading(false);
  }, [tasks, showAllTasks]);

  // Calcular la duración total en días para el diagrama
  const getTotalDays = () => {
    if (!timeRange.start || !timeRange.end) return 30;
    return Math.max(30, differenceInDays(timeRange.end, timeRange.start) + 1);
  };

  // Determinar la posición y ancho de una barra en el diagrama
  const getBarPosition = (item) => {
    const totalDays = getTotalDays();
    const startDiff = differenceInDays(item.startDate, timeRange.start);
    const duration = differenceInDays(item.endDate, item.startDate) + 1;
    
    const leftPosition = (startDiff / totalDays) * 100;
    const widthPercentage = (duration / totalDays) * 100;
    
    return {
      left: `${Math.max(0, leftPosition)}%`,
      width: `${Math.min(100 - leftPosition, widthPercentage)}%`
    };
  };

  // Generar los markers de fechas para el eje X
  const generateDateMarkers = () => {
    if (!timeRange.start || !timeRange.end) return [];
    
    const totalDays = getTotalDays();
    const markers = [];
    const markerCount = Math.min(12, Math.floor(totalDays / 5)); // Máximo 12 markers
    
    for (let i = 0; i <= markerCount; i++) {
      const position = (i / markerCount) * 100;
      const days = Math.floor((i / markerCount) * totalDays);
      const date = addDays(timeRange.start, days);
      
      markers.push({
        position: `${position}%`,
        date,
        label: format(date, 'dd MMM', { locale: es })
      });
    }
    
    return markers;
  };

  // Obtener color para prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Alta': return '#E53E3E';
      case 'Media': return '#ED8936';
      case 'Baja': return '#38A169';
      default: return '#3182CE';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const dateMarkers = generateDateMarkers();
  const today = new Date();

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-medium mb-4">Cronograma de Proyectos Académicos</h3>
      
      {itemsToShow.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay proyectos o tareas para mostrar en el cronograma</p>
        </div>
      ) : (
        <div className="relative">
          {/* Líneas de guía para fechas */}
          <div className="border-b border-gray-300 mb-2 relative h-6">
            {dateMarkers.map((marker, idx) => (
              <div key={idx} className="absolute text-xs text-gray-600" style={{ left: marker.position, transform: 'translateX(-50%)' }}>
                {marker.label}
                <div className="h-2 w-px bg-gray-300 mx-auto mt-1"></div>
              </div>
            ))}
          </div>
          
          {/* Línea de tiempo actual */}
          {isBefore(timeRange.start, today) && isBefore(today, timeRange.end) && (
            <div 
              className="absolute top-6 bottom-0 border-l-2 border-red-500 z-10"
              style={{ 
                left: `${(differenceInDays(today, timeRange.start) / getTotalDays()) * 100}%`,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1"></div>
            </div>
          )}
          
          {/* Tareas y proyectos */}
          <div className="space-y-3 mt-4">
            {itemsToShow.map((item) => {
              const barStyle = getBarPosition(item);
              const isOverdue = isBefore(item.endDate, today) && (!item.completed);
              
              return (
                <div key={item.id} className="relative h-10">
                  <div className="absolute left-0 top-0 h-full flex items-center w-1/4 pr-4 text-sm">
                    <span className="truncate font-medium">{item.name}</span>
                  </div>
                  
                  <div className="absolute left-1/4 right-0 h-full bg-gray-100 rounded">
                    {/* Barra del proyecto/tarea */}
                    <div 
                      className="absolute top-0 h-full rounded flex items-center px-2 text-xs text-white"
                      style={{
                        ...barStyle,
                        backgroundColor: item.type === 'examen' ? '#E53E3E' : 
                                         item.type === 'proyecto' ? '#805AD5' : 
                                         getPriorityColor(item.priority),
                        opacity: isOverdue ? 0.7 : 1
                      }}
                      title={`${item.name} (${format(item.startDate, 'dd/MM')} - ${format(item.endDate, 'dd/MM')})`}
                    >
                      <div className="truncate">
                        {getTotalDays() < 60 && item.type}
                        {isOverdue && ' ⚠️'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Leyenda */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 font-medium mb-2">Leyenda:</div>
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
          {isBefore(timeRange.start, today) && isBefore(today, timeRange.end) && (
            <div className="flex items-center">
              <div className="w-px h-4 bg-red-500 mx-2"></div>
              <span>Hoy</span>
            </div>
          )}
          <div className="flex items-center">
            <span>⚠️ Atrasado</span>
          </div>
        </div>
      </div>
    </div>
  );
}
