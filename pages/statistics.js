import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function StatisticsRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/stats');
  }, []);
  
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}
