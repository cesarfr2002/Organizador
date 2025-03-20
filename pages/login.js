import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { signIn } from 'next-auth/react';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const { user, login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    console.log('Login page loaded');
    console.log('Environment in login page:', process.env.NODE_ENV);
    console.log('NEXTAUTH_URL in login page:', process.env.NEXT_PUBLIC_NEXTAUTH_URL);
    
    // Check if we already have a user
    console.log('Current user in login page:', user);
    if (user) {
      console.log('User already logged in, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleNetlifyLogin = async () => {
    console.log('Starting Netlify login process');
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Calling login function');
      const user = await login();
      console.log('Login result:', user);
      
      if (user) {
        console.log('Login successful, redirecting...');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextAuthLogin = async () => {
    console.log('Starting NextAuth login process');
    setIsLoading(true);
    setError('');
    
    try {
      console.log('NextAuth credentials config:', {
        callbackUrl: router.query.callbackUrl || '/dashboard',
        redirect: true
      });
      
      const result = await signIn('credentials', {
        redirect: false,
        // Add your credentials here
      });
      
      console.log('NextAuth login result:', result);
      
      if (result?.error) {
        console.error('NextAuth error:', result.error);
        setError(result.error);
      } else if (result?.url) {
        console.log('NextAuth redirect URL:', result.url);
        router.push(result.url);
      }
    } catch (error) {
      console.error('NextAuth exception:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Head>
        <title>Login - Organizador Universitario</title>
      </Head>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <button
          onClick={handleNetlifyLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 mb-4"
        >
          {isLoading ? 'Cargando...' : 'Ingresar con Netlify Identity'}
        </button>
        
        <p className="text-center text-gray-500 text-sm mt-6">
          ¿No tienes una cuenta?{' '}
          <button
            onClick={register}
            className="text-blue-600 hover:underline"
          >
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
}
