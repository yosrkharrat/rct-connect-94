import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, LogOut, Trash2, User, Bell, Shield, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { resetStore } from '@/lib/store';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleReset = () => {
    if (confirm('Réinitialiser toutes les données? Cette action est irréversible.')) {
      resetStore();
      logout();
      navigate('/');
    }
  };

  const sections = [
    {
      title: 'Apparence',
      items: [
        {
          icon: isDark ? Moon : Sun,
          label: isDark ? 'Mode sombre' : 'Mode clair',
          desc: 'Changer le thème de l\'app',
          action: toggleTheme,
          trailing: (
            <div className={`w-12 h-7 rounded-full flex items-center px-0.5 transition-colors ${isDark ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-5' : ''}`} />
            </div>
          ),
        },
      ],
    },
    {
      title: 'Compte',
      items: [
        { icon: User, label: 'Modifier le profil', desc: 'Nom, photo, groupe', action: () => navigate('/profile') },
        { icon: Bell, label: 'Notifications', desc: 'Gérer les préférences', action: () => navigate('/notifications') },
        ...(isAdmin ? [{ icon: Shield, label: 'Administration', desc: 'Gestion utilisateurs & rôles', action: () => navigate('/admin') }] : []),
      ],
    },
    {
      title: 'Données',
      items: [
        { icon: Trash2, label: 'Réinitialiser les données', desc: 'Revenir aux données initiales', action: handleReset, danger: true },
      ],
    },
  ];

  return (
    <div className="pb-20 pt-6">
      <div className="flex items-center gap-3 px-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-extrabold text-xl">Paramètres</h1>
      </div>

      {user && (
        <div className="mx-4 bg-card rounded-2xl rct-shadow-card p-4 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full rct-gradient-hero flex items-center justify-center">
            <span className="text-lg font-bold text-white">{user.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-display font-bold text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')} · {user.group}</p>
          </div>
        </div>
      )}

      {sections.map(section => (
        <div key={section.title} className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground px-4 mb-2">{section.title}</p>
          <div className="mx-4 bg-card rounded-2xl rct-shadow-card overflow-hidden">
            {section.items.map((item, i) => (
              <button key={i} onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 text-left">
                <item.icon className={`w-5 h-5 ${'danger' in item && item.danger ? 'text-destructive' : 'text-primary'}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${'danger' in item && item.danger ? 'text-destructive' : ''}`}>{item.label}</p>
                  {item.desc && <p className="text-[11px] text-muted-foreground">{item.desc}</p>}
                </div>
                {'trailing' in item && item.trailing ? item.trailing : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
            ))}
          </div>
        </div>
      ))}

      <p className="text-center text-[11px] text-muted-foreground mt-8 mb-4">
        RCT Connect v1.0 · Running Club Tunis © 2026
      </p>
    </div>
  );
};

export default SettingsPage;
