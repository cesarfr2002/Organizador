import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function AuthError() {
  const router = useRouter();
  const [errorDetails, setErrorDetails] = useState({
    error: '',
    description: '',
  });
  
  useEffect(() => {
    // Extract error details from URL parameters
    if (router.query.error) {
      setErrorDetails({
        error: router.query.error,
        description: router.query.error_description || 'No additional details available',
      });
    }
  }, [router.query]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-12">
      <Head>
        <title>Error de Autenticación | UniOrganizer</title>
      </Head>
      
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="mt-3 text-xl font-semibold text-gray-900">Error de autenticación</h1>
          
          <div className="mt-4">
            {errorDetails.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <p className="text-sm text-red-700 font-medium">{errorDetails.error}</p>
                {errorDetails.description && (
                  <p className="text-xs text-red-600 mt-1">{errorDetails.description}</p>
                )}
              </div>
            )}
            
            <div className="text-gray-600 mt-6 text-sm">
              <p>Ocurrió un error durante el proceso de autenticación. Por favor intenta nuevamente o contacta soporte si el problema persiste.</p>
            </div>
            
            <div className="mt-6">
              <Link href="/login" className="inline-block w-full px-4 py-2 bg-blue-600 text-white rounded-md text-center hover:bg-blue-700">
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
