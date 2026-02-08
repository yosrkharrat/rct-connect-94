import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { initStore } from '@/lib/store';
import { authApi, setAuthToken, getAuthToken, usersApi } from '@/lib/api';
import { mapApiUser } from '@/lib/apiMappers';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isVisitor: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsVisitor: () => void;
  logout: () => void;
  updateUser: (updates: Partial<User & { bio?: string }>) => Promise<void>;
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
            const userData = response.data.user;
            // If user already has frontend shape (offline fallback), use directly
            let resolvedUser: User;
            if (userData.stats && userData.joinDate) {
              resolvedUser = userData as User;
            } else {
              resolvedUser = mapApiUser(userData);
            }
            // Merge with saved profile data (name, bio, etc.)
            if (savedProfile) {
              try {
                const profileData = JSON.parse(savedProfile);
                if (profileData.id === resolvedUser.id) {
                  resolvedUser = { ...resolvedUser, ...profileData };
                }
              } catch (e) {}
            }
            setUser(resolvedUser);
          } else {
            // Invalid token, clear it
            setAuthToken(null);
          }
        })
        .catch(error => {
          console.error('Error verifying token:', error);
          // On error, clear token and continue as guest
          setAuthToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (savedVisitor) {
      setIsVisitor(true);
      setIsLoading(false);
    } else {
      // No token and no visitor flag - treat as guest
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.success && response.data) {
      setAuthToken(response.data.token);
      const userData = response.data.user;
      // If user already has frontend shape (offline fallback), use directly
      const resolvedUser = (userData.stats && userData.joinDate)
        ? userData as User
        : mapApiUser(userData);
      setUser(resolvedUser);
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

  const updateUser = async (updates: Partial<User & { bio?: string }>) => {
    if (user) {
      try {
        // Call API to persist changes
        const apiUpdates: any = {};
        if (updates.name !== undefined) apiUpdates.name = updates.name;
        if (updates.avatar !== undefined) apiUpdates.avatar = updates.avatar;
        if (updates.level !== undefined) apiUpdates.level = updates.level;
        
        if (Object.keys(apiUpdates).length > 0) {
          await usersApi.update(user.id, apiUpdates);
        }
        
        // Update local state
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser as User);
        // Save to localStorage for persistence
        localStorage.setItem('rct_user_profile', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Failed to update user:', error);
        // Still update local state even if API call fails
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser as User);
        localStorage.setItem('rct_user_profile', JSON.stringify(updatedUser));
      }
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
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Chargement...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
