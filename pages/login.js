import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Head from 'next/head';

export default function Login() {
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('password'); // 'password' o 'profile'
  const [error, setError] = useState('');
  const { login, selectProfile } = useAuth();
  const router = useRouter();
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const success = await login(password);
    if (success) {
      setStep('profile');
    } else {
      setError('Contraseña incorrecta');
    }
  };
  
  const handleProfileSelect = async (profile) => {
    await selectProfile(profile);
    
    // Redirigir a la página solicitada o a la página principal
    const callbackUrl = router.query.callbackUrl || '/';
    router.push(callbackUrl);
  };
  
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
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}
              
              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Continuar
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => handleProfileSelect('cesar')}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  César
                </button>
                <button
                  onClick={() => handleProfileSelect('leo')}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
