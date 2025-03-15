import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import { Chart, registerables } from 'chart.js';
import AcademicGanttChart from '../../components/AcademicGanttChart';

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
  const [tasks, setTasks] = useState([]);
  const [showAllTasks, setShowAllTasks] = useState(false);
  
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

      // Obtener tareas para el diagrama Gantt
      try {
        const tasksRes = await fetch('/api/tasks');
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setTasks(tasksData);
        } else {
          console.error('Error fetching tasks for Gantt chart');
        }
      } catch (error) {
        console.error('Error fetching tasks for Gantt chart:', error);
        // Configuración de datos de muestra para el desarrollo
        setTasks([
          {
            _id: '1',
            title: 'Examen Final de Programación',
            type: 'examen',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 semanas después
            priority: 'Alta',
            subject: { name: 'Programación', color: '#4CAF50' },
            completed: false
          },
          {
            _id: '2',
            title: 'Proyecto Base de Datos',
            type: 'proyecto',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 días después
            priority: 'Alta',
            subject: { name: 'Base de Datos', color: '#2196F3' },
            completed: false
          },
          {
            _id: '3',
            title: 'Presentación Redes',
            type: 'presentación',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 días después
            priority: 'Media',
            subject: { name: 'Redes', color: '#9C27B0' },
            completed: false
          },
          {
            _id: '4',
            title: 'Ejercicios Matemáticas',
            type: 'tarea',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 días después
            priority: 'Baja',
            subject: { name: 'Matemáticas', color: '#FF5722' },
            completed: false
          }
        ]);
      }
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

      {/* Nueva sección de visualización Gantt */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Visualización Gantt de Proyectos Académicos</h2>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showAllTasks}
              onChange={() => setShowAllTasks(!showAllTasks)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span className="ml-2 text-gray-700">Mostrar todas las tareas</span>
          </label>
        </div>
        
        <AcademicGanttChart tasks={tasks} showAllTasks={showAllTasks} />
        
        <div className="mt-4 bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
          <p className="flex items-start">
            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              El diagrama Gantt muestra la programación y duración de proyectos y exámenes importantes.
              Marca la casilla para incluir todas las tareas y ver posibles solapamientos en tu calendario académico.
            </span>
          </p>
        </div>
      </div>
    </Layout>
  );
}
