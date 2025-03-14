import { useEffect, useState } from 'react';
import { useGamification } from '../context/GamificationContext';

export default function GamificationStatus() {
  const { gamificationEnabled, isInitialized } = useGamification();
  const [syncStatus, setSyncStatus] = useState('sincronizado');
  const [showStatus, setShowStatus] = useState(false);
  
  useEffect(() => {
    if (!gamificationEnabled || !isInitialized) return;
    
    // Verificar estado de conexión y sincronización
    const checkSyncStatus = () => {
      if (!navigator.onLine) {
        setSyncStatus('offline');
      } else {
        // Verificar si hay datos almacenados localmente
        try {
          if (localStorage.getItem('gamificationSettings')) {
            setSyncStatus('sincronizado');
          } else {
            setSyncStatus('no sincronizado');
          }
        } catch (error) {
          console.error("Error al verificar sincronización:", error);
          setSyncStatus('error');
        }
      }
    };
    
    // Ejecutar al iniciar y cuando cambia el estado de conexión
    checkSyncStatus();
    
    window.addEventListener('online', () => {
      setSyncStatus('sincronizado');
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    });
    
    window.addEventListener('offline', () => {
      setSyncStatus('offline');
      setShowStatus(true);
    });
    
    // También verificar periódicamente
    const interval = setInterval(checkSyncStatus, 60000);
    
    return () => {
      window.removeEventListener('online', checkSyncStatus);
      window.removeEventListener('offline', checkSyncStatus);
      clearInterval(interval);
    };
  }, [gamificationEnabled, isInitialized]);
  
  if (!gamificationEnabled || !showStatus) return null;
  
  return (
    <div className={`fixed bottom-4 left-4 px-3 py-1 rounded-md text-xs font-medium transition-opacity duration-300 ${
      syncStatus === 'sincronizado' ? 'bg-green-100 text-green-800' :
      syncStatus === 'offline' ? 'bg-yellow-100 text-yellow-800' :
      'bg-red-100 text-red-800'
    }`}>
      {syncStatus === 'sincronizado' && '✓ Progreso guardado'}
      {syncStatus === 'offline' && '⚠️ Modo sin conexión'}
      {syncStatus === 'no sincronizado' && '❌ Error al guardar progreso'}
      {syncStatus === 'error' && '❌ Error de sincronización'}
    </div>
  );
}
