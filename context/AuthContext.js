import { createContext, useState, useEffect, useContext } from 'react';

// Create a variable for netlifyIdentity that will be initialized when available
let netlifyIdentity;

// Safe import of netlify-identity-widget
try {
  // Dynamic import to prevent build errors
  netlifyIdentity = require('netlify-identity-widget');
  console.log('Successfully imported netlify-identity-widget');
} catch (error) {
  console.error('Failed to import netlify-identity-widget:', error);
  // Create a mock implementation for netlifyIdentity
  netlifyIdentity = {
    init: () => console.log('Mock init called'),
    currentUser: () => null,
    on: (event, callback) => console.log(`Mock on(${event}) called`),
    off: (event, callback) => console.log(`Mock off(${event}) called`),
    open: (type) => console.log(`Mock open(${type}) called`),
    close: () => console.log('Mock close called'),
    logout: () => console.log('Mock logout called')
  };
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  console.log('AuthProvider initializing...');
  console.log('ENV:', process.env.NODE_ENV);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext useEffect running');
    try {
      // Inicializar Netlify Identity
      netlifyIdentity.init();
      console.log('Netlify Identity initialized');
      
      // Establecer usuario actual si existe
      const currentUser = netlifyIdentity.currentUser();
      console.log('Current user from Netlify Identity:', currentUser);
      setUser(currentUser);
      
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
    } catch (error) {
      console.error('Error in Netlify Identity setup:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async () => {
    console.log('Login function called');
    try {
      netlifyIdentity.open("login");
      return new Promise((resolve) => {
        const onLogin = (user) => {
          console.log('Login callback received user:', user);
          netlifyIdentity.off("login", onLogin);
          resolve(user);
        };
        netlifyIdentity.on("login", onLogin);
      });
    } catch (error) {
      console.error('Error during login:', error);
      return null;
    }
  };

  const logout = async () => {
    console.log('Logout function called');
    try {
      netlifyIdentity.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    return Promise.resolve();
  };

  const register = async () => {
    console.log('Register function called');
    try {
      netlifyIdentity.open("signup");
      return new Promise((resolve) => {
        const onSignup = (user) => {
          console.log('Signup callback received user:', user);
          netlifyIdentity.off("signup", onSignup);
          resolve(user);
        };
        netlifyIdentity.on("signup", onSignup);
      });
    } catch (error) {
      console.error('Error during registration:', error);
      return null;
    }
  };

  console.log('AuthContext rendering with user:', user);
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
