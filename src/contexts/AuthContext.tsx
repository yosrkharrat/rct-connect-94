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
  updateUser: (updates: Partial<User & { bio?: string }>) => void;
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
    const savedProfile = localStorage.getItem('rct_user_profile');
    
    if (token) {
      // Verify token and get user data
      authApi.me()
        .then(response => {
          if (response.success && response.data?.user) {
            let mappedUser = mapApiUser(response.data.user);
            // Merge with saved profile data (name, bio, etc.)
            if (savedProfile) {
              try {
                const profileData = JSON.parse(savedProfile);
                if (profileData.id === mappedUser.id) {
                  mappedUser = { ...mappedUser, ...profileData };
                }
              } catch (e) {}
            }
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

  const updateUser = (updates: Partial<User & { bio?: string }>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser as User);
      // Save to localStorage for persistence
      localStorage.setItem('rct_user_profile', JSON.stringify(updatedUser));
    }
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

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      isVisitor,
      isLoading,
      login,
      loginAsVisitor,
      logout,
      updateUser,
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
