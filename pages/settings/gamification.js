import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Head from 'next/head';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useGamification } from '../../context/GamificationContext';

export default function GamificationSettings() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { 
    gamificationEnabled, 
    toggleGamification, 
    points, 
    level, 
    achievements,
    resetProgress,
    importProgress,
    exportProgress
  } = useGamification();
  
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const exportLinkRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleResetProgress = () => {
    if (confirm('¿Estás seguro de querer reiniciar todo tu progreso? Esta acción no se puede deshacer.')) {
      resetProgress();
      toast.success('Progreso reiniciado correctamente');
    }
  };
  
  const handleExportProgress = () => {
    try {
      const data = exportProgress();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const downloadLink = exportLinkRef.current;
      downloadLink.href = url;
      downloadLink.download = `gamification-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadLink.click();
      
      URL.revokeObjectURL(url);
      toast.success('Datos exportados correctamente');
    } catch (error) {
      console.error("Error al exportar datos:", error);
      toast.error('Error al exportar datos');
    }
  };
  
  const handleImportProgress = () => {
    if (!importText.trim()) {
      toast.error('No hay datos para importar');
      return;
    }
    
    if (confirm('¿Estás seguro de importar estos datos? Reemplazará tu progreso actual.')) {
      const success = importProgress(importText);
      if (success) {
        toast.success('Datos importados correctamente');
        setImportText('');
        setShowImport(false);
        // Recargar la página para mostrar los nuevos datos
        router.reload();
      } else {
        toast.error('Error al importar datos. Formato inválido.');
      }
    }
  };
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        setImportText(event.target.result);
      } catch (error) {
        console.error("Error al leer archivo:", error);
        toast.error('Error al leer archivo');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Layout>
      <Head>
        <title>Gamificación | UniOrganizer</title>
      </Head>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar de navegación */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gray-50 p-4 border-b">
              <h3 className="font-medium">Navegación</h3>
            </div>
            <div className="divide-y">
              <Link href="/settings" legacyBehavior>
                <a className="block px-4 py-3 hover:bg-gray-50">General</a>
              </Link>
              <Link href="/settings/gamification" legacyBehavior>
                <a className="block px-4 py-3 hover:bg-gray-50 bg-blue-50 text-blue-700">Gamificación</a>
              </Link>
              <Link href="/settings/profile" legacyBehavior>
                <a className="block px-4 py-3 hover:bg-gray-50">Perfil</a>
              </Link>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Sistema de Recompensas</h2>
              
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
            
            <p className="text-gray-600 mb-4 dark:text-gray-300">
              El sistema de gamificación te ayuda a mantenerte motivado y productivo al otorgarte puntos y logros por completar tareas y crear notas.
            </p>

            {gamificationEnabled && (
              <div className="mt-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Nivel actual</h3>
                    <span className="text-xl font-bold text-blue-700">{level}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Puntos</h3>
                    <span className="text-xl font-bold text-blue-700">{points}</span>
                  </div>

                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${(points % 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-right mt-1 text-gray-500">
                    {points % 100}/100 para el siguiente nivel
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3">Acciones que otorgan puntos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <span className="text-blue-500 font-semibold mr-2">+5</span>
                        <span>Revisar notas</span>
                      </div>
                      <p className="text-sm text-gray-500">Puntos por visitar la sección de notas</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <span className="text-blue-500 font-semibold mr-2">+10</span>
                        <span>Crear una nueva nota</span>
                      </div>
                      <p className="text-sm text-gray-500">Puntos por iniciar la creación de notas</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <span className="text-blue-500 font-semibold mr-2">+3</span>
                        <span>Leer una nota</span>
                      </div>
                      <p className="text-sm text-gray-500">Puntos por revisar contenido existente</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center mb-1">
                        <span className="text-blue-500 font-semibold mr-2">+2</span>
                        <span>Filtrar y organizar</span>
                      </div>
                      <p className="text-sm text-gray-500">Puntos por usar los filtros de búsqueda</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-2">Logros desbloqueados</h3>
                  {achievements.length === 0 ? (
                    <p className="text-gray-500 italic">Aún no has desbloqueado logros</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {achievements.map(achievement => (
                        <div 
                          key={achievement.id} 
                          className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start"
                        >
                          <div className="text-2xl mr-2">{achievement.icon}</div>
                          <div>
                            <h4 className="font-semibold">{achievement.name}</h4>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="mt-8 border-t pt-4">
                  <button
                    onClick={handleResetProgress}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Reiniciar progreso de gamificación
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Agregar sección de sincronización */}
          {gamificationEnabled && (
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 dark:text-white">
              <h2 className="text-xl font-semibold mb-4">Sincronización y Respaldos</h2>
              
              <p className="text-gray-600 mb-4 dark:text-gray-300">
                Aquí puedes exportar o importar tu progreso de gamificación para respaldarlo o sincronizarlo entre dispositivos.
              </p>
              
              <div className="space-y-4">
                <div>
                  <button
                    onClick={handleExportProgress}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm"
                  >
                    Exportar mi progreso
                  </button>
                  <a ref={exportLinkRef} className="hidden"></a>
                  <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">
                    Guarda tu progreso en un archivo para respaldarlo
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  {!showImport ? (
                    <button
                      onClick={() => setShowImport(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400"
                    >
                      Importar progreso desde archivo
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                          Seleccionar archivo de respaldo
                        </label>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileUpload}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0 file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                            dark:file:bg-gray-700 dark:file:text-blue-300"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">
                          O pegar datos de respaldo
                        </label>
                        <textarea
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          rows={4}
                          className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          placeholder='{"points": 0, "achievements": []}'
                        ></textarea>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={handleImportProgress}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                          disabled={!importText.trim()}
                        >
                          Importar datos
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowImport(false);
                            setImportText('');
                          }}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <button
                    onClick={handleResetProgress}
                    className="text-red-600 hover:text-red-800 text-sm font-medium dark:text-red-400"
                  >
                    Reiniciar progreso de gamificación
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  const cookies = req.headers.cookie || '';
  const hasAuthCookie = cookies.includes('uorganizer_auth_token=');
  
  if (!hasAuthCookie) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: {}
  };
}
