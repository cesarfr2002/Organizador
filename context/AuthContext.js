import { createContext, useState, useEffect, useContext } from 'react';
import netlifyIdentity from 'netlify-identity-widget';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  console.log('AuthProvider initializing...');
  console.log('ENV:', process.env.NODE_ENV);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext useEffect running');
    // Inicializar Netlify Identity
    netlifyIdentity.init();
    console.log('Netlify Identity initialized');
    
    // Establecer usuario actual si existe
    const currentUser = netlifyIdentity.currentUser();
    console.log('Current user from Netlify Identity:', currentUser);
    setUser(currentUser);
    setLoading(false);
    
    // Configurar listeners
    netlifyIdentity.on("login", (user) => {
      console.log('Login event triggered, user:', user);
      setUser(user);
      netlifyIdentity.close();
    });
    
    netlifyIdentity.on("logout", () => {
      console.log('Logout event triggered');
      setUser(null);
    });
    
    // Cleanup function
    return () => {
      console.log('AuthContext cleanup running');
      netlifyIdentity.off("login");
      netlifyIdentity.off("logout");
    };
  }, []);

  const login = async () => {
    console.log('Login function called');
    netlifyIdentity.open("login");
    return new Promise((resolve) => {
      const onLogin = (user) => {
        console.log('Login callback received user:', user);
        netlifyIdentity.off("login", onLogin);
        resolve(user);
      };
      netlifyIdentity.on("login", onLogin);
    });
  };

  const logout = async () => {
    console.log('Logout function called');
    netlifyIdentity.logout();
    return Promise.resolve();
  };

  const register = async () => {
    console.log('Register function called');
    netlifyIdentity.open("signup");
    return new Promise((resolve) => {
      const onSignup = (user) => {
        console.log('Signup callback received user:', user);
        netlifyIdentity.off("signup", onSignup);
        resolve(user);
      };
      netlifyIdentity.on("signup", onSignup);
    });
  };

  console.log('AuthContext rendering with user:', user);
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
