import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';

export default function Login() {
  const { user, login } = useAuth();
  const router = useRouter();
  const { callbackUrl } = router.query;
  
  useEffect(() => {
    // Si el usuario ya está autenticado, redirigir a la página principal o callbackUrl
    if (user) {
      router.push(callbackUrl || '/');
    }
  }, [user, router, callbackUrl]);

  const handleLogin = async () => {
    try {
      await login();
      // La redirección ocurrirá automáticamente gracias al useEffect
    } catch (error) {
      console.error('Error de autenticación:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>Login - UniOrganizer</title>
      </Head>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">
          Iniciar Sesión - UniOrganizer
        </h1>
        
        <div className="flex flex-col space-y-4">
          <p className="text-center text-gray-600 dark:text-gray-300 mb-4">
            Usa tu cuenta de Netlify Identity para iniciar sesión en tu organizador universitario
          </p>
          
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-200"
          >
            Iniciar Sesión con Netlify
          </button>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}
