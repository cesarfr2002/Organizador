import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const auth = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    console.log('Login page loaded');
    console.log('Environment variables:', {
      NEXT_PUBLIC_NETLIFY_URL: process.env.NEXT_PUBLIC_NETLIFY_URL,
      NEXT_PUBLIC_NEXTAUTH_URL: process.env.NEXT_PUBLIC_NEXTAUTH_URL,
      NODE_ENV: process.env.NODE_ENV
    });
    
    // Check if user is already logged in
    if (auth?.user) {
      console.log('User already logged in, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [auth?.user, router]);

  const handleLogin = async () => {
    console.log('Starting login process');
    setIsLoading(true);
    setError('');
    
    try {
      if (!auth || !auth.login) {
        throw new Error('Authentication service not available');
      }
      
      console.log('Calling login function');
      const user = await auth.login();
      console.log('Login result:', user);
      
      if (user) {
        console.log('Login successful, redirecting...');
        router.push('/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    if (!auth || !auth.register) {
      setError('Registration service not available');
      return;
    }
    auth.register();
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
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 mb-4"
        >
          {isLoading ? 'Cargando...' : 'Ingresar con Netlify Identity'}
        </button>
        
        <p className="text-center text-gray-500 text-sm mt-6">
          ¿No tienes una cuenta?{' '}
          <button
            onClick={handleRegister}
            className="text-blue-600 hover:underline"
          >
            Regístrate
          </button>
        </p>
      </div>
    </div>
  );
}
