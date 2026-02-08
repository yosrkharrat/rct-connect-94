import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { useEffect, useState, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useEventNotifications } from "@/hooks/use-event-notifications";
import SkipLink from "@/components/SkipLink";
import BottomNav from "@/components/BottomNav";
import SplashScreen from "@/components/SplashScreen";

// Lazy load all pages for code splitting
const HomePage = lazy(() => import("@/pages/HomePage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const MapPage = lazy(() => import("@/pages/MapPage"));
const CommunityPage = lazy(() => import("@/pages/CommunityPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const CreateEventPage = lazy(() => import("@/pages/CreateEventPage"));
const EventDetailPage = lazy(() => import("@/pages/EventDetailPage"));
const CreatePostPage = lazy(() => import("@/pages/CreatePostPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const NotificationSettingsPage = lazy(() => import("@/pages/NotificationSettingsPage"));
const MessagingPage = lazy(() => import("@/pages/MessagingPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const AccessibilityPage = lazy(() => import("@/pages/AccessibilityPage"));
const StravaPage = lazy(() => import("@/pages/StravaPage"));
const StravaCallbackPage = lazy(() => import("@/pages/StravaCallbackPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ManageUsersPage = lazy(() => import("@/pages/admin/ManageUsersPage"));
const ProgramsPage = lazy(() => import("@/pages/admin/ProgramsPage"));
const MyGroupPage = lazy(() => import("@/pages/admin/MyGroupPage"));
const CreateUserPage = lazy(() => import("@/pages/admin/CreateUserPage"));
const ManageAdminsPage = lazy(() => import("@/pages/admin/ManageAdminsPage"));
const ShareProgramPage = lazy(() => import("@/pages/admin/ShareProgramPage"));
const CalorieTrackerPage = lazy(() => import("@/pages/CalorieTrackerPage"));
const EditProfilePage = lazy(() => import("@/pages/EditProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// VoiceAssistant loaded lazily as it's heavy
const VoiceAssistant = lazy(() => import("@/components/VoiceAssistant"));

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

// Pages where bottom nav should be hidden
const hideNavPages = ['/login', '/create-event', '/create-post', '/settings', '/history', '/notifications', '/admin', '/edit-profile'];

// Protected route component - redirects visitors to login
const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn, isVisitor } = useAuth();
  if (!isLoggedIn && !isVisitor) {
    return <Navigate to="/login" replace />;
  }
  if (isVisitor && !isLoggedIn) {
    return <Navigate to="/calendar" replace />;
  }
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { isVisitor, isLoggedIn } = useAuth();
  const showNav = !hideNavPages.some(p => location.pathname.startsWith(p))
    && !location.pathname.startsWith('/event/');

  // Initialize event notifications system
  useEventNotifications();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      });
    }
  }, []);

  // Redirect visitors from non-allowed pages
  const isAllowedForVisitor = ['/', '/calendar', '/login', '/history'].some(
    path => location.pathname === path || location.pathname.startsWith('/event/')
  );
  
  if (isVisitor && !isLoggedIn && !isAllowedForVisitor) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SkipLink />
      <div className="w-full min-h-screen bg-background relative safe-top">
        <main id="main-content" tabIndex={-1}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/map" element={<RequireAuth><MapPage /></RequireAuth>} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              <Route path="/edit-profile" element={<RequireAuth><EditProfilePage /></RequireAuth>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/create-event" element={<RequireAuth><CreateEventPage /></RequireAuth>} />
              <Route path="/event/:id" element={<EventDetailPage />} />
              <Route path="/create-post" element={<RequireAuth><CreatePostPage /></RequireAuth>} />
              <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
              <Route path="/notifications/settings" element={<RequireAuth><NotificationSettingsPage /></RequireAuth>} />
              <Route path="/messaging" element={<RequireAuth><MessagingPage /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
              <Route path="/accessibility" element={<AccessibilityPage />} />
              <Route path="/strava/callback" element={<StravaCallbackPage />} />
              <Route path="/strava" element={<RequireAuth><StravaPage /></RequireAuth>} />
              <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
              <Route path="/admin/users" element={<RequireAuth><ManageUsersPage /></RequireAuth>} />
              <Route path="/admin/create-user" element={<RequireAuth><CreateUserPage /></RequireAuth>} />
              <Route path="/admin/manage-admins" element={<RequireAuth><ManageAdminsPage /></RequireAuth>} />
              <Route path="/admin/programs" element={<RequireAuth><ProgramsPage /></RequireAuth>} />
              <Route path="/admin/share-program" element={<RequireAuth><ShareProgramPage /></RequireAuth>} />
              <Route path="/admin/my-group" element={<RequireAuth><MyGroupPage /></RequireAuth>} />
              <Route path="/calories" element={<RequireAuth><CalorieTrackerPage /></RequireAuth>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        {showNav && <BottomNav />}
        <Suspense fallback={null}>
          <VoiceAssistant />
        </Suspense>
      </div>
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <LanguageProvider>
              <AccessibilityProvider>
                {showSplash ? (
                  <SplashScreen onFinish={() => setShowSplash(false)} />
                ) : (
                  <>
                    <Toaster />
                    <Sonner />
                    <HashRouter>
                      <AppContent />
                    </HashRouter>
                  </>
                )}
              </AccessibilityProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
