import { createContext, useState, useEffect, useContext } from 'react';

// Only import Netlify Identity widget on the client side
let netlifyIdentity = null;

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
  console.log('ENV:', process.env.NODE_ENV);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [netlifyLoaded, setNetlifyLoaded] = useState(false);

  // Load Netlify Identity only on the client side
  useEffect(() => {
    console.log('AuthContext useEffect running - Loading Netlify Identity widget');
    
    // Check if we're on the client-side
    if (typeof window === 'undefined') {
      console.log('Server-side rendering detected, skipping Netlify Identity initialization');
      setLoading(false);
      return;
    }
    
    // Dynamically import Netlify Identity widget
    import('netlify-identity-widget')
      .then((module) => {
        netlifyIdentity = module.default;
        console.log('Successfully imported netlify-identity-widget');
        
        try {
          // Initialize Netlify Identity
          netlifyIdentity.init();
          console.log('Netlify Identity initialized');
          
          // Set current user if exists
          const currentUser = netlifyIdentity.currentUser();
          console.log('Current user from Netlify Identity:', currentUser);
          setUser(currentUser);
          
          // Configure listeners
          netlifyIdentity.on("login", (user) => {
            console.log('Login event triggered, user:', user);
            setUser(user);
            netlifyIdentity.close();
          });
          
          netlifyIdentity.on("logout", () => {
            console.log('Logout event triggered');
            setUser(null);
          });
          
          setNetlifyLoaded(true);
        } catch (error) {
          console.error('Error in Netlify Identity setup:', error);
        } finally {
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error('Failed to import netlify-identity-widget:', error);
        setLoading(false);
      });
      
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
    if (!netlifyIdentity || !netlifyLoaded) {
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
    if (!netlifyIdentity || !netlifyLoaded) {
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
    if (!netlifyIdentity || !netlifyLoaded) {
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

  console.log('AuthContext rendering with user:', user, 'netlifyLoaded:', netlifyLoaded);
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
