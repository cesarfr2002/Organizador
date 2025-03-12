import { useState } from 'react';
import { useRouter } from 'next/router';

export default function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  
  const actions = [
    {
      name: 'Tarea Rápida',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      action: () => router.push('/tasks/quick'),
      color: 'bg-amber-500 hover:bg-amber-600'
    },
    {
      name: 'Nueva Tarea',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      ),
      action: () => router.push('/tasks/new'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Nueva Nota',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      action: () => router.push('/notes/new'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Nuevo Evento',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      action: () => router.push('/calendar/new'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      name: 'Iniciar Timer',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      action: () => document.getElementById('study-timer')?.scrollIntoView({ behavior: 'smooth' }),
      color: 'bg-red-500 hover:bg-red-600'
    },
  ];

  return (
    <div className="relative">
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        )}
      </button>

      {/* Menú de acciones rápidas */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 py-1 ring-1 ring-black ring-opacity-5">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.action();
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <span className={`${action.color} p-1 rounded-full text-white mr-3`}>
                {action.icon}
              </span>
              {action.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
