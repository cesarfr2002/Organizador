import { ThemeProvider } from 'next-themes';
import { NotificationProvider } from '../context/NotificationContext';
import { useEffect } from 'react';
import 'tailwindcss/tailwind.css';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';
import Head from 'next/head';
import { GamificationProvider } from '../context/GamificationContext';
import RewardNotification from '../components/RewardNotification';
import GamificationStatus from '../components/GamificationStatus';
import { ToastContainer } from 'react-toastify';
import { AutoScheduleProvider } from '../context/AutoScheduleContext';
import { AuthProvider } from '../context/AuthContext';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  
  // Determine if this is a public page (login, register)
  const isPublicPage = router.pathname === '/login' || router.pathname === '/register';
  
  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(
          function(registration) {
            console.log('Service Worker registrado correctamente:', registration.scope);
          },
          function(err) {
            console.log('Service Worker falló al registrarse:', err);
          }
        );
      });
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider attribute="class">
        {/* Only include other providers for non-public pages or client-side */}
        {typeof window !== 'undefined' ? (
          <GamificationProvider>
            <NotificationProvider>
              <AutoScheduleProvider>
                <Head>
                  <meta charSet="utf-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1" />
                  <title>UniOrganizer</title>
                  <meta name="application-name" content="UniOrganizer" />
                  <meta name="apple-mobile-web-app-capable" content="yes" />
                  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                  <meta name="apple-mobile-web-app-title" content="UniOrganizer" />
                  <meta name="description" content="Organizador personal para estudiantes universitarios" />
                  <meta name="format-detection" content="telephone=no" />
                  <meta name="mobile-web-app-capable" content="yes" />
                  <meta name="theme-color" content="#000000" />
                  <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
                  <link rel="manifest" href="/manifest.json" />
                  <link rel="shortcut icon" href="/favicon.ico" />
                </Head>
                <Component {...pageProps} />
                <ToastContainer position="bottom-right" />
                <RewardNotification />
                <GamificationStatus />
              </AutoScheduleProvider>
            </NotificationProvider>
          </GamificationProvider>
        ) : (
          // Simplified structure for server-side rendering
          <>
            <Head>
              <meta charSet="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
              <title>UniOrganizer</title>
              <link rel="manifest" href="/manifest.json" />
              <link rel="shortcut icon" href="/favicon.ico" />
            </Head>
            <Component {...pageProps} />
          </>
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default MyApp;
