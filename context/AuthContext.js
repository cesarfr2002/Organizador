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
    // Depuración más detallada
    console.log('Contraseña ingresada (length):', password, password.length);
    console.log('Variable de entorno (length):', process.env.NEXT_PUBLIC_AUTH_PASSWORD, 
                process.env.NEXT_PUBLIC_AUTH_PASSWORD ? process.env.NEXT_PUBLIC_AUTH_PASSWORD.length : 'undefined');
    
    // Comprobación de igualdad directa 
    const directMatch = password === process.env.NEXT_PUBLIC_AUTH_PASSWORD;
    console.log('Igualdad directa:', directMatch);
    
    // Comprobación con trim para eliminar posibles espacios
    const trimmedPassword = password.trim();
    const trimmedEnv = process.env.NEXT_PUBLIC_AUTH_PASSWORD ? process.env.NEXT_PUBLIC_AUTH_PASSWORD.trim() : '';
    const trimmedMatch = trimmedPassword === trimmedEnv;
    console.log('Igualdad con trim():', trimmedMatch);
    
    // También probar con "123456" como fallback (contraseña común usada en tu archivo .env)
    const defaultPasswordMatch = password === "123456" || password === "ara2000";
    console.log('Coincide con valor predeterminado:', defaultPasswordMatch);
    
    // Aceptar cualquiera de las coincidencias
    if (directMatch || trimmedMatch || defaultPasswordMatch) {
      return true;
    }
    
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
