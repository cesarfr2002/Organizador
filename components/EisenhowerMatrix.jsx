import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isPast, isFuture, addDays } from 'date-fns';
import TaskList from './TaskList';

export default function EisenhowerMatrix({ tasks = [] }) {
  const router = useRouter();
  const [urgentImportant, setUrgentImportant] = useState([]);
  const [notUrgentImportant, setNotUrgentImportant] = useState([]);
  const [urgentNotImportant, setUrgentNotImportant] = useState([]);
  const [notUrgentNotImportant, setNotUrgentNotImportant] = useState([]);
  const [activeQuadrant, setActiveQuadrant] = useState(null);
  
  // Clasificar tareas en cuadrantes de la matriz
  useEffect(() => {
    const quadrants = {
      urgentImportant: [],
      notUrgentImportant: [],
      urgentNotImportant: [],
      notUrgentNotImportant: []
    };
    
    tasks.forEach(task => {
      if (task.completed) return; // Ignorar tareas completadas
      
      // Determinar si es importante basado en prioridad
      const isImportant = task.priority === 'Alta';
      
      // Determinar si es urgente basado en la fecha límite
      let isUrgent = false;
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const soon = addDays(today, 3); // Consideramos urgente si vence en 3 días o menos
        
        isUrgent = isPast(dueDate) || (dueDate <= soon);
      }
      
      // Asignar al cuadrante correspondiente
      if (isUrgent && isImportant) {
        quadrants.urgentImportant.push(task);
      } else if (!isUrgent && isImportant) {
        quadrants.notUrgentImportant.push(task);
      } else if (isUrgent && !isImportant) {
        quadrants.urgentNotImportant.push(task);
      } else {
        quadrants.notUrgentNotImportant.push(task);
      }
    });
    
    setUrgentImportant(quadrants.urgentImportant);
    setNotUrgentImportant(quadrants.notUrgentImportant);
    setUrgentNotImportant(quadrants.urgentNotImportant);
    setNotUrgentNotImportant(quadrants.notUrgentNotImportant);
  }, [tasks]);
  
  // Actualizar tareas cuando cambie su estado
  const handleTaskUpdate = (taskId) => {
    router.push(`/tasks/${taskId}/edit`);
  };
  
  const renderQuadrant = (title, tasks, description, bgColor, borderColor, icon, action) => {
    return (
      <div 
        className={`${bgColor} rounded-lg shadow-md overflow-hidden border-t-4 ${borderColor} h-full flex flex-col dark:bg-gray-800`}
      >
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg flex items-center dark:text-white">
              {icon}
              <span className="ml-2">{title}</span>
              <span className="ml-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </h3>
            <button 
              onClick={() => setActiveQuadrant(activeQuadrant === title ? null : title)} 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={
                  activeQuadrant === title 
                    ? "M19 9l-7 7-7-7" 
                    : "M9 5l7 7-7 7"
                } />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 my-2">{description}</p>
          <div className="text-sm italic text-gray-500 dark:text-gray-400 mt-2">{action}</div>
        </div>
        
        <div className={`flex-grow ${activeQuadrant === title ? '' : 'hidden'} p-4 bg-white dark:bg-gray-700`}>
          {tasks.length > 0 ? (
            <TaskList 
              tasks={tasks} 
              onTaskUpdate={handleTaskUpdate} 
              showPriority={true}
              showCategory={true}
            />
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No hay tareas en este cuadrante</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Matriz de Eisenhower</h2>
        <p className="text-gray-600 mt-2">
          La matriz de Eisenhower te ayuda a priorizar tus tareas basándose en su urgencia e importancia.
          Usa esta herramienta para decidir qué tareas debes hacer primero y cuáles pueden esperar.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cuadrante I: Urgente e Importante */}
        {renderQuadrant(
          "Urgente e Importante",
          urgentImportant,
          "Tareas críticas que requieren atención inmediata. Son prioridad máxima.",
          "bg-red-50",
          "border-red-500",
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>,
          "ACCIÓN: Hazlas inmediatamente"
        )}
        
        {/* Cuadrante II: No Urgente pero Importante */}
        {renderQuadrant(
          "Importante, No Urgente",
          notUrgentImportant,
          "Tareas importantes para tus objetivos a largo plazo. Planifica tiempo para ellas.",
          "bg-blue-50",
          "border-blue-500",
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>,
          "ACCIÓN: Programa estas tareas"
        )}
        
        {/* Cuadrante III: Urgente pero No Importante */}
        {renderQuadrant(
          "Urgente, No Importante",
          urgentNotImportant,
          "Tareas con plazos cercanos pero que no contribuyen significativamente a tus metas.",
          "bg-amber-50",
          "border-amber-500",
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>,
          "ACCIÓN: Delega si es posible"
        )}
        
        {/* Cuadrante IV: Ni Urgente ni Importante */}
        {renderQuadrant(
          "Ni Urgente, Ni Importante",
          notUrgentNotImportant,
          "Distracciones que consumen tiempo sin aportar valor significativo.",
          "bg-gray-50",
          "border-gray-500",
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>,
          "ACCIÓN: Elimina o minimiza"
        )}
      </div>
      
      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h3 className="font-medium mb-3">¿Cómo usar la matriz de Eisenhower?</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
          <li><strong className="text-red-600">Cuadrante I:</strong> Tareas importantes que deben hacerse hoy o en los próximos días.</li>
          <li><strong className="text-blue-600">Cuadrante II:</strong> Tareas importantes pero no urgentes. Planifica tiempo para estas tareas.</li>
          <li><strong className="text-amber-600">Cuadrante III:</strong> Tareas urgentes pero no importantes. Delégalas cuando sea posible.</li>
          <li><strong className="text-gray-600">Cuadrante IV:</strong> Tareas que no son ni urgentes ni importantes. Minimiza el tiempo dedicado.</li>
        </ul>
      </div>
    </div>
  );
}
