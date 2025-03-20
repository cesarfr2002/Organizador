import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Constantes para almacenamiento
const STORAGE_KEY = 'gamificationSettings';
const STORAGE_VERSION = '1.0.1'; // Versión para control de cambios en la estructura
const DEVICE_ID_KEY = 'device_id';
const BACKUP_KEY = 'gamification_backup';

const GamificationContext = createContext();

// Daily challenges to randomly select from
const DAILY_CHALLENGES = [
  { id: 1, title: "Completa 3 tareas hoy", points: 50, type: "tasks" },
  { id: 2, title: "Estudia durante 2 horas continuas", points: 75, type: "study" },
  { id: 3, title: "Crea notas para una asignatura", points: 40, type: "notes" },
  { id: 4, title: "Organiza tu calendario para la semana", points: 60, type: "calendar" },
  { id: 5, title: "Revisa tus recursos de estudio", points: 30, type: "resources" },
  { id: 6, title: "Completa un repaso de una asignatura", points: 80, type: "review" },
  { id: 7, title: "Elimina 5 tareas pendientes", points: 65, type: "cleanup" },
  { id: 8, title: "Planifica tus objetivos para el mes", points: 70, type: "planning" },
  { id: 9, title: "Actualiza el progreso de tus proyectos", points: 55, type: "projects" },
  { id: 10, title: "Reserva tiempo para descansar adecuadamente", points: 45, type: "selfcare" },
  { id: 11, title: "Añade recursos a tus asignaturas", points: 50, type: "resources" },
  { id: 12, title: "Revisa y actualiza tus notas", points: 40, type: "notes" }
];

// Achievement definitions - expanded with categories and more progression paths
const ACHIEVEMENTS = [
  // Tareas (Tasks) Category
  { 
    id: "firstTask", 
    title: "Primer Paso", 
    description: "Completa tu primera tarea",
    icon: "🏆",
    category: "tareas",
    points: 50,
    unlocked: false,
    viewed: false
  },
  { 
    id: "tasks10",
    title: "Productividad en Aumento",
    description: "Completa 10 tareas",
    icon: "📝",
    category: "tareas",
    points: 150,
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    viewed: false
  },
  { 
    id: "tasks50",
    title: "Experto en Productividad",
    description: "Completa 50 tareas",
    icon: "🚀",
    category: "tareas",
    points: 300,
    progress: 0,
    maxProgress: 50,
    unlocked: false,
    viewed: false
  },
  {
    id: "taskStreak5",
    title: "Efectividad Constante",
    description: "Completa al menos una tarea durante 5 días consecutivos",
    icon: "⚡",
    category: "tareas",
    points: 200,
    progress: 0,
    maxProgress: 5,
    unlocked: false,
    viewed: false
  },
  
  // Constancia (Consistency) Category
  { 
    id: "streak3",
    title: "Constancia Inicial",
    description: "Usa la aplicación durante 3 días seguidos",
    icon: "🔥",
    category: "constancia",
    points: 100,
    progress: 0,
    maxProgress: 3,
    unlocked: false,
    viewed: false
  },
  { 
    id: "streak7",
    title: "Hábito Formado",
    description: "Usa la aplicación durante 7 días seguidos",
    icon: "⭐",
    category: "constancia",
    points: 200,
    progress: 0,
    maxProgress: 7,
    unlocked: false,
    viewed: false
  },
  {
    id: "streak30",
    title: "Maestro de la Disciplina",
    description: "Usa la aplicación durante 30 días seguidos",
    icon: "🌟",
    category: "constancia",
    points: 500,
    progress: 0,
    maxProgress: 30,
    unlocked: false,
    viewed: false
  },
  
  // Progreso (Progress) Category
  { 
    id: "level5",
    title: "Estudiante Dedicado",
    description: "Alcanza el nivel 5",
    icon: "🎓",
    category: "progreso",
    points: 300,
    progress: 1, // Starting at level 1
    maxProgress: 5,
    unlocked: false,
    viewed: false
  },
  {
    id: "level10",
    title: "Académico Ejemplar",
    description: "Alcanza el nivel 10",
    icon: "🧠",
    category: "progreso",
    points: 500,
    progress: 1,
    maxProgress: 10,
    unlocked: false, 
    viewed: false
  },
  
  // Notas (Notes) Category
  {
    id: "firstNote",
    title: "Pensamiento Capturado",
    description: "Crea tu primera nota",
    icon: "📘",
    category: "notas",
    points: 50,
    unlocked: false,
    viewed: false
  },
  {
    id: "notes10",
    title: "Recopilador de Conocimiento",
    description: "Crea 10 notas",
    icon: "📚",
    category: "notas",
    points: 150,
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    viewed: false
  },
  
  // Calendario (Calendar) Category
  {
    id: "firstEvent",
    title: "Planificador Inicial",
    description: "Añade tu primer evento al calendario",
    icon: "📅",
    category: "calendario",
    points: 50,
    unlocked: false,
    viewed: false
  },
  {
    id: "events10",
    title: "Organizador Experto",
    description: "Añade 10 eventos al calendario",
    icon: "🗓️",
    category: "calendario",
    points: 150,
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    viewed: false
  },
  
  // Desafíos (Challenges) Category
  {
    id: "firstChallenge",
    title: "Desafiante",
    description: "Completa tu primer desafío diario",
    icon: "🎯",
    category: "desafíos",
    points: 75,
    unlocked: false,
    viewed: false
  },
  {
    id: "challenges10",
    title: "Conquistador de Desafíos",
    description: "Completa 10 desafíos diarios",
    icon: "🏅",
    category: "desafíos",
    points: 250,
    progress: 0,
    maxProgress: 10,
    unlocked: false,
    viewed: false
  }
];

