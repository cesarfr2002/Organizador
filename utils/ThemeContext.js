import React, { createContext, useContext } from 'react';
import { useTheme as useNextTheme } from 'next-themes';

// Crear un contexto con valores predeterminados
const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
});

// Este proveedor ya no es necesario ya que usamos el de next-themes
// Lo mantenemos por compatibilidad con componentes existentes
export const ThemeProvider = ({ children }) => {
  const { theme, setTheme } = useNextTheme();
  
  // Convertir a formato esperado por componentes antiguos
  const isDarkMode = theme === 'dark';
  const toggleDarkMode = () => setTheme(isDarkMode ? 'light' : 'dark');
  
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Este hook ahora es un adaptador que utiliza next-themes internamente
export function useTheme() {
  // Para componentes que acceden directamente a useTheme de next-themes
  if (typeof window !== 'undefined') {
    try {
      // Intentar obtener el contexto normal
      const context = useContext(ThemeContext);
      
      // Si el contexto no está disponible, crear un adaptador sobre la marcha
      if (!context || Object.keys(context).length === 0) {
        const { theme, setTheme } = useNextTheme();
        const isDarkMode = theme === 'dark';
        const toggleDarkMode = () => setTheme(isDarkMode ? 'light' : 'dark');
        
        return { isDarkMode, toggleDarkMode };
      }
      
      return context;
    } catch (error) {
      console.warn('ThemeContext fallback:', error);
      // Devolver valores por defecto si todo falla
      return { isDarkMode: false, toggleDarkMode: () => {} };
    }
  }
  
  // Valores predeterminados para SSR
  return { isDarkMode: false, toggleDarkMode: () => {} };
}
