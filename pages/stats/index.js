import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import { Chart, registerables } from 'chart.js';

// Registrar todos los controladores de Chart.js
Chart.register(...registerables);

export default function Statistics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    completionRate: 0,
    totalNotes: 0,
    totalSubjects: 0
  });
  const [tasksBySubject, setTasksBySubject] = useState([]);
  const [tasksByPriority, setTasksByPriority] = useState([]);
  
  // Referencias para los gráficos
  const completionChartRef = useRef(null);
  const subjectChartRef = useRef(null);
  const priorityChartRef = useRef(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status]);

  useEffect(() => {
    if (!loading) {
      initCompletionChart();
      initSubjectChart();
      initPriorityChart();
    }
  }, [loading]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Obtener estadísticas generales
      const resStats = await fetch('/api/stats/general');
      const generalStats = await resStats.json();
      
      // Obtener estadísticas por asignatura
      const resSubjects = await fetch('/api/stats/by-subject');
      const subjectsData = await resSubjects.json();
      
      // Obtener estadísticas por prioridad
      const resPriority = await fetch('/api/stats/by-priority');
      const priorityData = await resPriority.json();
      
      setStats(generalStats);
      setTasksBySubject(subjectsData);
      setTasksByPriority(priorityData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error al cargar las estadísticas');
      
      // Datos de ejemplo para desarrollo
      setStats({
        totalTasks: 25,
        completedTasks: 18,
        pendingTasks: 7,
        completionRate: 72, // porcentaje de completación
        totalNotes: 12,
        totalSubjects: 5
      });
      
      setTasksBySubject([
        { name: 'Programación', completed: 5, pending: 2 },
        { name: 'Matemáticas', completed: 4, pending: 1 },
        { name: 'Base de Datos', completed: 3, pending: 2 },
        { name: 'Redes', completed: 4, pending: 1 },
        { name: 'Inglés', completed: 2, pending: 1 }
      ]);
      
      setTasksByPriority([
        { priority: 'Alta', count: 8 },
        { priority: 'Media', count: 12 },
        { priority: 'Baja', count: 5 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const initCompletionChart = () => {
    const ctx = document.getElementById('completionChart');
    if (ctx && completionChartRef.current) {
      completionChartRef.current.destroy();
    }
    
    if (ctx) {
      completionChartRef.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Completadas', 'Pendientes'],
          datasets: [{
            data: [stats.completedTasks, stats.pendingTasks],
            backgroundColor: ['#4CAF50', '#FF5722'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
  };

  const initSubjectChart = () => {
    const ctx = document.getElementById('subjectChart');
    if (ctx && subjectChartRef.current) {
      subjectChartRef.current.destroy();
    }
    
    if (ctx) {
      const labels = tasksBySubject.map(item => item.name);
      const completedData = tasksBySubject.map(item => item.completed);
      const pendingData = tasksBySubject.map(item => item.pending);
      
      subjectChartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Completadas',
              data: completedData,
              backgroundColor: '#4CAF50',
              barPercentage: 0.7
            },
            {
              label: 'Pendientes',
              data: pendingData,
              backgroundColor: '#FF5722',
              barPercentage: 0.7
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: false,
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  };

  const initPriorityChart = () => {
    const ctx = document.getElementById('priorityChart');
    if (ctx && priorityChartRef.current) {
      priorityChartRef.current.destroy();
    }
    
    if (ctx) {
      const labels = tasksByPriority.map(item => item.priority);
      const data = tasksByPriority.map(item => item.count);
      const colors = ['#F44336', '#FF9800', '#4CAF50']; // Rojo (alta), amarillo (media), verde (baja)
      
      priorityChartRef.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Estadísticas | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Estadísticas</h1>
        <p className="text-gray-600 mt-2">
          Resumen de tu desempeño académico y productividad
        </p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5 flex flex-col">
          <span className="text-sm text-gray-500">Tareas Totales</span>
          <span className="text-2xl font-bold mt-1">{stats.totalTasks}</span>
          <div className="flex justify-between mt-4 text-sm">
            <span className="text-green-600">{stats.completedTasks} completadas</span>
            <span className="text-red-600">{stats.pendingTasks} pendientes</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex flex-col">
          <span className="text-sm text-gray-500">Tasa de Completitud</span>
          <span className="text-2xl font-bold mt-1">{stats.completionRate}%</span>
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500"
              style={{ width: `${stats.completionRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex flex-col">
          <span className="text-sm text-gray-500">Total de Notas</span>
          <span className="text-2xl font-bold mt-1">{stats.totalNotes}</span>
        </div>

        <div className="bg-white rounded-lg shadow p-5 flex flex-col">
          <span className="text-sm text-gray-500">Asignaturas</span>
          <span className="text-2xl font-bold mt-1">{stats.totalSubjects}</span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de tareas completadas vs pendientes */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold mb-4">Estado de Tareas</h2>
          <div className="h-64">
            <canvas id="completionChart"></canvas>
          </div>
        </div>

        {/* Gráfico de tareas por asignatura */}
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Tareas por Asignatura</h2>
          <div className="h-64">
            <canvas id="subjectChart"></canvas>
          </div>
        </div>

        {/* Gráfico de tareas por prioridad */}
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-3">
          <h2 className="text-lg font-semibold mb-4">Distribución por Prioridad</h2>
          <div className="h-64">
            <canvas id="priorityChart"></canvas>
          </div>
        </div>
      </div>
    </Layout>
  );
}
