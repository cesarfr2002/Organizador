import { useEffect, useState } from 'react';
import { useGamification } from '../context/GamificationContext';

export default function RewardNotification() {
  const { recentReward, gamificationEnabled } = useGamification();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (recentReward && gamificationEnabled) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [recentReward]);
  
  if (!recentReward || !gamificationEnabled) return null;
  
  return (
    <div 
      className={`fixed bottom-4 right-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg shadow-lg transition-all duration-300 flex items-center ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'}`}
    >
      <div className="mr-3 text-2xl animate-bounce">🎮</div>
      <div>{recentReward}</div>
    </div>
  );
}
