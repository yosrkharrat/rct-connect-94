import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, LogOut, Trash2, User, Bell, Shield, ChevronRight, Accessibility, Globe, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { resetStore } from '@/lib/store';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin, isCoach, isGroupAdmin } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { language, setLanguage, t, languageNames } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReset = () => {
    if (confirm(t('settings.reset') + '?')) {
      resetStore();
      logout();
      navigate('/');
    }
  };

  const sections = [
    {
      title: t('settings.appearance'),
      items: [
        {
          icon: isDark ? Moon : Sun,
          label: isDark ? t('settings.darkMode') : t('settings.lightMode'),
          desc: 'Changer le thème de l\'app',
          action: toggleTheme,
          trailing: (
            <div className={`w-12 h-7 rounded-full flex items-center px-0.5 transition-colors ${isDark ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${isDark ? 'translate-x-5' : ''}`} />
            </div>
          ),
        },
        {
          icon: Globe,
          label: t('settings.language'),
          desc: languageNames[language],
          action: () => setShowLanguageModal(true),
        },
      ],
    },
    {
      title: t('settings.accessibility'),
      items: [
        { icon: Accessibility, label: t('settings.accessibility'), desc: 'Contraste, taille du texte, assistant vocal', action: () => navigate('/accessibility') },
      ],
    },
    {
      title: t('settings.account'),
      items: [
        { icon: User, label: t('profile.editProfile'), desc: 'Nom, photo, groupe', action: () => navigate('/edit-profile') },
        { icon: Bell, label: t('settings.notifications'), desc: 'Gérer les alertes d\'événements', action: () => navigate('/notifications/settings') },
        ...((isAdmin || isCoach || isGroupAdmin) ? [{ icon: Shield, label: t('settings.admin'), desc: 'Gestion utilisateurs & événements', action: () => navigate('/admin') }] : []),
      ],
    },
    {
      title: t('settings.data'),
      items: [
        { icon: Trash2, label: t('settings.reset'), desc: 'Revenir aux données initiales', action: handleReset, danger: true },
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
            <p className="text-sm font-semibold text-muted-foreground px-4 mb-2">{section.title}</p>
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

      {/* Logout Button */}
      <div className="mx-4 mt-6">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-destructive/10 rounded-2xl text-destructive font-semibold hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          {t('settings.logout')}
        </button>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-8 mb-4">
        RCT Connect v1.0 · Running Club Tunis © 2026
      </p>

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-display font-bold text-base">{t('settings.language')}</h3>
            </div>
            <div className="p-2">
              {(['fr', 'en', 'ar', 'tn'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                    language === lang ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <span className="font-medium">{languageNames[lang]}</span>
                  {language === lang && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="w-full py-2.5 rounded-xl bg-muted font-semibold text-sm"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
