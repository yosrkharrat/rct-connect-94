import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi, postsApi } from '@/lib/api';
import { mapApiEvent, mapApiPost } from '@/lib/apiMappers';
import {
  Settings, Activity, Trophy, ChevronRight,
  Shield, Star, LogIn, LogOut, Edit, X, Camera
} from 'lucide-react';
import { RCTEvent, Post } from '@/types';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, updateUser } = useAuth();
  const [events, setEvents] = useState<RCTEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const openEditModal = () => {
    if (user) {
      setEditName(user.name);
      setEditBio((user as any).bio || '');
    }
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      updateUser({ name: editName.trim(), bio: editBio.trim() });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
    { label: 'Strava', icon: Activity, path: '/strava' },
    { label: 'Réglages', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="pb-20 pt-6">
      {/* Profile Header */}
      <div className="px-4 mb-6">
        <div className="bg-card rounded-2xl rct-shadow-card p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full rct-gradient-hero flex items-center justify-center rct-glow-blue relative">
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
            <button 
              onClick={openEditModal}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>
          {/* Bio */}
          {(user as any).bio && (
            <p className="text-sm text-muted-foreground mb-2">{(user as any).bio}</p>
          )}
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

      {/* Logout Button */}
      <div className="px-4 mt-6">
        <button 
          onClick={handleLogout}
          className="w-full bg-card rounded-2xl rct-shadow-card p-4 flex items-center gap-4 active:scale-[.98] transition-transform border border-destructive/20"
        >
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className="flex-1 text-left font-semibold text-destructive">Se déconnecter</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
          <div className="bg-card w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-bold text-lg">Modifier le profil</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full rct-gradient-hero flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {editName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nom complet</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Votre nom"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none resize-none"
                  placeholder="Parlez-nous de vous..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Groupe</label>
                <input
                  type="text"
                  value={user.group || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Contactez un admin pour changer de groupe</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 rounded-xl bg-muted font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving || !editName.trim()}
                className="flex-1 py-3 rounded-xl rct-gradient-hero text-white font-semibold disabled:opacity-50"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
