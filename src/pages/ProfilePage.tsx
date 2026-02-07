import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi, postsApi } from '@/lib/api';
import { mapApiEvent, mapApiPost } from '@/lib/apiMappers';
import {
  Settings, Activity, Trophy, LogIn, LogOut, Edit, X, Camera,
  Shield, Star, Grid3x3, LayoutList, PlayCircle, Image as ImageIcon
} from 'lucide-react';
import { RCTEvent, Post } from '@/types';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, updateUser } = useAuth();
  const [events, setEvents] = useState<RCTEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  return (
    <div className="pb-20">
      {/* Header with Settings */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-border">
        <h1 className="font-display font-bold text-xl">{user.name.split(' ')[0]}</h1>
        <div className="relative">
          <button 
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {/* Settings Dropdown */}
          {showSettingsMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSettingsMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl rct-shadow-card overflow-hidden z-50 border border-border">
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    navigate('/settings');
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Réglages</span>
                </button>
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    navigate('/strava');
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left border-t border-border"
                >
                  <Activity className="w-5 h-5" />
                  <span className="font-medium">Strava</span>
                </button>
                <button
                  onClick={() => {
                    setShowSettingsMenu(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-destructive/10 transition-colors text-left border-t border-border text-destructive"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Se déconnecter</span>
                </button>
              </div>
            </>
          )}
        </div>
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
          {user.group && (
            <p className="text-xs text-muted-foreground mt-1">🏃‍♂️ {user.group}</p>
          )}
        </div>

        {/* Edit Profile Button */}
        <button
          onClick={openEditModal}
          className="w-full py-1.5 rounded-lg bg-muted font-semibold text-sm"
        >
          Modifier le profil
        </button>
      </div>

      {/* Records Section */}
      <div className="px-4 py-3 border-y border-border">
        <h3 className="font-bold text-sm mb-2">📊 Records</h3>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-lg font-bold">{totalDistance.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Distance totale</p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-lg font-bold">{user.runs || 0}</p>
            <p className="text-[10px] text-muted-foreground">Sorties</p>
          </div>
          <div className="bg-muted rounded-lg p-2 text-center">
            <p className="text-lg font-bold">{user.joinedEvents || 0}</p>
            <p className="text-[10px] text-muted-foreground">Participations</p>
          </div>
        </div>
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
          onClick={() => setViewMode('list')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 border-b-2 transition-colors ${
            viewMode === 'list' 
              ? 'border-foreground' 
              : 'border-transparent text-muted-foreground'
          }`}
        >
          <LayoutList className="w-5 h-5" />
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
                onClick={() => navigate('/community')}
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
          <div className="divide-y divide-border">
            {myPosts.map(post => (
              <div 
                key={post.id}
                className="py-4 px-3 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => navigate('/community')}
              >
                {post.image ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img src={post.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                    <ImageIcon className="w-6 h-6 text-primary/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {post.likes?.length || 0} j'aime
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.comments?.length || 0} commentaires
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
