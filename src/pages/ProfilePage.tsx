import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi, postsApi } from '@/lib/api';
import { mapApiEvent, mapApiPost } from '@/lib/apiMappers';
import {
  Settings, MessageSquare, Activity, Trophy, ChevronRight,
  Shield, Star, Calendar, MapPin, LogIn
} from 'lucide-react';
import { RCTEvent, Post } from '@/types';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout } = useAuth();
  const [events, setEvents] = useState<RCTEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const eventsResponse = await eventsApi.getAll();
        if (eventsResponse.success && eventsResponse.data) {
          const mappedEvents = (eventsResponse.data as any[]).map(mapApiEvent);
          setEvents(mappedEvents);
        }
        
        const postsResponse = await postsApi.getAll({ authorId: user.id });
        if (postsResponse.success && postsResponse.data) {
          const mappedPosts = (postsResponse.data as any[]).map(mapApiPost);
          setPosts(mappedPosts);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!isLoggedIn || !user) {
    return (
      <div className="pb-20 pt-6 px-4">
        <h1 className="font-display font-extrabold text-2xl mb-4">Profil</h1>
        <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center space-y-4">
          <p className="text-muted-foreground">Connectez-vous pour voir votre profil</p>
          <button onClick={() => navigate('/login')}
            className="rct-gradient-hero text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 mx-auto">
            <LogIn className="w-5 h-5" /> Se connecter
          </button>
        </div>
      </div>
    );
  }

  const myEvents = events.filter(e => e.participants.includes(user.id));
  const myPosts = posts.filter(p => p.authorId === user.id);
  const totalDistance = myPosts.reduce((acc, p) => acc + (parseFloat(p.distance || '0') || 0), 0);

  const roleBadge = () => {
    switch (user.role) {
      case 'admin': return { label: 'Admin', color: 'bg-red-500', icon: Shield };
      case 'coach': return { label: 'Coach', color: 'bg-purple-500', icon: Trophy };
      case 'group_admin': return { label: 'Chef de groupe', color: 'bg-orange-500', icon: Star };
      default: return { label: 'Membre', color: 'bg-blue-500', icon: Activity };
    }
  };

  const badge = roleBadge();
  const BadgeIcon = badge.icon;

  const menuItems = [
    { label: 'Messages', icon: MessageSquare, path: '/messaging', count: 0 },
    { label: 'Strava', icon: Activity, path: '/strava' },
    { label: 'Événements', icon: Calendar, path: '/calendar' },
    { label: 'Parcours', icon: MapPin, path: '/map' },
    { label: 'Réglages', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="pb-20 pt-6">
      {/* Profile Header */}
      <div className="px-4 mb-6">
        <div className="bg-card rounded-2xl rct-shadow-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full rct-gradient-hero flex items-center justify-center rct-glow-blue">
              <span className="text-2xl font-bold text-white">
                {user.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-display font-extrabold text-xl">{user.name}</h2>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${badge.color} mt-1`}>
                <BadgeIcon className="w-3 h-3" />
                {badge.label}
              </div>
            </div>
          </div>
          {/* Bio placeholder */}
          {user.group && (
            <p className="text-xs text-muted-foreground">Groupe: <span className="font-semibold text-foreground">{user.group}</span></p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl rct-shadow-card p-4 text-center">
            <p className="text-2xl font-extrabold rct-text-gradient">{totalDistance.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">km total</p>
          </div>
          <div className="bg-card rounded-2xl rct-shadow-card p-4 text-center">
            <p className="text-2xl font-extrabold rct-text-gradient">{myEvents.length}</p>
            <p className="text-xs text-muted-foreground">événements</p>
          </div>
          <div className="bg-card rounded-2xl rct-shadow-card p-4 text-center">
            <p className="text-2xl font-extrabold rct-text-gradient">{myPosts.length}</p>
            <p className="text-xs text-muted-foreground">publications</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 space-y-2">
        {menuItems.map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            className="w-full bg-card rounded-2xl rct-shadow-card p-4 flex items-center gap-4 active:scale-[.98] transition-transform">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <item.icon className="w-5 h-5 text-foreground" />
            </div>
            <span className="flex-1 text-left font-semibold">{item.label}</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
