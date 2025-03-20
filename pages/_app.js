import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { NotificationProvider } from '../context/NotificationContext';
import { useEffect } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css'; // This will import Tailwind
import Head from 'next/head';
import { GamificationProvider } from '../context/GamificationContext';
import RewardNotification from '../components/RewardNotification';
import GamificationStatus from '../components/GamificationStatus';
import { ToastContainer } from 'react-toastify';
import { AutoScheduleProvider } from '../context/AutoScheduleContext';
import { AuthProvider } from '../context/AuthContext';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Registrar el service worker para PWA
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
    <SessionProvider session={session}>
      <ThemeProvider attribute="class">
        <AuthProvider>
          <GamificationProvider>
            <NotificationProvider>
              <AutoScheduleProvider>
                <Head>
                  {/* Título por defecto - será sobrescrito por las páginas individuales */}
                  <title>UniOrganizer</title>
                  <meta name="application-name" content="UniOrganizer" />
                  <meta name="apple-mobile-web-app-capable" content="yes" />
                  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                  <meta name="apple-mobile-web-app-title" content="UniOrganizer" />
                  <meta name="description" content="Organizador personal para estudiantes universitarios" />
                  <meta name="format-detection" content="telephone=no" />
                  <meta name="mobile-web-app-capable" content="yes" />
                  <meta name="theme-color" content="#3f51b5" />
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
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp;
