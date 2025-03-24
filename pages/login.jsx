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
      
      // Try the standard NextAuth approach first
      try {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        
        if (result && !result.error) {
          console.log("Login successful via NextAuth, redirecting...");
          router.push('/dashboard');
          return;
        }
        
        if (result && result.error) {
          console.error("NextAuth error:", result.error);
          setError('Credenciales inválidas. Por favor, intenta de nuevo.');
        }
      } catch (signInError) {
        console.error("SignIn process error:", signInError);
        
        // This is likely an infrastructure issue rather than invalid credentials
        // Try the direct API approach instead
        console.log("Trying direct login API...");
        
        try {
          const directLoginResult = await fetch('/api/auth/direct-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });
          
          const data = await directLoginResult.json();
          
          if (directLoginResult.ok && data.success) {
            console.log("Direct login successful, redirecting...");
            window.location.href = '/dashboard';
            return;
          } else {
            setError(data.message || 'Credenciales inválidas. Por favor, intenta de nuevo.');
          }
        } catch (directError) {
          console.error("Direct login error:", directError);
          setError('Error de conexión. Por favor intente más tarde.');
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
