import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/router';
import { useTheme } from '../utils/ThemeContext';

// Definir los componentes de iconos usados en el menú
function HomeIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ClipboardCheckIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function DocumentTextIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function CollectionIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function CogIcon() {
  return (
    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function Layout({ children }) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Función para verificar la ruta activa
  const isActive = (path) => {
    if (path === '/stats' && router.pathname === '/statistics') {
      // This handles the special case where both routes should be considered the same
      return `${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-700 text-white'}`;
    }
    
    return router.pathname === path ? 
      `${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-700 text-white'}` : 
      `${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;
  };

  const MENU_ITEMS = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Asignaturas', href: '/subjects', icon: BookOpenIcon },
    { name: 'Horario', href: '/schedule', icon: ClockIcon },
    { name: 'Tareas', href: '/tasks', icon: ClipboardCheckIcon },
    { name: 'Calendario', href: '/calendar', icon: CalendarIcon },
    { name: 'Apuntes', href: '/notes', icon: DocumentTextIcon },
    { name: 'Recursos', href: '/resources', icon: CollectionIcon }, // Añadir esta línea
    { name: 'Configuración', href: '/settings', icon: CogIcon },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={theme === 'dark' ? '#1a202c' : '#3f51b5'} />
      </Head>

      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        theme={theme}
      />

      {/* Header */}
      <header className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-600'} text-white shadow-md`}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="mr-2 md:hidden text-white focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/" className="text-xl font-bold">
              UniOrganizer
            </Link>
          </div>
          
          {session && (
            <div className="flex items-center">
              <span className="hidden md:inline mr-4 text-sm">
                Hola, {session.user.name}
              </span>
              <button 
                onClick={() => signOut()}
                className={`${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-blue-600 hover:bg-gray-100'} px-3 py-1 rounded text-sm`}
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar - Aumentado el ancho y mejorando estilos */}
        <aside 
          className={`
            w-72 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-800'} text-white fixed h-full z-20 transition-transform transform 
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            md:relative md:translate-x-0 ${theme === 'dark' ? 'shadow-gray-700' : 'shadow-lg'}
          `}
        >
          <div className="p-6">
            <div className="flex justify-center mb-8">
              <div className="p-2 bg-blue-600 rounded-full">
                <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            
            <nav>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/')}`}>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/subjects" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/subjects')}`}>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Asignaturas
                  </Link>
                </li>
                <li>
                  <Link href="/schedule" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/schedule')}`}>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Horario
                  </Link>
                </li>
                <li>
                  <Link href="/tasks" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/tasks')}`}>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Tareas
                  </Link>
                </li>
                <li>
                  <Link href="/notes" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/notes')}`}>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Apuntes
                  </Link>
                </li>
                <li>
                  <Link href="/calendar" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/calendar')}`}>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h2m2 4h10a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2v-3" />
                    </svg>
                    Calendario
                  </Link>
                </li>
                <li>
                  <Link href="/stats" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/stats')}`}>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Estadísticas
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/resources')}`}>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                    </svg>
                    Recursos
                  </Link>
                </li>
              </ul>
            </nav>
            
            {/* Sección inferior */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <Link href="/settings" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/settings')}`}>
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configuración
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 overflow-auto p-6 md:p-8 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : ''}`}>
          <div 
            className={`fixed inset-0 bg-black opacity-50 z-10 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} 
            onClick={toggleSidebar}
          ></div>
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
