import { useState, useEffect } from 'react';
import { Chart, registerables } from 'chart.js';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar todos los controladores de Chart.js
Chart.register(...registerables);

export default function DashboardStats() {
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksPending: 0,
    upcomingExams: 0,
    totalSubjects: 0
  });
  
  const [loading, setLoading] = useState(true);
  
  // Fechas de la semana actual para mostrar en el título
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Lunes
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 }); // Domingo
  const weekDateRange = `${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd, 'dd MMM', { locale: es })}`;

  useEffect(() => {
    // En un caso real, aquí se cargarían datos desde una API
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Simulamos una carga de datos
        setTimeout(() => {
          setStats({
            tasksCompleted: 12,
            tasksPending: 5,
            upcomingExams: 2,
            totalSubjects: 6
          });
          setLoading(false);
          
          // Inicializar gráfico de productividad después de cargar los datos
          initProductivityChart();
        }, 800);
        
        // En un caso real sería algo como:
        // const res = await fetch('/api/dashboard/stats');
        // const data = await res.json();
        // setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const initProductivityChart = () => {
    // Destruir gráfico existente si hay alguno
    const chartElement = document.getElementById('productivityChart');
    if (!chartElement) return;
    
    // Datos de ejemplo para el gráfico
    const data = {
      labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      datasets: [
        {
          label: 'Horas de estudio',
          data: [3, 2.5, 4, 3.5, 5, 1, 0],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    };
    
    new Chart(chartElement, {
      type: 'bar',
      data,
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Horas'
            }
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Productividad semanal'
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
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-500">Tareas Completadas</p>
          <p className="text-2xl font-bold">{stats.tasksCompleted}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-500">Tareas Pendientes</p>
          <p className="text-2xl font-bold">{stats.tasksPending}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-500">Exámenes Próximos</p>
          <p className="text-2xl font-bold">{stats.upcomingExams}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-500">Total Asignaturas</p>
          <p className="text-2xl font-bold">{stats.totalSubjects}</p>
        </div>
      </div>
      
      {/* Productivity Chart */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-2">Estadísticas de Estudio: {weekDateRange}</h3>
        <div className="h-64">
          <canvas id="productivityChart"></canvas>
        </div>
      </div>
    </>
  );
}
