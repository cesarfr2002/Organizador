import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import UpcomingEvents from '../components/dashboard/UpcomingEvents';
import TaskSummary from '../components/dashboard/TaskSummary';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActions from '../components/dashboard/QuickActions';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    taskStats: { pending: 0, completed: 0, overdue: 0 },
    subjectStats: { count: 0, distribution: [] },
    upcomingEvents: { today: [], upcoming: [] },
    streak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        // Fetch task stats
        const taskResponse = await fetch('/api/dashboard/tasks');
        const taskData = await taskResponse.json();
        
        // Fetch subject stats
        const subjectResponse = await fetch('/api/dashboard/subjects');
        const subjectData = await subjectResponse.json();
        
        // Fetch upcoming events
        const eventResponse = await fetch('/api/dashboard/events');
        const eventData = await eventResponse.json();
        
        // Fetch user streak
        const userResponse = await fetch('/api/dashboard/user');
        const userData = await userResponse.json();
        
        setStats({
          taskStats: taskData,
          subjectStats: subjectData,
          upcomingEvents: eventData,
          streak: userData.streak || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  return (
    <ProtectedRoute>
      <Layout>
        <Head>
          <title>Dashboard | UniOrganizer</title>
        </Head>
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {user ? `Bienvenido, ${user.user_metadata?.full_name || user.email}` : 'Bienvenido a tu espacio personal'}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Link href="/settings" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                Configuración del perfil →
              </Link>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Quick actions */}
              <div className="col-span-1 md:col-span-2 lg:col-span-1">
                <QuickActions />
              </div>
              
              {/* Task summary */}
              <div className="col-span-1 lg:col-span-1">
                <TaskSummary stats={stats.taskStats} />
              </div>
              
              {/* Subject distribution */}
              <div className="col-span-1 md:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-full">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                    Distribución de asignaturas
                  </h2>
                  
                  {stats.subjectStats.count > 0 ? (
                    <div className="space-y-4">
                      {stats.subjectStats.distribution.map(subject => (
                        <div key={subject._id} className="flex items-center">
                          <div className="w-32 truncate text-sm text-gray-600 dark:text-gray-300">
                            {subject.name}
                          </div>
                          <div className="flex-1 ml-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${subject.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            {subject.percentage}%
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center py-6 text-gray-500 dark:text-gray-400">
                      No hay asignaturas registradas
                    </p>
                  )}
                </div>
              </div>
              
              {/* Upcoming events */}
              <div className="col-span-1 md:col-span-2 lg:col-span-2">
                <UpcomingEvents 
                  today={stats.upcomingEvents.today || []} 
                  upcoming={stats.upcomingEvents.upcoming || []} 
                />
              </div>
              
              {/* Recent activity */}
              <div className="col-span-1 md:col-span-2">
                <RecentActivity />
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}