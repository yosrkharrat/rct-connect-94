import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi } from '@/lib/api';
import { ArrowLeft, Bell, Calendar, Heart, Info, CheckCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const iconMap = { event: Calendar, social: Heart, system: Info, reminder: Bell };
const colorMap = { event: 'text-primary', social: 'text-destructive', system: 'text-accent', reminder: 'text-secondary' };

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await notificationsApi.getAll();
        if (response.success && response.data) {
          setNotifications(response.data as any[]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleMarkAll = async () => {
    if (!user) return;
    try {
      await notificationsApi.markAllRead();
      const response = await notificationsApi.getAll();
      if (response.success && response.data) {
        setNotifications(response.data as any[]);
      }
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  };

  const handleTap = async (id: string, link?: string) => {
    try {
      await notificationsApi.markRead(id);
      const response = await notificationsApi.getAll();
      if (response.success && response.data) {
        setNotifications(response.data as any[]);
      }
      if (link) navigate(link);
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return `Il y a ${Math.floor(diff / 86400000)}j`;
  };

  return (
    <div className="pb-20 pt-6">
      <div className="flex items-center justify-between px-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-extrabold text-xl">Notifications</h1>
        </div>
        <button onClick={handleMarkAll} className="flex items-center gap-1 text-xs text-primary font-semibold">
          <CheckCheck className="w-4 h-4" /> Tout lire
        </button>
      </div>

      <div className="px-4 space-y-2">
        {isLoading ? (
          <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Aucune notification</p>
          </div>
        ) : (
          notifications.map(n => {
          const Icon = iconMap[n.type];
          return (
            <button key={n.id} onClick={() => handleTap(n.id, n.link)}
              className={`w-full text-left bg-card rounded-2xl rct-shadow-card p-4 flex items-start gap-3 transition-all ${!n.read ? 'border-l-4 border-primary' : 'opacity-70'}`}>
              <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${colorMap[n.type]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-display font-semibold text-sm">{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatTime(n.createdAt)}</p>
              </div>
            </button>
          );
        })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
