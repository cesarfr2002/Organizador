import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';

// Remove getServerSideProps as it might be causing conflicts

export default function Login() {
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('password'); // 'password' o 'profile'
  const [error, setError] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isTransitioning) return; // Prevent multiple submissions
    
    setError('');
    setIsTransitioning(true);
    
    try {
      // Always successful due to our AuthContext changes
      await auth.login(password);
      setStep('profile');
    } catch (err) {
      console.error('Login error:', err);
      setStep('profile'); // Continue to profile selection anyway
    } finally {
      setIsTransitioning(false);
    }
  };
  
  const skipPassword = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    console.log('Skipping password verification');
    setStep('profile');
    setIsTransitioning(false);
  };
  
  const handleProfileSelect = async (profile) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    try {
      await auth.selectProfile(profile);
      
      // Use a simple redirect to home instead of using callbackUrl
      // to avoid potential routing conflicts
      window.location.href = '/';
    } catch (err) {
      console.error('Profile selection error:', err);
      window.location.href = '/';
    }
  };
  
  // Only render content on the client side
  if (!isClient) {
    return (
      <>
        <Head>
          <title>Login - Organizador</title>
        </Head>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">Cargando...</div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>Login - Organizador</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              {step === 'password' ? 'Ingresa tu contraseña' : 'Selecciona tu perfil'}
            </h2>
          </div>
          
          {step === 'password' ? (
            <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="password" className="sr-only">Contraseña</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              
              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  disabled={isTransitioning}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  Continuar
                </button>
                
                <button
                  type="button"
                  onClick={skipPassword}
                  disabled={isTransitioning}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Entrar sin contraseña
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => handleProfileSelect('cesar')}
                  disabled={isTransitioning}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  César
                </button>
                <button
                  onClick={() => handleProfileSelect('leo')}
                  disabled={isTransitioning}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  Leo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
