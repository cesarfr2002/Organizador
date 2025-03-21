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
    // Contraseñas hardcodeadas para asegurar que funciona
    // Esto es temporal y debería cambiarse en producción
    const validPasswords = ["ara2000"];
    
    console.log('Contraseña ingresada:', password);
    console.log('Contraseñas válidas:', validPasswords);
    
    // Verificar si la contraseña está en nuestro array de contraseñas válidas
    if (validPasswords.includes(password)) {
      console.log('Contraseña correcta!');
      return true;
    }
    
    // También probar con la variable de entorno como respaldo
    if (password === process.env.NEXT_PUBLIC_AUTH_PASSWORD) {
      console.log('Contraseña correcta mediante variable de entorno!');
      return true;
    }
    
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
