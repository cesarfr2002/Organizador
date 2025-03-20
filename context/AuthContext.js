import { createContext, useState, useEffect, useContext } from 'react';

// Create the context with a default value
const AuthContext = createContext({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  register: () => {}
});

export function AuthProvider({ children }) {
  console.log('AuthProvider initializing...');
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [netlifyIdentity, setNetlifyIdentity] = useState(null);

  // Load Netlify Identity only on the client side
  useEffect(() => {
    console.log('AuthContext useEffect running - Loading Netlify Identity widget');
    
    // Check if we're on the client-side
    if (typeof window === 'undefined') {
      console.log('Server-side rendering detected, skipping Netlify Identity initialization');
      setLoading(false);
      return;
    }
    
    // Safer approach to import
    const loadNetlifyIdentity = async () => {
      try {
        // Use require with a direct assignment to prevent class instantiation issues
        const netlifyIdentityModule = await import('netlify-identity-widget');
        const identity = netlifyIdentityModule.default;
        
        console.log('Successfully imported netlify-identity-widget');
        
        // Store the identity object in state
        setNetlifyIdentity(identity);
        
        // Initialize after setting to state
        identity.init({
          APIUrl: process.env.NEXT_PUBLIC_NETLIFY_URL || 'https://uorganizer.netlify.app/.netlify/identity'
        });
        
        console.log('Netlify Identity initialized');
        
        // Set current user if exists
        const currentUser = identity.currentUser();
        console.log('Current user from Netlify Identity:', currentUser);
        setUser(currentUser);
        
        // Configure listeners
        identity.on("login", (user) => {
          console.log('Login event triggered, user:', user);
          setUser(user);
          identity.close();
        });
        
        identity.on("logout", () => {
          console.log('Logout event triggered');
          setUser(null);
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading Netlify Identity:', error);
        setLoading(false);
      }
    };
    
    loadNetlifyIdentity();
      
    // Cleanup function
    return () => {
      console.log('AuthContext cleanup running');
      if (netlifyIdentity) {
        netlifyIdentity.off("login");
        netlifyIdentity.off("logout");
      }
    };
  }, []);

  const login = async () => {
    if (!netlifyIdentity) {
      console.error('Netlify Identity not loaded');
      return null;
    }
    
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
    if (!netlifyIdentity) {
      console.error('Netlify Identity not loaded');
      return;
    }
    
    console.log('Logout function called');
    try {
      netlifyIdentity.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    }
    return Promise.resolve();
  };

  const register = async () => {
    if (!netlifyIdentity) {
      console.error('Netlify Identity not loaded');
      return null;
    }
    
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
