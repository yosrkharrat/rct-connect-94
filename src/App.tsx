import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import SkipLink from "@/components/SkipLink";
import BottomNav from "@/components/BottomNav";
import HomePage from "@/pages/HomePage";
import CalendarPage from "@/pages/CalendarPage";
import MapPage from "@/pages/MapPage";
import CommunityPage from "@/pages/CommunityPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import HistoryPage from "@/pages/HistoryPage";
import CreateEventPage from "@/pages/CreateEventPage";
import EventDetailPage from "@/pages/EventDetailPage";
import CreatePostPage from "@/pages/CreatePostPage";
import NotificationsPage from "@/pages/NotificationsPage";
import MessagingPage from "@/pages/MessagingPage";
import SettingsPage from "@/pages/SettingsPage";
import StravaPage from "@/pages/StravaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Pages where bottom nav should be hidden
const hideNavPages = ['/login', '/create-event', '/create-post', '/settings', '/strava', '/history', '/notifications'];

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
  const isAllowedForVisitor = ['/', '/calendar', '/login', '/event/'].some(
    path => location.pathname === path || location.pathname.startsWith('/event/')
  ) || location.pathname === '/calendar' || location.pathname === '/';
  
  if (isVisitor && !isLoggedIn && !isAllowedForVisitor) {
    return <Navigate to="/calendar" replace />;
  }

  return (
    <>
      <SkipLink />
      <div className="w-full min-h-screen bg-background relative safe-top">
        <main id="main-content" tabIndex={-1}>
          <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/map" element={<RequireAuth><MapPage /></RequireAuth>} />
        <Route path="/community" element={<RequireAuth><CommunityPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
        <Route path="/create-event" element={<RequireAuth><CreateEventPage /></RequireAuth>} />
        <Route path="/event/:id" element={<EventDetailPage />} />
        <Route path="/create-post" element={<RequireAuth><CreatePostPage /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
        <Route path="/messaging" element={<RequireAuth><MessagingPage /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
        <Route path="/strava" element={<RequireAuth><StravaPage /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </main>
        {showNav && <BottomNav />}
      </div>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <AppContent />
            </HashRouter>
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
