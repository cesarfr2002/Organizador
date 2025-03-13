import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head'; // Add this import
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';
import { useTheme } from '../../utils/ThemeContext';

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [appSettings, setAppSettings] = useState({
    theme: theme, // Use the current theme from context
    notificationsEnabled: true,
    emailNotifications: false,
    language: 'es'
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      fetchUserData();
      fetchAppSettings();
    }
  }, [status]);

  const fetchUserData = async () => {
    setLoading(true);
    
    try {
      // En una implementación real, obtendríamos más datos del usuario
      if (session?.user) {
        setProfileData(prev => ({
          ...prev,
          name: session.user.name || '',
          email: session.user.email || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Error al cargar datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  const fetchAppSettings = async () => {
    // For now, we're just setting the theme from the context
    setAppSettings(prev => ({
      ...prev,
      theme: theme
    })); 
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAppSettingsChange = (e) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? e.target.checked : e.target.value;
    
    setAppSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleThemeChange = () => {
    toggleTheme(); // This already updates localStorage and document classes via ThemeContext
    
    setAppSettings(prev => ({
      ...prev,
      theme: theme === 'light' ? 'dark' : 'light'
    }));
    
    toast.success('Tema cambiado correctamente');
    
    // No need to call saveAppSettings for theme changes
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Validar que las contraseñas coincidan
      if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error actualizando el perfil');
      }
      
      toast.success('Perfil actualizado correctamente');
      
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const saveAppSettings = async () => {
    setSaving(true);
    
    try {
      // We'll still save other settings except theme to the API
      const settingsToSave = {
        ...appSettings,
        // Don't include theme since it's managed by localStorage
      };
      
      const res = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsToSave)
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error guardando configuración');
      }
      
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving app settings:', error);
      toast.error(error.message || 'Error al guardar la configuración');
    } finally {
      setSaving(false);
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
        <title>Configuración | UniOrganizer</title>
      </Head>

      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Configuración</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Administra tu cuenta y preferencias de la aplicación
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil de Usuario */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 dark:text-white">Perfil de Usuario</h2>
            
            <form onSubmit={updateProfile}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="name">
                  Nombre
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <h3 className="text-lg font-medium mt-6 mb-3 dark:text-white">Cambiar Contraseña</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="currentPassword">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={profileData.currentPassword}
                  onChange={handleProfileChange}
                  className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="newPassword">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={profileData.newPassword}
                  onChange={handleProfileChange}
                  className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="confirmPassword">
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={profileData.confirmPassword}
                  onChange={handleProfileChange}
                  className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 px-4 py-2 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Configuración de la Aplicación */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 dark:text-white">Configuración de la Aplicación</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="theme">
                  Tema
                </label>
                <div className="flex items-center">
                  <span className="mr-3 text-sm text-gray-600 dark:text-gray-400">
                    {theme === 'light' ? 'Claro' : 'Oscuro'}
                  </span>
                  <button 
                    onClick={handleThemeChange}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                      theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className="sr-only">Toggle theme</span>
                    <span
                      className={`inline-block w-4 h-4 transform transition bg-white rounded-full ${
                        theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="language">
                  Idioma
                </label>
                <select
                  id="language"
                  name="language"
                  value={appSettings.language}
                  onChange={handleAppSettingsChange}
                  className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notificationsEnabled"
                  name="notificationsEnabled"
                  checked={appSettings.notificationsEnabled}
                  onChange={handleAppSettingsChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300" htmlFor="notificationsEnabled">
                  Habilitar notificaciones
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={appSettings.emailNotifications}
                  onChange={handleAppSettingsChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <label className="ml-2 block text-sm text-gray-900 dark:text-gray-300" htmlFor="emailNotifications">
                  Recibir notificaciones por correo
                </label>
              </div>
              
              <div className="pt-4">
                <button
                  type="button"
                  onClick={saveAppSettings}
                  disabled={saving}
                  className="bg-blue-600 px-4 py-2 text-white rounded hover:bg-blue-700 w-full disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
