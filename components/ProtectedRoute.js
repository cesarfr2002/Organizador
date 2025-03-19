import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated && router.pathname !== '/login' && router.pathname !== '/register') {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Mientras verificamos la autenticación, mostrar una pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  // Si el usuario no está autenticado y no estamos en login/register, no mostrar nada
  if (!isAuthenticated && router.pathname !== '/login' && router.pathname !== '/register') {
    return null;
  }

  // Si el usuario está autenticado o estamos en una página pública, mostrar el contenido
  return <>{children}</>;
};

export default ProtectedRoute;
