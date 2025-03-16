import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { useGamification } from '../../context/GamificationContext';
import { useTheme } from '../../utils/ThemeContext';
import { toast } from 'react-toastify';
import { useAutoSchedule } from '../../context/AutoScheduleContext'; // Add this import

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { gamificationEnabled, toggleGamification } = useGamification();
  const { theme, setTheme } = useTheme();
  const { autoScheduleEnabled, toggleAutoSchedule } = useAutoSchedule(); // Add this line
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  // Fixed function to toggle dark mode
  const handleToggleDarkMode = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast.success(`Modo ${newTheme === 'light' ? 'claro' : 'oscuro'} activado`);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Contraseña actualizada correctamente');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsChangingPassword(false);
      } else {
        toast.error(data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      toast.error('Error al cambiar la contraseña');
    }
  };

  if (status === 'loading') {
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
        <title>Configuración | UniOrganizer</title>
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de navegación */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 border-b dark:border-gray-600">
              <h3 className="font-medium dark:text-white">Navegación</h3>
            </div>
            <div className="divide-y dark:divide-gray-700">
              <Link href="/settings" legacyBehavior>
                <a className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">General</a>
              </Link>
              <Link href="/settings/gamification" legacyBehavior>
                <a className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Gamificación</a>
              </Link>
              <Link href="/settings/profile" legacyBehavior>
                <a className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Perfil</a>
              </Link>
              <Link href="/auto-schedule" legacyBehavior>
                <a className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Auto Programación</a>
              </Link>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3 space-y-6">
          {/* Configuración de apariencia */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Apariencia</h2>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 dark:text-gray-200">Modo oscuro</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={theme === 'dark'} 
                  onChange={handleToggleDarkMode} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          {/* Configuración de auto programación */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Auto Programación</h2>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-gray-700 dark:text-gray-200">Programar tareas automáticamente</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Asigna automáticamente tus tareas pendientes a los horarios libres entre clases
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoScheduleEnabled} 
                  onChange={toggleAutoSchedule} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
              <p className="font-medium mb-2">¿Cómo funciona?</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Analiza tu horario de clases y encuentra bloques de tiempo libre</li>
                <li>Excluye 2 horas antes y después de clases como tiempo de traslado</li>
                <li>Asigna automáticamente tareas pendientes según su prioridad y duración estimada</li>
                <li>Muestra sugerencias de agenda para aprovechar mejor tu tiempo</li>
              </ul>
              <p className="mt-2">
                <Link href="/auto-schedule" legacyBehavior>
                  <a className="text-blue-600 dark:text-blue-400 hover:underline">Ver mis horarios sugeridos</a>
                </Link>
              </p>
            </div>
          </div>
          
          {/* Configuración de gamificación */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-white">Gamificación</h2>
              <Link href="/settings/gamification" legacyBehavior>
                <a className="text-blue-600 dark:text-blue-400 text-sm hover:underline">Ver detalles</a>
              </Link>
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 dark:text-gray-200">Activar sistema de recompensas</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={gamificationEnabled} 
                  onChange={toggleGamification} 
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
          
          {/* Cambio de contraseña */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Seguridad</h2>
            
            {!isChangingPassword ? (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Cambiar contraseña
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    required
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    required
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    required
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}