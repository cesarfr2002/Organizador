import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Verificar si el usuario está autenticado en la carga inicial
  useEffect(() => {
    async function loadUserFromCookies() {
      try {
        // Intentar cargar datos básicos del usuario del localStorage primero (más rápido)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        
        // Ahora verificar con el servidor
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          // Si hay error, limpiar usuario y localStorage
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    }

    loadUserFromCookies();
  }, []);

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      console.log('Iniciando solicitud de login a la API personalizada');
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Respuesta recibida de la API:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error al iniciar sesión');
      }
      
      const data = await res.json();
      console.log('Datos de usuario recibidos:', !!data.user);
      
      if (!data.user) {
        throw new Error('No se recibieron datos de usuario');
      }
      
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      return true;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await fetch('/api/auth/logout');
      setUser(null);
      localStorage.removeItem('user');
      router.push('/login');
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export const useAuth = () => useContext(AuthContext);
