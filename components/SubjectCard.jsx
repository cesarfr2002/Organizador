import Link from 'next/link';

export default function SubjectCard({ subject }) {
  // Determinar el color del borde según la propiedad color del subject
  // O usar un color por defecto
  const borderColor = subject.color || '#3B82F6';
  
  // Convertir el color a un formato utilizable para el estilo de fondo con opacidad
  const getBackgroundColor = () => {
    // Si ya es un color hexadecimal, convertir a RGB y agregar opacidad
    if (borderColor.startsWith('#')) {
      const r = parseInt(borderColor.slice(1, 3), 16);
      const g = parseInt(borderColor.slice(3, 5), 16);
      const b = parseInt(borderColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, 0.1)`;
    }
    // Para colores CSS nombrados o RGB, simplemente añadir opacidad (asumiendo que es un color válido)
    return borderColor.replace(')', ', 0.1)').replace('rgb', 'rgba');
  };
  
  // Calcular progreso (ejemplo simple, deberías adaptar esto según tus datos)
  const progress = subject.progress || 0;
  
  // Determinar el estado según la propiedad status o un valor por defecto
  const getStatusText = () => {
    switch (subject.status) {
      case 'active':
        return 'Activa';
      case 'completed':
        return 'Completada';
      case 'upcoming':
        return 'Próximamente';
      case 'inactive':
        return 'Inactiva';
      default:
        return 'Activa';
    }
  };
  
  // Estilo para el indicador de estado
  const getStatusStyle = () => {
    switch (subject.status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'upcoming':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-green-500';
    }
  };
  
  return (
    <div 
      className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800 dark:border-gray-700"
      style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold mb-1 dark:text-white">
            <Link href={`/subjects/${subject._id}`}>
              {subject.name}
            </Link>
          </h3>
          
          <div className="flex items-center">
            <span className={`inline-block w-2 h-2 rounded-full ${getStatusStyle()} mr-1`}></span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{getStatusText()}</span>
          </div>
        </div>
        
        {subject.professor && (
          <p className="text-sm text-gray-600 dark:text-gray-400">Prof. {subject.professor}</p>
        )}
        
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-700 dark:text-gray-300">Progreso</span>
            <span className="text-xs text-gray-700 dark:text-gray-300">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full" 
              style={{ width: `${progress}%`, backgroundColor: borderColor }}
            ></div>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 flex justify-between">
          <div>
            <strong className="text-gray-800 dark:text-gray-200">{subject.credits || '3'}</strong> créditos
          </div>
          {subject.nextClass && (
            <div>
              Próxima clase: <strong className="text-gray-800 dark:text-gray-200">{subject.nextClass}</strong>
            </div>
          )}
        </div>
      </div>
      
      <div 
        className="border-t flex justify-between px-5 py-3 text-sm dark:border-gray-700" 
        style={{ backgroundColor: getBackgroundColor() }}
      >
        <div className="flex space-x-3">
          <Link href={`/subjects/${subject._id}/tasks`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            Tareas {subject.pendingTasks && <span className="ml-1 bg-blue-100 text-blue-800 px-1.5 rounded-full dark:bg-blue-900 dark:text-blue-300">{subject.pendingTasks}</span>}
          </Link>
          <Link href={`/subjects/${subject._id}/notes`} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
            Apuntes
          </Link>
        </div>
        <Link href={`/subjects/${subject._id}`} className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
          Ver detalle →
        </Link>
      </div>
    </div>
  );
}
