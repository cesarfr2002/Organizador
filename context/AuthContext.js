import { createContext, useState, useEffect, useContext } from 'react';
import netlifyIdentity from 'netlify-identity-widget';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializar Netlify Identity
    netlifyIdentity.init();
    
    // Establecer usuario actual si existe
    const currentUser = netlifyIdentity.currentUser();
    setUser(currentUser);
    setLoading(false);
    
    // Configurar listeners
    netlifyIdentity.on('login', (user) => {
      setUser(user);
      netlifyIdentity.close();
    });
    
    netlifyIdentity.on('logout', () => {
      setUser(null);
    });
    
    // Cleanup function
    return () => {
      netlifyIdentity.off('login');
      netlifyIdentity.off('logout');
    };
  }, []);

  const login = async () => {
    netlifyIdentity.open('login');
    return new Promise((resolve) => {
      const onLogin = (user) => {
        netlifyIdentity.off('login', onLogin);
        resolve(user);
      };
      netlifyIdentity.on('login', onLogin);
    });
  };

  const logout = async () => {
    netlifyIdentity.logout();
    return Promise.resolve();
  };

  const register = async () => {
    netlifyIdentity.open('signup');
    return new Promise((resolve) => {
      const onSignup = (user) => {
        netlifyIdentity.off('signup', onSignup);
        resolve(user);
      };
      netlifyIdentity.on('signup', onSignup);
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
