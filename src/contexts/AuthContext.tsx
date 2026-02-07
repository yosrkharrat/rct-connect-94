import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { initStore } from '@/lib/store';
import { authApi, setAuthToken, getAuthToken } from '@/lib/api';
import { mapApiUser } from '@/lib/apiMappers';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isVisitor: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsVisitor: () => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  isAdmin: boolean;
  isCoach: boolean;
  isGroupAdmin: boolean;
  canCreateEvents: boolean;
  canManageUsers: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isVisitor, setIsVisitor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initStore();
    const token = getAuthToken();
    const savedVisitor = localStorage.getItem('rct_visitor');
    
    if (token) {
      // Verify token and get user data
      authApi.me()
        .then(response => {
          if (response.success && response.data?.user) {
            const mappedUser = mapApiUser(response.data.user);
            setUser(mappedUser);
          } else {
            setAuthToken(null);
          }
        })
        .catch(error => {
          console.error('Error verifying token:', error);
          setAuthToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (savedVisitor) {
      setIsVisitor(true);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.success && response.data) {
      setAuthToken(response.data.token);
      const mappedUser = mapApiUser(response.data.user);
      setUser(mappedUser);
      setIsVisitor(false);
      localStorage.removeItem('rct_visitor');
      return { success: true };
    }
    return { success: false, error: response.error || 'Email ou mot de passe invalide' };
  };

  const loginAsVisitor = () => {
    setUser(null);
    setIsVisitor(true);
    localStorage.setItem('rct_visitor', 'true');
    localStorage.removeItem('rct_currentUser');
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setIsVisitor(false);
    localStorage.removeItem('rct_visitor');
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = hasRole('admin');
  const isCoach = hasRole('coach');
  const isGroupAdmin = hasRole('group_admin');
  const canCreateEvents = hasRole('admin', 'coach', 'group_admin');
  const canManageUsers = hasRole('admin');

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      isVisitor,
      isLoading,
      login,
      loginAsVisitor,
      logout,
      hasRole,
      isAdmin,
      isCoach,
      isGroupAdmin,
      canCreateEvents,
      canManageUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
