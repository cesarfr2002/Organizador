import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { NotificationProvider } from '../context/NotificationContext';
import { useEffect, Component } from 'react';
import 'tailwindcss/tailwind.css';
import '@tailwindcss/typography'; // Asegúrate de que esto esté instalado y configurado
import 'react-toastify/dist/ReactToastify.css';
import '../styles/globals.css';
import Head from 'next/head';
import { GamificationProvider } from '../context/GamificationContext';
import RewardNotification from '../components/RewardNotification';
import GamificationStatus from '../components/GamificationStatus';
import { ToastContainer } from 'react-toastify';
import { AutoScheduleProvider } from '../context/AutoScheduleContext';

// Custom error boundary component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Algo salió mal</h2>
            <p className="text-gray-700 mb-4">Lo sentimos, ha ocurrido un error inesperado.</p>
            <p className="text-sm text-gray-500 mb-4">
              Detalles técnicos: {this.state.error?.message || 'Error desconocido'}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
              </AutoScheduleProvider>
            </NotificationProvider>
          </ThemeProvider>
        </GamificationProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
