import React from 'react';
import { useRouter } from 'next/router';
import { useNotifications } from '../../context/NotificationContext';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme as useNextTheme } from 'next-themes';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const NotificationItem = ({ notification, onClose }) => {
  const router = useRouter();
  const { markAsRead, deleteNotification } = useNotifications();
  const { theme } = useNextTheme();
  const isDark = theme === 'dark';
  
  // Seleccionar icono según el tipo de notificación
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'task':
        return <CheckCircleIcon className="h-6 w-6 text-indigo-500" />;
      case 'event':
        return <CalendarIcon className="h-6 w-6 text-blue-500" />;
      case 'achievement':
        return <AcademicCapIcon className="h-6 w-6 text-purple-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };
  
  // Formatear fecha relativa
  const formatDate = (date) => {
    const dateObj = new Date(date);
    
    if (isToday(dateObj)) {
      return `Hoy, ${format(dateObj, 'HH:mm')}`;
    }
    if (isYesterday(dateObj)) {
      return `Ayer, ${format(dateObj, 'HH:mm')}`;
    }
    if (isThisWeek(dateObj)) {
      return format(dateObj, "EEEE, HH:mm", { locale: es });
    }
    return format(dateObj, "d 'de' MMMM", { locale: es });
  };
  
  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification._id);
    }
    
    if (notification.link || notification.relatedItemId) {
      if (notification.link) {
        router.push(notification.link);
      } else if (notification.relatedItemId) {
        // Navegar según el modelo relacionado
        switch (notification.relatedItemModel) {
          case 'Task':
            router.push(`/tasks/${notification.relatedItemId}`);
            break;
          case 'Subject':
            router.push(`/subjects/${notification.relatedItemId}`);
            break;
          case 'Event':
            router.push(`/calendar?event=${notification.relatedItemId}`);
            break;
          case 'Note':
            router.push(`/notes/${notification.relatedItemId}`);
            break;
          default:
            break;
        }
      }
      
      if (onClose) onClose();
    }
  };
  
  const handleDelete = async (e) => {
    e.stopPropagation();
    await deleteNotification(notification._id);
  };
  
  return (
    <div 
      className={`p-4 flex items-start cursor-pointer ${
        !notification.read 
          ? isDark ? 'bg-blue-900/30' : 'bg-blue-50' 
          : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mr-3">
        {getIcon()}
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <h4 className={`text-sm font-medium ${
            !notification.read 
              ? isDark ? 'text-white' : 'text-gray-900' 
              : isDark ? 'text-gray-200' : 'text-gray-700'
          }`}>
            {notification.title}
          </h4>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatDate(notification.createdAt)}
          </span>
        </div>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          {notification.message}
        </p>
      </div>
      <button 
        onClick={handleDelete}
        className={`ml-2 p-1 rounded-full ${
          isDark 
            ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
        aria-label="Eliminar"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};

export default NotificationItem;
