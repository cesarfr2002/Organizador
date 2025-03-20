import { useState, useEffect } from 'react';
import { useGamification } from '../context/GamificationContext';

export default function RewardNotification() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [points, setPoints] = useState(0);
  const { points: totalPoints } = useGamification();
  
  // This component will be enhanced later to show animations when points are earned
  // For now, it's just a placeholder to make the app build successfully
  
  return visible ? (
    <div className="fixed bottom-20 right-5 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white p-4 rounded-lg shadow-lg animate-bounce z-50">
      <div className="flex items-center">
        <div className="mr-3 text-yellow-200 text-2xl">⭐</div>
        <div>
          <div className="font-bold">{message}</div>
          <div className="text-sm">+{points} puntos</div>
        </div>
      </div>
    </div>
  ) : null;
}