// Positive reinforcement messages
const ENCOURAGEMENT_MESSAGES = [
  "¡Excelente trabajo! Estás en el buen camino.",
  "¡Cada pequeño paso suma! Sigue adelante.",
  "Tu constancia está dando frutos. ¡Sigue así!",
  "El aprendizaje constante es la clave del éxito.",
  "Recuerda que cada esfuerzo te acerca a tus metas.",
  "¡Qué gran progreso! Tu futuro se ve brillante.",
  "Hoy eres mejor que ayer. ¡Mañana serás aún mejor!",
  "El éxito se construye día a día. ¡Estás haciéndolo genial!",
  "Tu dedicación es inspiradora. ¡Continúa así!",
  "Pequeños hábitos, grandes resultados. ¡Sigue cultivándolos!"
];

export function GamificationProvider({ children }) {
  const { user } = useAuth();
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [streakDays, setStreakDays] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [recentReward, setRecentReward] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [taskStreak, setTaskStreak] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);
  const [encouragementMessage, setEncouragementMessage] = useState("");
  const [achievementCategories, setAchievementCategories] = useState({
    tareas: { name: "Tareas", icon: "📝", unlocked: 0, total: 0 },
    constancia: { name: "Constancia", icon: "🔥", unlocked: 0, total: 0 },
    progreso: { name: "Progreso", icon: "📈", unlocked: 0, total: 0 },
    notas: { name: "Notas", icon: "📘", unlocked: 0, total: 0 },
    calendario: { name: "Calendario", icon: "📅", unlocked: 0, total: 0 },
    desafíos: { name: "Desafíos", icon: "🎯", unlocked: 0, total: 0 }
  });
  const [lastTaskDate, setLastTaskDate] = useState(null);

  // Genera un ID de dispositivo único para sincronización
  useEffect(() => {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    setDeviceId(id);
  }, []);

  // Initialize categories on mount
  useEffect(() => {
    const categories = {};
    ACHIEVEMENTS.forEach(achievement => {
      if (!categories[achievement.category]) {
        categories[achievement.category] = {
          name: achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1),
          icon: achievement.icon,
          unlocked: 0,
          total: 1
        };
      } else {
        categories[achievement.category].total++;
      }
    });
    
    setAchievementCategories(categories);
  }, []);

  // Carga la configuración de gamificación al iniciar
  useEffect(() => {
    try {
      console.log('Inicializando sistema de gamificación...');
      // Intenta cargar desde localStorage
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedGamification = localStorage.getItem('gamification');
      
      if (savedGamification) {
        const data = JSON.parse(savedGamification);
        setGamificationEnabled(data.enabled ?? true);
        setPoints(data.points ?? 0);
        setLevel(data.level ?? 1);
        setStreakDays(data.streakDays ?? 0);
        setLastLogin(data.lastLogin ?? null);
        setAchievements(data.achievements ?? ACHIEVEMENTS);
        setDailyChallenge(data.dailyChallenge ?? null);
        setCompletedTasks(data.completedTasks ?? 0);
        setTaskStreak(data.taskStreak ?? 0);
        setCompletedChallenges(data.completedChallenges ?? 0);
        setNotesCount(data.notesCount ?? 0);
        setEventsCount(data.eventsCount ?? 0);
        setLastTaskDate(data.lastTaskDate ?? null);
        
        // Calculate and update category stats
        if (data.achievements) {
          updateCategoryStats(data.achievements);
        }
        
        // Show random encouragement message
        showRandomEncouragement();
      } else if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Verifica versión y estructura de los datos
        if (parsedData && typeof parsedData === 'object') {
          setGamificationEnabled(parsedData.enabled !== undefined ? parsedData.enabled : true);
          setPoints(typeof parsedData.points === 'number' ? parsedData.points : 0);
          setLevel(typeof parsedData.level === 'number' ? parsedData.level : 1);
          setAchievements(Array.isArray(parsedData.achievements) ? parsedData.achievements : ACHIEVEMENTS);
          setLastSyncTime(parsedData.syncTime || new Date().toISOString());
          
          console.log('Datos de gamificación cargados correctamente:', { 
            enabled: parsedData.enabled,
            points: parsedData.points,
            level: parsedData.level,
            achievements: parsedData.achievements?.length || 0
          });
        } else {
          console.warn('Formato de datos inválido, usando valores por defecto');
          resetToDefaults();
        }
      } else {
        // Si no hay datos, intenta cargar desde el respaldo
        const backupData = sessionStorage.getItem(BACKUP_KEY);
        
        if (backupData) {
          console.log('Restaurando datos desde respaldo de sesión');
          const parsedBackup = JSON.parse(backupData);
          setGamificationEnabled(parsedBackup.enabled !== undefined ? parsedBackup.enabled : true);
          setPoints(typeof parsedBackup.points === 'number' ? parsedBackup.points : 0);
          setLevel(typeof parsedBackup.level === 'number' ? parsedBackup.level : 1);
          setAchievements(Array.isArray(parsedBackup.achievements) ? parsedBackup.achievements : ACHIEVEMENTS);
          setLastSyncTime(parsedBackup.syncTime || new Date().toISOString());
        } else {
          console.log('No se encontraron datos guardados, usando valores por defecto');
          resetToDefaults();
        }
      }
      
      // Check streak and update login
      const today = new Date().toDateString();
      
      if (lastLogin) {
        const lastDate = new Date(lastLogin);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate.toDateString() === yesterday.toDateString()) {
          // Consecutive day, increment streak
          setStreakDays(prev => prev + 1);
          awardPoints(10, "¡Día consecutivo! +10 pts");
        } else if (lastDate.toDateString() !== today) {
          // Not a consecutive day, reset streak if it's not already today
          setStreakDays(1);
        }
      } else {
        // First login
        setStreakDays(1);
      }
      
      setLastLogin(today);
      
      // Set daily challenge if none exists or it's a new day
      if (!dailyChallenge || dailyChallenge.date !== today) {
        const randomChallenge = DAILY_CHALLENGES[Math.floor(Math.random() * DAILY_CHALLENGES.length)];
        setDailyChallenge({
          ...randomChallenge,
          completed: false,
          date: today
        });
      }
    } catch (error) {
      console.error("Error al cargar la configuración de gamificación:", error);
      resetToDefaults();
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Resetea a los valores predeterminados
  const resetToDefaults = () => {
    setGamificationEnabled(true);
    setPoints(0);
    setLevel(1);
    setAchievements(ACHIEVEMENTS);
    setLastSyncTime(new Date().toISOString());
  };

  // Guarda cambios en localStorage y sessionStorage cuando cambian los estados
  useEffect(() => {
    if (isInitialized) {
      saveCurrentState();
    }
  }, [gamificationEnabled, points, level, streakDays, lastLogin, achievements, dailyChallenge, completedTasks, isInitialized, taskStreak, completedChallenges, notesCount, eventsCount, lastTaskDate]);

  // Calcula nivel basado en puntos
  useEffect(() => {
    if (!isInitialized) return;
    
    const newLevel = Math.floor(points / 500) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      if (newLevel > level) {
        showReward(`¡Subiste al nivel ${newLevel}! 🎉`);
        
        // Create a level up notification
        if (typeof window !== 'undefined' && Notification.permission === 'granted') {
          new Notification("¡Subiste de nivel!", {
            body: `¡Felicidades! Has alcanzado el nivel ${newLevel}. Sigue así.`,
            icon: "/favicon.ico"
          });
        }
        
        // Check for level 5 achievement
        if (newLevel >= 5) {
          unlockAchievement("level5");
        }
      }
    }
  }, [points, level, isInitialized]);

  // Sincronización entre pestañas mediante el evento storage
  useEffect(() => {
    if (!isInitialized) return;

    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEY || event.key === 'gamification') {
        try {
          const newData = JSON.parse(event.newValue);
          
          // Solo actualizar si los datos son más recientes o tienen más puntos
          if (newData && newData.syncTime && (
              newData.syncTime > lastSyncTime || 
              (newData.points > points && newData.deviceId !== deviceId)
            )) {
            console.log('Sincronizando datos de gamificación desde otra pestaña/dispositivo');
            setGamificationEnabled(newData.enabled);
            setPoints(newData.points);
            setLevel(newData.level);
            setAchievements(newData.achievements);
            setLastSyncTime(newData.syncTime);
            
            // Mostrar notificación de sincronización si provinieron de otro dispositivo
            if (newData.deviceId !== deviceId) {
              showReward(`Progreso sincronizado: ${newData.points} puntos 🔄`);
            }
          }
        } catch (error) {
          console.error("Error al sincronizar datos:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isInitialized, lastSyncTime, points, deviceId]);

  // Verificación periódica para asegurarse que los datos no se pierdan
  useEffect(() => {
    if (!isInitialized) return;

    // Verifica cada 5 minutos que los datos estén guardados
    const checkInterval = setInterval(() => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        
        if (!savedData) {
          console.warn("No se encontraron datos de gamificación, restaurando desde respaldo");
          const backupData = sessionStorage.getItem(BACKUP_KEY);
          
          if (backupData) {
            localStorage.setItem(STORAGE_KEY, backupData);
          } else {
            saveCurrentState();
          }
        }
      } catch (error) {
        console.error("Error en verificación periódica:", error);
      }
    }, 300000); // 5 minutos

    return () => clearInterval(checkInterval);
  }, [isInitialized]);

  const saveCurrentState = () => {
    try {
      const currentTime = new Date().toISOString();
      
      // Save to 'gamification' (original format)
      localStorage.setItem('gamification', JSON.stringify({
        enabled: gamificationEnabled,
        points,
        level,
        streakDays,
        lastLogin,
        achievements,
        dailyChallenge,
        completedTasks,
        taskStreak,
        completedChallenges,
        notesCount,
        eventsCount,
        lastTaskDate
      }));
      
      // Save to new format
      const dataToSave = {
        version: STORAGE_VERSION,
        enabled: gamificationEnabled,
        points,
        level,
        achievements,
        syncTime: currentTime,
        deviceId,
        streakDays,
        lastLogin,
        dailyChallenge,
        completedTasks,
        taskStreak,
        completedChallenges,
        notesCount,
        eventsCount,
        lastTaskDate
      };
      
      // Guarda en localStorage para persistencia a largo plazo
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      // Guarda en sessionStorage como respaldo
      sessionStorage.setItem(BACKUP_KEY, JSON.stringify(dataToSave));
      
      setLastSyncTime(currentTime);
    } catch (error) {
      console.error("Error al guardar la configuración de gamificación:", error);
    }
  };

  // Show reward message
  const showReward = (message) => {
    setRecentReward(message);
    setTimeout(() => {
      setRecentReward(null);
    }, 3000);
  };

  // Award points and handle notifications
  const awardPoints = (amount, reason = "") => {
    if (!gamificationEnabled) return;
    
    setPoints(prev => prev + amount);
    
    if (reason && typeof window !== 'undefined' && Notification.permission === 'granted') {
      new Notification("¡Puntos ganados!", {
        body: reason,
        icon: "/favicon.ico"
      });
    }
    
    showReward(`+${amount} puntos: ${reason || 'Buen trabajo'} 🌟`);
  };

  // Enhanced UNIFIED unlockAchievement function with progress tracking
  const unlockAchievement = (achievementIdOrObject, increment = 0) => {
    if (!gamificationEnabled) return;
    
    // Handle case when passing an achievement ID (string)
    if (typeof achievementIdOrObject === 'string') {
      const achievementId = achievementIdOrObject;
      
      setAchievements(prev => {
        const updated = prev.map(a => {
          if (a.id !== achievementId) return a;
          
          // Achievement found
          if (a.unlocked) return a; // Already unlocked, no change
          
          // If it has progress tracking
          if (a.maxProgress !== undefined) {
            const newProgress = increment > 0 ? 
              Math.min(a.progress + increment, a.maxProgress) : 
              a.progress;
              
            // Check if achievement should be unlocked
            if (newProgress >= a.maxProgress) {
              // Award points for unlocking
              setTimeout(() => {
                awardPoints(
                  a.points, 
                  `¡Logro desbloqueado: ${a.title}! +${a.points} pts`
                );
                showRandomEncouragement();
              }, 0);
              
              return { ...a, progress: newProgress, unlocked: true, viewed: false };
            }
            
            // Update progress but not unlocked yet
            return { ...a, progress: newProgress };
          }
          
          // Simple achievement without progress tracking
          setTimeout(() => {
            awardPoints(
              a.points, 
              `¡Logro desbloqueado: ${a.title}! +${a.points} pts`
            );
            showRandomEncouragement();
          }, 0);
          
          return { ...a, unlocked: true, viewed: false };
        });
        
        // Update category statistics
        setTimeout(() => updateCategoryStats(updated), 0);
        
        return updated;
      });
      
      return;
    }
    
    // Handle case when passing an achievement object
    const achievement = achievementIdOrObject;
    if (!achievements.some(a => a.id === achievement.id)) {
      setAchievements(prev => {
        const newAchievements = [...prev, { ...achievement, unlocked: true, viewed: false }];
        return newAchievements;
      });
      
      showReward(`¡Nuevo logro! ${achievement.title || achievement.name} 🏆`);
      awardPoints(achievement.points || 25, `Logro: ${achievement.title || achievement.name}`);
    }
  };

  // Enhanced complete task with streak tracking
  const completeTask = () => {
    if (!gamificationEnabled) return;
    
    awardPoints(25, "¡Tarea completada! +25 pts");
    
    // Update completed tasks counter
    setCompletedTasks(prev => {
      const newCount = prev + 1;
      
      // Check for task-related achievements
      if (newCount === 1) {
        unlockAchievement("firstTask");
      }
      
      // Update progress for task count achievements
      unlockAchievement("tasks10", 1);
      unlockAchievement("tasks50", 1);
      
      return newCount;
    });
    
    // Update task streak
    const today = new Date().toDateString();
    if (lastTaskDate && lastTaskDate !== today) {
      const lastDate = new Date(lastTaskDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastDate.toDateString() === yesterday.toDateString()) {
        // Consecutive day with task completion
        setTaskStreak(prev => {
          const newStreak = prev + 1;
          
          // Update streak achievement progress
          unlockAchievement("taskStreak5", 1);
          
          if (newStreak === 5) {
            showReward("¡5 días seguidos completando tareas! 🔥");
          }
          
          return newStreak;
        });
      } else {
        // Reset streak - tasks weren't completed yesterday
        setTaskStreak(1);
      }
    } else if (!lastTaskDate) {
      // First task ever
      setTaskStreak(1);
    }
    
    // Update last task date
    setLastTaskDate(today);
    
    // Occasional encouragement (20% chance)
    if (Math.random() < 0.2) {
      showRandomEncouragement();
    }
  };

  // Enhanced challenge completion
  const completeChallenge = async () => {
    if (!gamificationEnabled || !dailyChallenge || dailyChallenge.completed) return;
    
    try {
      const response = await fetch('/api/gamification/complete-challenge', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setDailyChallenge({
          ...dailyChallenge,
          completed: true
        });
        
        // Add points earned from challenge
        setPoints(prevPoints => prevPoints + (data.pointsEarned || 0));
        
        return data;
      }
    } catch (error) {
      console.error('Error completing challenge:', error);
    }
  };
  
  // New function to create a note and track achievements
  const createNote = () => {
    if (!gamificationEnabled) return;
    
    setNotesCount(prev => {
      const newCount = prev + 1;
      
      // Award points for creating a note
      awardPoints(15, "¡Nueva nota creada! +15 pts");
      
      // Check for note-related achievements
      if (newCount === 1) {
        unlockAchievement("firstNote");
      }
      
      // Update progress for note count achievements
      unlockAchievement("notes10", 1);
      
      return newCount;
    });
  };
  
  // New function to add calendar event and track achievements
  const addCalendarEvent = () => {
    if (!gamificationEnabled) return;
    
    setEventsCount(prev => {
      const newCount = prev + 1;
      
      // Award points for adding an event
      awardPoints(20, "¡Evento añadido al calendario! +20 pts");
      
      // Check for calendar-related achievements
      if (newCount === 1) {
        unlockAchievement("firstEvent");
      }
      
      // Update progress for event count achievements
      unlockAchievement("events10", 1);
      
      return newCount;
    });
  };
  
  // Function to get achievement progress percentage
  const getAchievementProgress = (achievementId) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || !achievement.maxProgress) return 0;
    return (achievement.progress / achievement.maxProgress) * 100;
  };

  // Mark an achievement as viewed
  const viewAchievement = (achievementId) => {
    setAchievements(prev => 
      prev.map(achievement => 
        achievement.id === achievementId ? { ...achievement, viewed: true } : achievement
      )
    );
  };

  // Toggle gamification mode
  const toggleGamification = async (enabled) => {
    try {
      const response = await fetch('/api/gamification/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });
      
      if (response.ok) {
        setGamificationEnabled(enabled);
      }
    } catch (error) {
      console.error('Error toggling gamification:', error);
    }
  };
  
  // Reset all progress
  const resetProgress = () => {
    setPoints(0);
    setLevel(1);
    setAchievements(ACHIEVEMENTS);
    setStreakDays(0);
    setCompletedTasks(0);
    
    // Forzar guardado después del reseteo
    setTimeout(saveCurrentState, 0);
    
    showReward('¡Progreso reiniciado! Comienzas de nuevo 🔄');
  };
  
  // Import progress from JSON string
  const importProgress = (data) => {
    try {
      const importedData = JSON.parse(data);
      if (importedData.points !== undefined && importedData.achievements !== undefined) {
        setPoints(importedData.points);
        setLevel(Math.floor(importedData.points / 100) + 1);
        setAchievements(importedData.achievements);
        
        setTimeout(saveCurrentState, 0);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al importar datos:", error);
      return false;
    }
  };
  
  // Export progress to JSON string
  const exportProgress = () => {
    return JSON.stringify({
      points,
      achievements,
      streakDays,
      completedTasks,
      level
    });
  };

  // Check streak achievements
  useEffect(() => {
    if (streakDays >= 3) {
      unlockAchievement("streak3");
    }
    
    if (streakDays >= 7) {
      unlockAchievement("streak7");
    }
  }, [streakDays]);

  // Show random encouragement message
  const showRandomEncouragement = () => {
    const message = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
    setEncouragementMessage(message);
    
    // Clear message after 10 seconds
    setTimeout(() => {
      setEncouragementMessage("");
    }, 10000);
  };
  
  // Update achievement categories statistics
  const updateCategoryStats = (currentAchievements) => {
    const updatedCategories = { ...achievementCategories };
    
    // Reset unlock counts
    Object.keys(updatedCategories).forEach(key => {
      updatedCategories[key].unlocked = 0;
    });
    
    // Count unlocked achievements by category
    currentAchievements.forEach(achievement => {
      if (achievement.unlocked && updatedCategories[achievement.category]) {
        updatedCategories[achievement.category].unlocked++;
      }
    });
    
    setAchievementCategories(updatedCategories);
  };

  return (
    <GamificationContext.Provider 
      value={{ 
        gamificationEnabled, 
        points, 
        level, 
        achievements, 
        recentReward,
        streakDays,
        lastLogin,
        dailyChallenge,
        completedTasks,
        awardPoints,
        completeTask,
        completeChallenge,
        unlockAchievement,
        viewAchievement,
        toggleGamification,
        resetProgress,
        importProgress,
        exportProgress,
        isInitialized,
        taskStreak,
        completedChallenges,
        notesCount,
        eventsCount,
        encouragementMessage,
        achievementCategories,
        createNote,
        addCalendarEvent,
        getAchievementProgress
      }}
    >
      {children}
      
      {/* Sistema de respaldo automático */}
      <GamificationBackupSystem />
    </GamificationContext.Provider>
  );
}

// Componente para manejar respaldos automáticos
function GamificationBackupSystem() {
  const { points, achievements, isInitialized } = useContext(GamificationContext);
  
  // Crea respaldos automáticos cuando el usuario cierra la página
  useEffect(() => {
    if (!isInitialized) return;
    
    const handleBeforeUnload = () => {
      try {
        const backupData = {
          version: STORAGE_VERSION,
          enabled: true,
          points,
          level: Math.floor(points / 100) + 1,
          achievements,
          syncTime: new Date().toISOString(),
          deviceId: localStorage.getItem(DEVICE_ID_KEY)
        };
        
        sessionStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
      } catch (error) {
        console.error("Error al crear respaldo automático:", error);
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isInitialized, points, achievements]);
  
  return null; // Este componente no renderiza nada
}

export function useGamification() {
  return useContext(GamificationContext);
}
