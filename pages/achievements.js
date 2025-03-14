import { useGamification } from '../context/GamificationContext';
import { useTheme } from '../utils/ThemeContext';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Achievements() {
  const { 
    achievements, 
    viewAchievement, 
    points, 
    level, 
    achievementCategories, 
    getAchievementProgress,
    encouragementMessage
  } = useGamification();
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [animatedAchievement, setAnimatedAchievement] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  
  // Mark achievements as viewed when visiting this page
  useEffect(() => {
    achievements.forEach(achievement => {
      if (achievement.unlocked && !achievement.viewed) {
        viewAchievement(achievement.id);
        
        // Add animation for newly unlocked achievements
        setAnimatedAchievement(achievement.id);
        setTimeout(() => setAnimatedAchievement(null), 2000);
      }
    });
  }, [achievements, viewAchievement]);

  // Filter achievements based on category, search and completion status
  const filteredAchievements = achievements.filter(achievement => {
    // Filter by category
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !achievement.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !achievement.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by completion status
    if (!showCompleted && achievement.unlocked) {
      return false;
    }
    
    return true;
  });
  
  // Sort achievements
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    switch (sortBy) {
      case 'points':
        return b.points - a.points;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'progress':
        // Sort by unlocked first, then by progress percentage
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        if (!a.unlocked && !b.unlocked) {
          const aProgress = a.maxProgress ? (a.progress / a.maxProgress) : 0;
          const bProgress = b.maxProgress ? (b.progress / b.maxProgress) : 0;
          return bProgress - aProgress;
        }
        return 0;
      default: // Sort by completion, then category
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return a.category.localeCompare(b.category);
    }
  });
  
  // Calculate user rank based on points
  const calculateRank = () => {
    if (points < 100) return { title: "Novato", color: "text-gray-600" };
    if (points < 500) return { title: "Aprendiz", color: "text-green-600" };
    if (points < 1000) return { title: "Estudiante", color: "text-blue-600" };
    if (points < 2000) return { title: "Académico", color: "text-purple-600" };
    if (points < 3500) return { title: "Erudito", color: "text-yellow-600" };
    if (points < 5000) return { title: "Maestro", color: "text-orange-600" };
    return { title: "Sabio", color: "text-red-600" };
  };
  
  const userRank = calculateRank();
  const totalUnlocked = achievements.filter(a => a.unlocked).length;
  const completionPercentage = Math.round((totalUnlocked / achievements.length) * 100);

  // Calculate how many points to next level
  const pointsToNextLevel = 500 - (points % 500);
  
  return (
    <>
      <Head>
        <title>Logros | UniOrganizer</title>
        <meta name="description" content="Visualiza y desbloquea logros en UniOrganizer" />
      </Head>
      
      <div className="max-w-5xl mx-auto">
        {/* User profile and stats section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="relative">
                <div className="bg-white text-blue-600 rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold ring-4 ring-white">
                  {level}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full px-2 py-1 text-xs font-medium text-gray-900">
                  {userRank.title}
                </div>
              </div>
              
              <div className="ml-6">
                <h1 className="text-2xl font-bold">Tus Logros</h1>
                <p className="text-blue-100">
                  Has desbloqueado {totalUnlocked} de {achievements.length} logros ({completionPercentage}%)
                </p>
                <div className="flex flex-col mt-1">
                  <span className="flex items-center text-sm font-medium">
                    <span className="mr-1">{points} puntos</span>
                    <span className="text-yellow-300">⭐</span>
                  </span>
                  <span className="text-xs text-blue-100">
                    {pointsToNextLevel} puntos para el siguiente nivel
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-center">
                <div className="mb-1 flex items-center">
                  <span className="text-orange-300 mr-1">🔥</span>
                  <span className="font-medium">{userRank.title}</span>
                </div>
                <div className="text-sm">Tu rango actual</div>
              </div>
              
              <button
                onClick={() => router.push('/settings')}
                className="mt-4 bg-white/20 hover:bg-white/30 rounded-md px-4 py-1 text-sm font-medium transition-colors"
              >
                Configuración de Gamificación
              </button>
            </div>
          </div>
          
          {encouragementMessage && (
            <div className="mt-4 italic text-sm bg-white/20 rounded p-2 text-center">
              "{encouragementMessage}"
            </div>
          )}
        </div>
        
        {/* Filters and controls */}
        <div className="mb-8 bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 className="text-xl font-semibold mb-2 md:mb-0">Explora Logros</h2>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar logros..."
                  className="pl-8 pr-4 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className="w-4 h-4 absolute left-2 top-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="default">Ordenar por: Predeterminado</option>
                <option value="points">Ordenar por: Puntos</option>
                <option value="title">Ordenar por: Título</option>
                <option value="progress">Ordenar por: Progreso</option>
              </select>
              
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  showCompleted 
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {showCompleted ? 'Todos' : 'Solo Pendientes'}
              </button>
            </div>
          </div>
          
          {/* Category tabs */}
          <div className="flex flex-wrap -mx-1 mb-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`m-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            {Object.entries(achievementCategories).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`m-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="flex items-center">
                  <span className="mr-1">{category.icon}</span>
                  <span>{category.name}</span>
                  <span className="ml-1 px-1 py-0.5 text-xs rounded-md bg-white dark:bg-gray-600">
                    {category.unlocked}/{category.total}
                  </span>
                </span>
              </button>
            ))}
          </div>
          
          {/* Achievement counter */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Mostrando {sortedAchievements.length} de {achievements.length} logros
          </div>
        </div>
        
        {/* Achievement cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {sortedAchievements.map((achievement) => (
            <div 
              key={achievement.id}
              onClick={() => setSelectedAchievement(achievement)}
              className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
                achievement.unlocked 
                  ? 'border-green-300 bg-green-50 dark:bg-green-900/30 dark:border-green-700' 
                  : 'border-gray-200 bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700'
              } ${animatedAchievement === achievement.id ? 'animate-pulse border-yellow-400' : ''}`}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mr-4">
                  <span className="text-2xl">{achievement.icon}</span>
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-bold text-lg truncate">{achievement.title}</h3>
                  <p className={`text-sm ${achievement.unlocked ? '' : 'blur-sm'}`}>
                    {achievement.description}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-blue-600 dark:text-blue-400">+{achievement.points} pts</span>
                {achievement.unlocked ? (
                  <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Desbloqueado
                  </span>
                ) : (
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Bloqueado
                  </span>
                )}
              </div>
              
              {achievement.maxProgress && !achievement.unlocked && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progreso</span>
                    <span>{achievement.progress}/{achievement.maxProgress}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all" 
                      style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty state */}
        {sortedAchievements.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-medium mb-2">No se encontraron logros</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Prueba a cambiar los filtros o crear una nueva búsqueda
            </p>
          </div>
        )}
        
        {/* Achievement motivation section */}
        <div className="mt-10 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <h3 className="font-semibold text-lg mb-4 text-center">Beneficios de los Logros</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">🧠</div>
              <h4 className="font-medium mb-1">Mejora la Motivación</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Los logros activan centros de recompensa en tu cerebro, aumentando dopamina y motivación.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">⏱️</div>
              <h4 className="font-medium mb-1">Construye Hábitos</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Los logros por rachas y constancia ayudan a formar hábitos de estudio positivos.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-medium mb-1">Clarifica Metas</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Divide grandes objetivos en pasos pequeños y alcanzables, facilitando el progreso.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Achievement detail modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
            <button 
              onClick={() => setSelectedAchievement(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex items-center mb-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                selectedAchievement.unlocked 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                <span className="text-4xl">{selectedAchievement.icon}</span>
              </div>
              <div className="ml-4">
                <h2 className="text-xl font-bold">{selectedAchievement.title}</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedAchievement.unlocked 
                    ? '¡Logro desbloqueado!' 
                    : 'Logro por desbloquear'}
                </p>
              </div>
            </div>
            
            <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
              <h3 className="font-medium mb-2">Descripción</h3>
              <p>{selectedAchievement.description}</p>
              
              {selectedAchievement.maxProgress && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progreso hacia el logro</span>
                    <span className="font-medium">
                      {selectedAchievement.progress}/{selectedAchievement.maxProgress}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${(selectedAchievement.progress / selectedAchievement.maxProgress) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Categoría</div>
                <div className="font-medium flex items-center">
                  <span className="mr-1">
                    {achievementCategories[selectedAchievement.category]?.icon}
                  </span>
                  {achievementCategories[selectedAchievement.category]?.name}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">Recompensa</div>
                <div className="font-medium text-blue-600 dark:text-blue-400">+{selectedAchievement.points} puntos</div>
              </div>
              
              {selectedAchievement.unlocked && (
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Estado</div>
                  <div className="text-green-600 dark:text-green-400 font-medium">Completado</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
