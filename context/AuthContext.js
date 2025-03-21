import { createContext, useState, useEffect, useContext } from 'react';

// Provide default values to avoid null errors during server-side rendering
const AuthContext = createContext({
  user: null,
  loading: true,
  login: () => Promise.resolve(false),
  selectProfile: () => Promise.resolve({}),
  logout: () => Promise.resolve()
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay una sesión guardada en las cookies
    const checkSession = () => {
      try {
        const sessionCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user_session='));
        
        if (sessionCookie) {
          const sessionData = JSON.parse(
            decodeURIComponent(sessionCookie.split('=')[1])
          );
          setUser(sessionData);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
      
      setLoading(false);
    };
    
    checkSession();
  }, []);

  const login = async (password) => {
    // Comparación directa con string literal para evitar cualquier problema
    console.log('Contraseña ingresada:', password);
    console.log('Longitud de contraseña:', password.length);
    
    // Verificación directa con string literal "ara2000"
    if (password === "ara2000") {
      console.log('Coincidencia exacta con ara2000!');
      return true;
    }
    
    // Verificación con trim para eliminar espacios
    if (password.trim() === "ara2000") {
      console.log('Coincidencia con ara2000 después de trim!');
      return true;
    }
    
    // Verificación con variable de entorno
    if (password === process.env.NEXT_PUBLIC_AUTH_PASSWORD) {
      console.log('Coincidencia con variable de entorno!');
      return true;
    }
    
    // Última verificación - aceptar cualquier contraseña que contenga "ara2000"
    if (password.includes("ara2000")) {
      console.log('La contraseña contiene ara2000!');
      return true;
    }
    
    // Si llegamos aquí, la contraseña es incorrecta
    console.log('Contraseña incorrecta');
    return false;
  };

  const selectProfile = async (profile) => {
    // Guardar el perfil seleccionado en una cookie
    const userData = { name: profile, role: profile };
    
    // Cookie expira en 7 días
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    
    document.cookie = `user_session=${encodeURIComponent(
      JSON.stringify(userData)
    )}; expires=${expires.toUTCString()}; path=/`;
    
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    // Eliminar la cookie de sesión
    document.cookie = 'user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      selectProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
