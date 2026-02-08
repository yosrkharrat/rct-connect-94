import { NavLink } from "react-router-dom";
import { Home, Calendar, User, LogIn, Flame, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const BottomNav = () => {
  const { isLoggedIn, isVisitor } = useAuth();
  const { t } = useLanguage();
  
  const allTabs = [
    { to: "/", icon: Home, label: t('nav.home'), visitorAccess: true },
    { to: "/calendar", icon: Calendar, label: t('nav.events'), visitorAccess: true },
    { to: "/strava", icon: Activity, label: t('nav.strava'), visitorAccess: false },
    { to: "/calories", icon: Flame, label: t('nav.calories'), visitorAccess: false },
    { to: "/profile", icon: User, label: t('nav.profile'), visitorAccess: false },
  ];
  
  // Visitors only see Events and Login
  const isVisitorOnly = isVisitor && !isLoggedIn;
  
  const tabs = isVisitorOnly 
    ? [
        { to: "/", icon: Home, label: t('nav.home') },
        { to: "/calendar", icon: Calendar, label: t('nav.events') },
        { to: "/login", icon: LogIn, label: t('nav.login') },
      ]
    : allTabs;

  return (
    <nav 
      className="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border safe-bottom"
      aria-label="Navigation principale"
      role="navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 
               min-w-[44px] min-h-[44px] justify-center ${
                isActive
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`
            }
            aria-label={label}
            aria-current={({ isActive }) => (isActive ? "page" : undefined)}
          >
            <Icon className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
            <span className="text-[10px] font-medium font-body">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
