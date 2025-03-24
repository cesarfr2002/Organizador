import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      console.log("Starting login process...");
      
      // CRITICAL FIX: Add explicit callbackUrl to prevent URL construction errors
      try {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
          // Add the explicit callbackUrl using window.location
          callbackUrl: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard',
        });
        
        console.log("SignIn result:", result);
        
        if (!result) {
          throw new Error("Authentication service unavailable");
        }
        
        if (result.error) {
          setError('Credenciales inválidas. Por favor, intenta de nuevo.');
          console.error("Login error:", result.error);
        } else {
          // Successful login - redirect to dashboard
          console.log("Login successful, redirecting...");
          router.push('/dashboard');
        }
      } catch (signInError) {
        console.error("SignIn process error:", signInError);
        // Check if this is URL construction error
        if (signInError instanceof TypeError && signInError.message.includes('URL')) {
          console.error("URL construction error. Using fallback method...");
          
          // CRITICAL FIX: Fallback to direct navigation if signIn fails with URL error
          try {
            // Try a simpler approach as fallback
            window.location.href = "/api/auth/callback/credentials?email=" + 
              encodeURIComponent(email) + "&password=" + encodeURIComponent(password);
            return; // Exit early as we're navigating away
          } catch (fallbackError) {
            console.error("Fallback navigation failed:", fallbackError);
            setError('Error de autenticación. Por favor contacte al administrador.');
          }
        } else {
          setError('Error en el proceso de autenticación. Por favor, intenta de nuevo.');
        }
      }
    } catch (generalError) {
      console.error("General login error:", generalError);
      setError('Ocurrió un error durante el inicio de sesión. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <Head>
        <title>Iniciar Sesión | UniOrganizer</title>
      </Head>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Iniciar Sesión</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 dark:text-gray-300">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Recordarme
              </label>
            </div>
            <div className="text-sm">
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isLoading}
          >
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
