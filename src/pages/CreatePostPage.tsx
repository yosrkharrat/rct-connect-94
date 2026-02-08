import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, X, MapPin, Timer, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createPost } from '@/lib/store';

const CreatePostPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [distance, setDistance] = useState('');
  const [pace, setPace] = useState('');
  const [type, setType] = useState<'post' | 'reel'>('post');
  const fileRef = useRef<HTMLInputElement>(null);
  const [voiceFilled, setVoiceFilled] = useState(false);

  // Load voice-filled data from sessionStorage
  useEffect(() => {
    const voiceDraft = sessionStorage.getItem('voice_post_draft');
    if (voiceDraft) {
      try {
        const data = JSON.parse(voiceDraft);
        if (data.content) setContent(data.content);
        if (data.distance) setDistance(data.distance);
        if (data.pace) setPace(data.pace);
        if (data.type && ['post', 'reel'].includes(data.type)) {
          setType(data.type as 'post' | 'reel');
        }
        setVoiceFilled(true);
        sessionStorage.removeItem('voice_post_draft');
      } catch (e) {
        console.error('Error parsing voice draft:', e);
      }
    }
  }, []);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!content.trim() && !image) return;
    if (!user) return;
    createPost({
      id: 'p_' + Date.now(),
      authorId: user.id,
      authorName: user.name,
      authorAvatar: user.avatar || '',
      content,
      image: image || undefined,
      likes: [],
      comments: [],
      distance: distance || undefined,
      pace: pace || undefined,
      createdAt: new Date().toISOString(),
      type,
    });
    navigate('/community');
  };

  return (
    <div className="pb-20 pt-6">
      <div className="flex items-center justify-between px-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-extrabold text-xl">Nouvelle publication</h1>
          {voiceFilled && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Mic className="w-3 h-3" />
            </div>
          )}
        </div>
        <button onClick={handleSubmit} disabled={!content.trim() && !image}
          className="px-5 py-2 rct-gradient-hero text-white text-sm font-bold rounded-full disabled:opacity-50 rct-glow-blue transition-transform active:scale-95">
          Publier
        </button>
      </div>

      {/* Type selector */}
      <div className="flex gap-2 px-4 mb-4">
        {(['post', 'reel'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${type === t ? 'rct-gradient-hero text-white' : 'bg-muted text-muted-foreground'}`}>
            {t === 'post' ? '📸 Post' : '🎬 Reel'}
          </button>
        ))}
      </div>

      <div className="px-4">
        {/* Author */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full rct-gradient-hero flex items-center justify-center">
            <span className="text-sm font-bold text-white">{user?.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-display font-semibold text-sm">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.group || 'Membre RCT'}</p>
          </div>
        </div>

        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Partagez votre course, votre exploit... 🏃‍♂️"
          rows={4} className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4" />

        {/* Image preview */}
        {image && (
          <div className="relative mb-4 rounded-2xl overflow-hidden">
            <img src={image} alt="Preview" className="w-full h-48 object-cover" width={400} height={192} />
            <button onClick={() => setImage(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Run stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label htmlFor="post-distance" className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Distance</label>
            <input id="post-distance" value={distance} onChange={e => setDistance(e.target.value)} placeholder="ex: 10 km"
              className="w-full h-10 px-3 rounded-lg bg-muted border border-border text-sm" />
          </div>
          <div>
            <label htmlFor="post-pace" className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Timer className="w-3 h-3" />Allure</label>
            <input id="post-pace" value={pace} onChange={e => setPace(e.target.value)} placeholder="ex: 5:30/km"
              className="w-full h-10 px-3 rounded-lg bg-muted border border-border text-sm" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-sm font-medium">
            <Image className="w-4 h-4 text-primary" /> Photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
