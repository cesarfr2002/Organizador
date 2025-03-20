import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import NotificationList from '../components/notifications/NotificationList';
import { useNotifications } from '../context/NotificationContext';
import { Tab } from '@headlessui/react';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './api/auth/[...nextauth]';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
  const [selectedTab, setSelectedTab] = useState(0);
  const { unreadCount } = useNotifications();
  const { user, isAuthenticated } = useAuth();
  
  const handleTabChange = (index) => {
    setSelectedTab(index);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [user, isAuthenticated]);

  // Mostrar pantalla de carga si la sesión se está verificando
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Notificaciones | Organizador</title>
      </Head>
      
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Notificaciones</h1>
        
        <div className="mb-6">
          <Tab.Group selectedIndex={selectedTab} onChange={handleTabChange}>
            <Tab.List className="flex space-x-1 rounded-md bg-gray-100 p-1">
              <Tab
                className={({ selected }) =>
                  `w-full rounded-md py-2.5 text-sm font-medium leading-5 transition-colors
                  ${selected
                    ? 'bg-white shadow text-gray-800'
                    : 'text-gray-600 hover:bg-white/[0.3] hover:text-gray-700'
                  }`
                }
              >
                Todas
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-md py-2.5 text-sm font-medium leading-5 transition-colors
                  ${selected
                    ? 'bg-white shadow text-gray-800'
                    : 'text-gray-600 hover:bg-white/[0.3] hover:text-gray-700'
                  }`
                }
              >
                No leídas {unreadCount > 0 && `(${unreadCount})`}
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-4">
              <Tab.Panel>
                <NotificationList filter="all" />
              </Tab.Panel>
              <Tab.Panel>
                <NotificationList filter="unread" />
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: {}
  };
}
