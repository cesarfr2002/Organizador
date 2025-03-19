import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { toast } from 'react-toastify';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [credentials, setCredentials] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  // Use useEffect for browser-only code
  useEffect(() => {
    // Now this will only run on the client side
    console.log('===== LOGIN COMPONENT DIAGNOSTICS =====');
    console.log('Login component loaded');
    console.log('Window location:', window.location.origin);
    console.log('Full URL:', window.location.href);
    console.log('Router pathname:', router.pathname);
    console.log('Router query:', router.query);
    
    // Browser and environment info for debugging
    console.log('User agent:', navigator.userAgent);
    console.log('Browser cookies enabled:', navigator.cookieEnabled);
    console.log('Document referrer:', document.referrer);
    
    // Add environment variable checks back
    console.log('ENV check - NEXTAUTH_URL exists:', !!process.env.NEXTAUTH_URL);
    console.log('ENV check - NEXTAUTH_URL value:', process.env.NEXTAUTH_URL);
    console.log('ENV check - MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('ENV check - DEBUG exists:', !!process.env.DEBUG);
    console.log('ENV check - NEXT_PUBLIC_APP_URL value:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('===== END LOGIN DIAGNOSTICS =====');
  }, [router.pathname, router.query]);

  // Redirigir si ya está autenticado
  if (status === 'authenticated') {
    router.push('/');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (isLogin) {
      try {
        console.log('===== LOGIN ATTEMPT DIAGNOSTICS =====');
        console.log('Login attempt started');
        console.log('Form data:', { 
          email: credentials.email, 
          password: '***', 
          passwordLength: credentials.password.length 
        });
        console.log('Current pathname:', window.location.pathname);
        console.log('Current URL:', window.location.href);
        
        const result = await signIn('credentials', {
          redirect: false,
          email: credentials.email,
          password: credentials.password,
        });
        
        console.log('SignIn result full object:', JSON.stringify(result, null, 2));
        console.log('Authentication error:', result?.error);
        console.log('Authentication successful:', result?.ok);
        console.log('Callback URL:', result?.url);
        console.log('===== END LOGIN ATTEMPT DIAGNOSTICS =====');
        
        if (result?.error) {
          toast.error(result.error || 'Error al iniciar sesión');
          setLoading(false);
        } else if (result?.ok) {
          toast.success('Inicio de sesión exitoso');
          router.push('/');
        } else {
          toast.error('Error desconocido al iniciar sesión');
          setLoading(false);
        }
      } catch (error) {
        console.error('===== LOGIN ERROR DIAGNOSTICS =====');
        console.error('Error during sign in:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('===== END LOGIN ERROR DIAGNOSTICS =====');
        toast.error('Error al conectar con el servidor de autenticación');
        setLoading(false);
      }
    } else {
      // Registrar nuevo usuario
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          toast.success('Cuenta creada con éxito. Iniciando sesión...');
          await signIn('credentials', {
            redirect: false,
            email: credentials.email,
            password: credentials.password,
          });
          router.push('/');
        } else {
          toast.error(data.error || 'Error al crear la cuenta');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error al registrar:', error);
        toast.error('Error al crear la cuenta');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>{isLogin ? "Iniciar sesión - UniOrganizer" : "Registrarse - UniOrganizer"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            UniOrganizer
          </h1>
          <h2 className="mt-2 text-center text-xl font-bold text-gray-900">
            {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea una nueva cuenta'}
          </h2>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={credentials.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={credentials.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={credentials.password}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : isLogin ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
