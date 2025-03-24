import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { NotificationProvider } from '../context/NotificationContext';
import { useEffect } from 'react';
import '../styles/globals.css'; // This already imports Tailwind
import 'react-toastify/dist/ReactToastify.css';
import Head from 'next/head';
import { GamificationProvider } from '../context/GamificationContext';
import RewardNotification from '../components/RewardNotification';
import GamificationStatus from '../components/GamificationStatus';
import { ToastContainer } from 'react-toastify';
import { AutoScheduleProvider } from '../context/AutoScheduleContext';
import TaskNotificationChecker from '../components/TaskNotificationChecker';

// CRITICAL FIX: Ensure we use the correct base URL for the current environment
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
};

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Log client-side environment variables for debugging
  useEffect(() => {
    console.log("===== CLIENT-SIDE ENVIRONMENT VARIABLES =====");
    console.log("NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL || "Not set");
    console.log("NEXT_PUBLIC_API_URL:", process.env.NEXT_PUBLIC_API_URL || "Not set");
    console.log("Window Location:", window.location.href);
    console.log("============================================");
    
    // No need for overriding NextAuth fetch URL
  }, []);

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
    // Simple SessionProvider without any custom URL - let NextAuth handle this
    <SessionProvider session={session}>
      <GamificationProvider>
        <ThemeProvider attribute="class">
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
              <TaskNotificationChecker />
            </AutoScheduleProvider>
          </NotificationProvider>
        </ThemeProvider>
      </GamificationProvider>
    </SessionProvider>
  );
}

export default MyApp;
