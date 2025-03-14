import { useGamification } from '../context/GamificationContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '../utils/ThemeContext';
import { useState, useEffect } from 'react';

// Add motivational quotes array
const motivationalQuotes = [
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "La disciplina es el puente entre metas y logros.",
  "Aprende como si fueras a vivir para siempre, vive como si fueras a morir mañana.",
  "El conocimiento es poder.",
  "Todo lo que puedes imaginar, lo puedes lograr.",
  "La educación es el arma más poderosa para cambiar el mundo.",
  "El aprendizaje es un tesoro que seguirá a su dueño a todas partes.",
  "Cada día es una nueva oportunidad para cambiar tu vida."
];

export default function Layout({ children }) {
  const { gamificationEnabled, points, level, streakDays, achievements, dailyChallenge, completeChallenge } = useGamification();
  const { theme } = useTheme();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showQuote, setShowQuote] = useState(true);
  const [currentQuote, setCurrentQuote] = useState("");
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [lastPoints, setLastPoints] = useState(points);
  
  // Select random quote on mount and change periodically
  useEffect(() => {
    if (gamificationEnabled) {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      setCurrentQuote(randomQuote);
      
      // Change quote every 4 hours
      const quoteInterval = setInterval(() => {
        const newQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
        setCurrentQuote(newQuote);
      }, 4 * 60 * 60 * 1000);
      
      return () => clearInterval(quoteInterval);
    }
  }, [gamificationEnabled]);
  
  // Handle points animation
  useEffect(() => {
    if (points > lastPoints) {
      setShowPointsAnimation(true);
      const timer = setTimeout(() => setShowPointsAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
    setLastPoints(points);
  }, [points, lastPoints]);
  
  // Determine active page for navigation
  const isActive = (path) => router.pathname === path || router.pathname.startsWith(`${path}/`);
  
  // Create gamification bar with enhanced features
  const gamificationBar = gamificationEnabled ? (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-1 px-4">
      {/* Quote section */}
      {showQuote && currentQuote && (
        <div className="text-center py-2 italic text-sm bg-opacity-30 bg-white rounded mb-1 relative">
          <span className="font-light">"{currentQuote}"</span>
          <button 
            onClick={() => setShowQuote(false)}
            className="absolute right-2 top-2 text-xs opacity-70 hover:opacity-100"
            aria-label="Cerrar cita"
          >×</button>
        </div>
      )}
      
      {/* Main gamification elements */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Level badge */}
          <div className="flex flex-col items-center">
            <span className="bg-white text-blue-600 rounded-full h-8 w-8 flex items-center justify-center font-bold">
              {level}
            </span>
            <span className="text-xs mt-1">Nivel</span>
          </div>

          {/* Streak counter */}
          <div className="flex flex-col items-center">
            <span className="flex items-center">
              <span className="text-orange-300 mr-1">🔥</span>
              <span className="font-medium">{streakDays}</span>
            </span>
            <span className="text-xs">Días seguidos</span>
          </div>
        </div>
        
        {/* Points and achievement section */}
        <div className="flex items-center space-x-4">
          {/* Points with animation */}
          <div className="relative">
            <div className="flex items-center">
              <span className="mr-1 font-medium">{points} pts</span>
              <span className="text-yellow-300">⭐</span>
            </div>
            {showPointsAnimation && (
              <div className="absolute -top-6 right-0 text-yellow-300 font-medium animate-bounce">
                +{points - lastPoints}
              </div>
            )}
          </div>
          
          {/* Achievements button */}
          <div className="relative">
            <button 
              onClick={() => router.push('/achievements')}
              className="bg-blue-700 hover:bg-blue-800 rounded-md px-2 py-1 text-xs font-medium transition-colors"
            >
              🏆 Logros
              {achievements && achievements.some(a => !a.viewed) && (
                <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-3 h-3"></span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Daily challenge section */}
      {dailyChallenge && (
        <div className="mt-2 py-1 px-2 bg-blue-700 bg-opacity-50 rounded-md flex justify-between items-center text-sm">
          <div className="flex items-center">
            <span className="text-yellow-300 mr-2">📌</span>
            <span>Reto diario: {dailyChallenge.title}</span>
          </div>
          {!dailyChallenge.completed ? (
            <button 
              onClick={completeChallenge}
              className="bg-green-600 hover:bg-green-700 rounded px-2 py-1 text-xs"
            >
              Completar
            </button>
          ) : (
            <span className="text-green-300 text-xs font-medium">✓ Completado</span>
          )}
        </div>
      )}
    </div>
  ) : null;
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
      <header className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow sticky top-0 z-10`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <Link href="/" legacyBehavior>
                <a className="font-bold text-xl mr-6 flex items-center">
                  <span className="text-blue-600 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </span>
                  UniOrganizer
                </a>
              </Link>
              <nav className="hidden md:flex space-x-1">
                <Link href="/tasks" legacyBehavior>
                  <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/tasks') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Tareas
                    </span>
                  </a>
                </Link>
                <Link href="/notes" legacyBehavior>
                  <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/notes') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Notas
                    </span>
                  </a>
                </Link>
                <Link href="/calendar" legacyBehavior>
                  <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/calendar') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Calendario
                    </span>
                  </a>
                </Link>
                <Link href="/subjects" legacyBehavior>
                  <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/subjects') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Asignaturas
                    </span>
                  </a>
                </Link>
                <Link href="/resources" legacyBehavior>
                  <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/resources') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Recursos
                    </span>
                  </a>
                </Link>
                <Link href="/statistics" legacyBehavior>
                  <a className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/statistics') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Estadísticas
                    </span>
                  </a>
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              <Link href="/notifications" legacyBehavior>
                <a className={`hidden sm:flex px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 mr-2 ${isActive('/notifications') ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </a>
              </Link>
              <Link href="/settings" legacyBehavior>
                <a className={`hidden sm:flex px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 ${isActive('/settings') ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </a>
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden ml-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Menú"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile menu - improved with animation */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="py-2 space-y-1">
              <Link href="/tasks" legacyBehavior>
                <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/tasks') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : ''}`}>
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Tareas
                  </span>
                </a>
              </Link>
              <Link href="/notes" legacyBehavior>
                <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/notes') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : ''}`}>
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Notas
                  </span>
                </a>
              </Link>
              <Link href="/calendar" legacyBehavior>
                <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/calendar') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : ''}`}>
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calendario
                  </span>
                </a>
              </Link>
              <Link href="/subjects" legacyBehavior>
                <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/subjects') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : ''}`}>
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Asignaturas
                  </span>
                </a>
              </Link>
              <Link href="/resources" legacyBehavior>
                <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/resources') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : ''}`}>
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Recursos
                  </span>
                </a>
              </Link>
              <Link href="/statistics" legacyBehavior>
                <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/statistics') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : ''}`}>
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Estadísticas
                  </span>
                </a>
              </Link>
              <Link href="/settings" legacyBehavior>
                <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/settings') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : ''}`}>
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configuración
                  </span>
                </a>
              </Link>
              <Link href="/notifications" legacyBehavior>
                <a className={`block px-3 py-2 rounded-md text-base font-medium ${isActive('/notifications') ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' : ''}`}>
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notificaciones
                  </span>
                </a>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Place the enhanced gamification bar right below the header/navigation */}
      {gamificationBar}
      
      <main className={`container mx-auto px-4 py-6 ${theme === 'dark' ? 'text-white' : ''}`}>
        {children}
      </main>

      <footer className={`${theme === 'dark' ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'} py-4 text-center text-sm mt-8`}>
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} UniOrganizer - Tu asistente académico personal</p>
        </div>
      </footer>
    </div>
  );
}
