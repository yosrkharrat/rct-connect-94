import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const EditProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState((user as any)?.bio || '');
  const [editLevel, setEditLevel] = useState(user?.level || 'débutant');
  const [isSaving, setIsSaving] = useState(false);
  const [voiceFilled, setVoiceFilled] = useState(false);

  // Load voice-filled data from sessionStorage
  useEffect(() => {
    const voiceDraft = sessionStorage.getItem('voice_profile_draft');
    if (voiceDraft) {
      try {
        const data = JSON.parse(voiceDraft);
        if (data.name) setEditName(data.name);
        if (data.bio) setEditBio(data.bio);
        setVoiceFilled(true);
        sessionStorage.removeItem('voice_profile_draft');
      } catch (e) {
        console.error('Error parsing voice draft:', e);
      }
    }
  }, []);

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    try {
      if (updateUser) {
        await updateUser({ name: editName.trim(), bio: editBio.trim(), level: editLevel as any });
      }
      navigate(-1);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="pb-20 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-extrabold text-xl">Modifier le profil</h1>
        {voiceFilled && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Mic className="w-3 h-3" /> Assistant
          </div>
        )}
      </div>

      {/* Avatar Preview */}
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-28 h-28 rounded-full rct-gradient-hero flex items-center justify-center rct-glow-blue">
            <span className="text-4xl font-bold text-white">
              {editName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-4 space-y-5">
        <div className="bg-card rounded-2xl rct-shadow-card p-4">
          <label className="text-sm font-semibold text-muted-foreground mb-2 block">Nom complet</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-foreground"
            placeholder="Votre nom"
          />
        </div>

        <div className="bg-card rounded-2xl rct-shadow-card p-4">
          <label className="text-sm font-semibold text-muted-foreground mb-2 block">Bio</label>
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none resize-none text-foreground"
            placeholder="Parlez-nous de vous..."
            rows={4}
          />
        </div>

        <div className="bg-card rounded-2xl rct-shadow-card p-4">
          <label className="text-sm font-semibold text-muted-foreground mb-2 block">Niveau</label>
          <select
            value={editLevel}
            onChange={(e) => setEditLevel(e.target.value as any)}
            className="w-full px-4 py-3 rounded-xl bg-muted border-0 focus:ring-2 focus:ring-primary outline-none text-foreground"
          >
            <option value="débutant">Débutant</option>
            <option value="intermédiaire">Intermédiaire</option>
            <option value="élite">Élite</option>
          </select>
        </div>

        <div className="bg-card rounded-2xl rct-shadow-card p-4">
          <label className="text-sm font-semibold text-muted-foreground mb-2 block">Groupe</label>
          <input
            type="text"
            value={user.group || 'Non assigné'}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Contactez un admin pour changer de groupe
          </p>
        </div>

        <div className="bg-card rounded-2xl rct-shadow-card p-4">
          <label className="text-sm font-semibold text-muted-foreground mb-2 block">Rôle</label>
          <input
            type="text"
            value={user.role.replace('_', ' ')}
            disabled
            className="w-full px-4 py-3 rounded-xl bg-muted border-0 text-muted-foreground cursor-not-allowed capitalize"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 mt-8 flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex-1 py-3.5 rounded-xl bg-muted font-semibold"
        >
          Annuler
        </button>
        <button
          onClick={handleSaveProfile}
          disabled={isSaving || !editName.trim()}
          className="flex-1 py-3.5 rounded-xl rct-gradient-hero text-white font-semibold disabled:opacity-50"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
};

export default EditProfilePage;
