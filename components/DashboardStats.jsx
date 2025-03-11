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
      // En un caso real, pasaríamos parámetros según activeTab
      // const res = await fetch(`/api/dashboard/stats?period=${activeTab}`);
      
      // Simulamos datos diferentes según el periodo seleccionado
      setTimeout(() => {
        if (activeTab === 'week') {
          setStats({
            tasksCompleted: 12,
            tasksPending: 5,
            upcomingExams: 2,
            totalSubjects: 6,
            currentStreak: 4,
            weeklyProgress: 68,
            studyGoals: { achieved: 3, total: 5 }
          });
        } else if (activeTab === 'month') {
          setStats({
            tasksCompleted: 45,
            tasksPending: 8,
            upcomingExams: 5,
            totalSubjects: 6,
            currentStreak: 4,
            weeklyProgress: 72,
            studyGoals: { achieved: 12, total: 15 }
          });
        } else {
          setStats({
            tasksCompleted: 187,
            tasksPending: 14,
            upcomingExams: 8,
            totalSubjects: 6,
            currentStreak: 4,
            weeklyProgress: 85,
            studyGoals: { achieved: 24, total: 30 }
          });
        }
        
        setLoading(false);
        initCharts();
      }, 600);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const initCharts = () => {
    initProductivityChart();
    initSubjectProgressChart();
  };

  const initProductivityChart = () => {
    // Destruir gráfico existente si hay alguno
    const chartElement = document.getElementById('productivityChart');
    if (!chartElement) return;
    
    const chartInstance = Chart.getChart(chartElement);
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    // Datos de ejemplo para el gráfico - ahora con múltiples series
    const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    
    // Generamos datos simulados basados en la pestaña activa
    let studyData = [3, 2.5, 4, 3.5, 5, 1, 0];
    let taskCompletionData = [2, 3, 4, 1, 5, 2, 0];
    
    if (activeTab === 'month') {
      // Datos diferentes para vista mensual
      studyData = [
        3, 2.5, 4, 3.5, 5, 1, 0,
        2, 3, 3.5, 4, 4.5, 2, 0,
        2.5, 3, 4, 3, 4, 1.5, 0,
        3, 3.5, 4, 3, 4.5, 1, 0
      ];
      taskCompletionData = [
        2, 3, 4, 1, 5, 2, 0,
        3, 2, 4, 3, 4, 1, 0,
        2, 4, 3, 2, 3, 1, 0,
        3, 2, 3, 4, 3, 2, 0
      ];
      // Solo mostramos un subconjunto para vista mensual
      studyData = studyData.slice(0, 7);
      taskCompletionData = taskCompletionData.slice(0, 7);
    }
    
    new Chart(chartElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Horas de estudio',
            data: studyData,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Tareas completadas',
            data: taskCompletionData,
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
  };
  
  const initSubjectProgressChart = () => {
    const chartElement = document.getElementById('subjectProgressChart');
    if (!chartElement) return;
    
    const chartInstance = Chart.getChart(chartElement);
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    // Datos simulados de progreso por asignatura
    const subjectData = {
      labels: ['Programación', 'Matemáticas', 'Base de Datos', 'Redes', 'Inglés'],
      datasets: [{
        label: 'Progreso (%)',
        data: [85, 70, 60, 90, 75],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };
    
    new Chart(chartElement, {
      type: 'radar',
      data: subjectData,
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
    <div className="bg-white rounded-lg shadow-md">
      {/* Selector de periodo */}
      <div className="flex border-b">
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
      <div className="p-4">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Gráfico de productividad */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Productividad {activeTab === 'week' ? 'semanal' : activeTab === 'month' ? 'mensual' : 'del semestre'}</h3>
            <div className="h-64">
              <canvas id="productivityChart"></canvas>
            </div>
          </div>
          
          {/* Gráfico de progreso por asignatura */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Progreso por Asignatura</h3>
            <div className="h-64">
              <canvas id="subjectProgressChart"></canvas>
            </div>
          </div>
        </div>
        
        {/* Barra de progreso semanal */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Progreso semanal</h3>
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
