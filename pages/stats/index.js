import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import Head from 'next/head';
import { toast } from 'react-toastify';

export default function StatisticsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [isAuthenticated, router]);

  const fetchStats = async () => {
    try {
      // Fetch statistics data
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        throw new Error('Error loading statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Error loading statistics');
    } finally {
      setLoading(false);
    }
  };

  // Rest of component...

  return (
    <Layout>
      {/* Component JSX */}
    </Layout>
  );
}

export async function getServerSideProps({ req, res }) {
  const cookies = req.headers.cookie || '';
  const hasAuthCookie = cookies.includes('uorganizer_auth_token=');
  
  if (!hasAuthCookie) {
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
