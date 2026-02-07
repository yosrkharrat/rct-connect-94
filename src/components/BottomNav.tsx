import { NavLink } from "react-router-dom";
import { Home, Calendar, MapPin, Users, User } from "lucide-react";

const tabs = [
  { to: "/", icon: Home, label: "Accueil" },
  { to: "/calendar", icon: Calendar, label: "Calendrier" },
  { to: "/map", icon: MapPin, label: "Carte" },
  { to: "/community", icon: Users, label: "Communauté" },
  { to: "/profile", icon: User, label: "Profil" },
];

const BottomNav = () => (
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

export default BottomNav;
