import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';

export default function ProfileSettings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    university: '',
    career: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (status === 'authenticated' && session?.user) {
      setProfileData({
        name: session.user.name || '',
        email: session.user.email || '',
        university: session.user.university || '',
        career: session.user.career || ''
      });
    }
  }, [status, session]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Perfil actualizado correctamente');
      } else {
        toast.error(data.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      toast.error('Error al actualizar el perfil');
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
        <title>Perfil | UniOrganizer</title>
      </Head>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de navegación */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 border-b dark:border-gray-600">
              <h3 className="font-medium dark:text-white">Navegación</h3>
            </div>
            <div className="divide-y dark:divide-gray-700">
              <Link href="/settings" legacyBehavior>
                <a className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">General</a>
              </Link>
              <Link href="/settings/gamification" legacyBehavior>
                <a className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200">Gamificación</a>
              </Link>
              <Link href="/settings/profile" legacyBehavior>
                <a className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200">Perfil</a>
              </Link>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Información Personal</h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={true}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  El correo electrónico no se puede cambiar
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Universidad
                </label>
                <input
                  type="text"
                  value={profileData.university}
                  onChange={(e) => setProfileData({...profileData, university: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Carrera
                </label>
                <input
                  type="text"
                  value={profileData.career}
                  onChange={(e) => setProfileData({...profileData, career: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-white">Avatar</h2>
            
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-gray-400 dark:text-gray-500">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              
              <div>
                <button
                  type="button"
                  className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm"
                >
                  Cambiar avatar
                </button>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Formatos aceptados: JPG, PNG. Máximo 1MB.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
