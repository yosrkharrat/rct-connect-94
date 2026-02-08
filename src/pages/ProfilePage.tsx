import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi, postsApi, stravaApi } from '@/lib/api';
import { mapApiEvent, mapApiPost } from '@/lib/apiMappers';
import {
  Settings, Activity, Trophy, LogIn, X,
  Shield, Star, Grid3x3, Award, PlayCircle, Image as ImageIcon,
  Medal, Target, Zap, Flame, Crown, RefreshCw
} from 'lucide-react';
import { RCTEvent, Post } from '@/types';
import PostCard from '@/components/PostCard';

// Badge definitions
const BADGES = [
  { id: 'first_run', name: 'Première course', icon: Zap, color: 'bg-green-500', desc: 'Première sortie enregistrée', unlocked: true },
  { id: 'km_10', name: '10 km total', icon: Medal, color: 'bg-blue-500', desc: 'Courir 10 km au total', unlocked: true },
  { id: 'km_50', name: '50 km total', icon: Medal, color: 'bg-purple-500', desc: 'Courir 50 km au total', unlocked: true },
  { id: 'km_100', name: '100 km total', icon: Trophy, color: 'bg-yellow-500', desc: 'Courir 100 km au total', unlocked: false },
  { id: 'streak_7', name: 'Semaine parfaite', icon: Flame, color: 'bg-orange-500', desc: '7 jours consécutifs', unlocked: true },
  { id: 'streak_30', name: 'Mois parfait', icon: Crown, color: 'bg-red-500', desc: '30 jours consécutifs', unlocked: false },
  { id: 'events_5', name: 'Participant actif', icon: Target, color: 'bg-cyan-500', desc: 'Participer à 5 événements', unlocked: true },
  { id: 'events_20', name: 'Vétéran', icon: Award, color: 'bg-pink-500', desc: 'Participer à 20 événements', unlocked: false },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, updateUser } = useAuth();
  const [events, setEvents] = useState<RCTEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'badges'>('grid');

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
  const totalDistance = user.stats?.totalDistance || 0;

  const handleSyncStrava = async () => {
    if (!user.strava?.connected) {
      navigate('/strava');
      return;
    }
    setIsSyncing(true);
    try {
      const response = await stravaApi.syncDistance();
      if (response.success && response.data) {
        // Update user stats
        updateUser({
          ...user,
          stats: {
            ...user.stats,
            totalDistance: response.data.distance,
            totalRuns: response.data.runs,
          },
        });
      }
    } catch (error) {
      console.error('Error syncing Strava distance:', error);
    } finally {
      setIsSyncing(false);
    }
  };

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

  return (
    <div className="pb-20">
      {/* Header with Settings */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-border">
        <h1 className="font-display font-bold text-xl">{user.name.split(' ')[0]}</h1>
        <button 
          onClick={() => navigate('/settings')}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-6 mb-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full rct-gradient-hero flex items-center justify-center rct-glow-blue">
            <span className="text-2xl font-bold text-white">
              {user.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>

          {/* Stats */}
          <div className="flex-1 flex justify-around">
            <div className="text-center">
              <p className="text-xl font-bold">{myPosts.length}</p>
              <p className="text-xs text-muted-foreground">publications</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{myEvents.length}</p>
              <p className="text-xs text-muted-foreground">événements</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{totalDistance.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">km total</p>
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-bold text-sm">{user.name}</h2>
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white ${badge.color}`}>
              <BadgeIcon className="w-2.5 h-2.5" />
              {badge.label}
            </div>
          </div>
          {(user as any).bio && (
            <p className="text-sm">{(user as any).bio}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {user.level && (
              <span className="inline-flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span className="capitalize">{user.level}</span>
              </span>
            )}
            {user.group && (
              <span className="inline-flex items-center gap-1">
                🏃‍♂️ {user.group}
              </span>
            )}
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={() => navigate('/edit-profile')}
          className="w-full py-1.5 rounded-lg bg-muted font-semibold text-sm"
        >
          Modifier le profil
        </button>
      </div>

      {/* Stats Section */}
      <div className="px-4 py-3 border-y border-border">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-lg font-bold">{totalDistance.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Distance totale</p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-lg font-bold">{user.stats.totalRuns || 0}</p>
            <p className="text-[10px] text-muted-foreground">Sorties</p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-lg font-bold">{myEvents.length || 0}</p>
            <p className="text-[10px] text-muted-foreground">Participations</p>
          </div>
        </div>
        {user.strava?.connected && (
          <button
            onClick={handleSyncStrava}
            disabled={isSyncing}
            className="w-full mt-2 py-2 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser avec Strava'}
          </button>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setViewMode('grid')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${
            viewMode === 'grid' 
              ? 'border-foreground' 
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <Grid3x3 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setViewMode('badges')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${
            viewMode === 'badges' 
              ? 'border-foreground' 
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <Award className="w-5 h-5" />
        </button>
      </div>

      {/* Posts Grid/List */}
      <div className="px-1">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Chargement...
          </div>
        ) : myPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm mb-2">Aucune publication</p>
            <button 
              onClick={() => navigate('/create-post')}
              className="text-primary text-sm font-semibold"
            >
              Créer votre première publication
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-1">
            {myPosts.map(post => (
              <div 
                key={post.id} 
                className="aspect-square bg-muted relative overflow-hidden cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                {post.image ? (
                  <>
                    <img 
                      src={post.image} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                    {post.content?.toLowerCase().includes('video') && (
                      <div className="absolute top-1 right-1">
                        <PlayCircle className="w-5 h-5 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <ImageIcon className="w-8 h-8 text-primary/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Badges Grid */
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {BADGES.map(badge => {
                const Icon = badge.icon;
                return (
                  <div 
                    key={badge.id} 
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      badge.unlocked 
                        ? 'bg-card rct-shadow-card' 
                        : 'bg-muted/50 opacity-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      badge.unlocked ? badge.color : 'bg-muted'
                    }`}>
                      <Icon className={`w-5 h-5 ${badge.unlocked ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <p className="text-[10px] font-medium text-center leading-tight">{badge.name}</p>
                  </div>
                );
              })}
            </div>
            <div className="bg-card rounded-2xl rct-shadow-card p-4">
              <p className="text-sm font-semibold mb-2">Progression des badges</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rct-gradient-hero rounded-full transition-all" 
                    style={{ width: `${(BADGES.filter(b => b.unlocked).length / BADGES.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {BADGES.filter(b => b.unlocked).length}/{BADGES.length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Single Post Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between z-10">
              <h3 className="font-display font-bold text-base">Publication</h3>
              <button 
                onClick={() => setSelectedPost(null)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PostCard post={selectedPost} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
