import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import LoadingScreen from '../components/LoadingScreen';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect based on authentication status
  useEffect(() => {
    if (status === 'authenticated') {
      // If logged in, redirect to dashboard
      router.push('/dashboard');
    } else if (status === 'unauthenticated') {
      // If not logged in, redirect to login
      router.push('/login');
    }
    // If status is 'loading', wait for it to resolve
  }, [status, router]);

  // Show loading screen while determining redirect
  return <LoadingScreen message="Cargando..." />;
}