import { useState, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar todos los controladores de Chart.js
Chart.register(...registerables);

export default function DashboardStats() {
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksPending: 0,
    upcomingExams: 0,
    totalSubjects: 0,
    currentStreak: 0, // Días consecutivos de actividad
    weeklyProgress: 0, // Progreso semanal en porcentaje
    studyGoals: { achieved: 0, total: 0 } // Objetivos de estudio
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('week'); // 'week' | 'month' | 'semester'
  
  // Fechas de la semana actual para mostrar en el título
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }); // Domingo
  const weekDateRange = `${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd, 'dd MMM', { locale: es })}`;

  useEffect(() => {
    fetchStats();
  }, [activeTab]); // Recargar cuando cambie la pestaña activa

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Usar la API real con el período adecuado
      const res = await fetch(`/api/dashboard/stats?period=${activeTab}`);
      
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLoading(false);
        initCharts();
      } else {
        throw new Error('Error al obtener estadísticas');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Si falla la API, usar datos de respaldo mínimos
      setStats({
        tasksCompleted: 0,
        tasksPending: 0,
        upcomingExams: 0,
        totalSubjects: 0,
        currentStreak: 0,
        weeklyProgress: 0,
        studyGoals: { achieved: 0, total: 0 }
      });
      setLoading(false);
    }
  };

  const initCharts = () => {
    initProductivityChart();
    initSubjectProgressChart();
  };

  const initProductivityChart = async () => {
    const chartElement = document.getElementById('productivityChart');
    if (!chartElement) return;
    
    const chartInstance = Chart.getChart(chartElement);
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    try {
      // Obtener datos reales para el gráfico de productividad
      const res = await fetch(`/api/dashboard/productivity?period=${activeTab}`);
      const data = await res.json();
      
      new Chart(chartElement, {
        type: 'bar',
        data: {
          labels: data.labels || ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          datasets: [
            {
              label: 'Horas de estudio',
              data: data.studyHours || [],
              backgroundColor: 'rgba(54, 162, 235, 0.7)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            },
            {
              label: 'Tareas completadas',
              data: data.completedTasks || [],
              backgroundColor: 'rgba(75, 192, 192, 0.7)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Cantidad'
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading productivity chart data:', error);
      // Manejar error de gráfico - podríamos mostrar un mensaje o un gráfico vacío
    }
  };
  
  const initSubjectProgressChart = async () => {
    const chartElement = document.getElementById('subjectProgressChart');
    if (!chartElement) return;
    
    const chartInstance = Chart.getChart(chartElement);
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    try {
      // Obtener datos reales para el progreso por asignatura
      const res = await fetch('/api/dashboard/subject-progress');
      const data = await res.json();
      
      new Chart(chartElement, {
        type: 'radar',
        data: {
          labels: data.labels || [],
          datasets: [{
            label: 'Progreso (%)',
            data: data.progress || [],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointBackgroundColor: data.colors || [],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20
              }
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    } catch (error) {
      console.error('Error loading subject progress data:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="bg-gray-200 h-28 rounded-lg"></div>
          ))}
        </div>
        <div className="bg-gray-200 h-64 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Selector de periodo */}
      <div className="flex border-b mb-4">
        <button 
          onClick={() => setActiveTab('week')}
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'week'
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Esta semana
        </button>
        <button 
          onClick={() => setActiveTab('month')}
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'month'
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Este mes
        </button>
        <button 
          onClick={() => setActiveTab('semester')}
          className={`px-4 py-3 text-sm font-medium ${
            activeTab === 'semester'
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Semestre
        </button>
      </div>
      
      {/* Stats Cards */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tareas Completadas</p>
                <p className="text-2xl font-bold">{stats.tasksCompleted}</p>
              </div>
              <div className="bg-blue-500 rounded-full p-2 text-white">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tareas Pendientes</p>
                <p className="text-2xl font-bold">{stats.tasksPending}</p>
              </div>
              <div className="bg-red-500 rounded-full p-2 text-white">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Exámenes Próximos</p>
                <p className="text-2xl font-bold">{stats.upcomingExams}</p>
              </div>
              <div className="bg-amber-500 rounded-full p-2 text-white">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Racha Actual</p>
                <p className="text-2xl font-bold">{stats.currentStreak} días</p>
              </div>
              <div className="bg-green-500 rounded-full p-2 text-white">
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Gráfico de productividad */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Productividad {activeTab === 'week' ? 'semanal' : activeTab === 'month' ? 'mensual' : 'del semestre'}</h3>
            <div className="h-64">
              <canvas id="productivityChart"></canvas>
            </div>
          </div>
          
          {/* Gráfico de progreso por asignatura */}
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-semibold mb-2">Progreso por Asignatura</h3>
            <div className="h-64">
              <canvas id="subjectProgressChart"></canvas>
            </div>
          </div>
        </div>
        
        {/* Barra de progreso semanal */}
        <div className="mt-6 bg-white p-4 rounded-lg border">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Progreso {activeTab === 'week' ? 'semanal' : activeTab === 'month' ? 'mensual' : 'semestral'}</h3>
            <span className="text-sm font-medium text-gray-700">{stats.weeklyProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${stats.weeklyProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Objetivos: {stats.studyGoals.achieved}/{stats.studyGoals.total}</span>
            <span>Meta: 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
