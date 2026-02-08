import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Users, Calendar, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi } from '@/lib/api';

const CreateEventPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [group, setGroup] = useState('Tous');
  const [type, setType] = useState<'daily' | 'weekly' | 'race'>('daily');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [voiceFilled, setVoiceFilled] = useState(false);

  // Load voice-filled data from sessionStorage
  useEffect(() => {
    const voiceDraft = sessionStorage.getItem('voice_event_draft');
    if (voiceDraft) {
      try {
        const data = JSON.parse(voiceDraft);
        if (data.title) setTitle(data.title);
        if (data.date) setDate(data.date);
        if (data.time) setTime(data.time);
        if (data.location) setLocation(data.location);
        if (data.group) setGroup(data.group);
        if (data.type && ['daily', 'weekly', 'race'].includes(data.type)) {
          setType(data.type as 'daily' | 'weekly' | 'race');
        }
        if (data.description) setDescription(data.description);
        setVoiceFilled(true);
        sessionStorage.removeItem('voice_event_draft');
      } catch (e) {
        console.error('Error parsing voice draft:', e);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time || !location) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await eventsApi.create({
        title,
        date,
        time,
        location,
        description,
        group_name: group,
        event_type: type,
      });
      
      if (response.success) {
        navigate('/calendar');
      } else {
        setError(response.error || 'Erreur lors de la création de l\'événement');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20 pt-6">
      <div className="flex items-center gap-3 px-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-extrabold text-xl">Créer un événement</h1>
        {voiceFilled && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Mic className="w-3 h-3" /> Rempli par l'assistant
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="px-4 space-y-4">
        <div>
          <label htmlFor="event-title" className="text-sm font-medium mb-1.5 block">Titre</label>
          <input id="event-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nom de l'événement"
            className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="event-date" className="text-sm font-medium mb-1.5 block flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Date</label>
            <input id="event-date" type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label htmlFor="event-time" className="text-sm font-medium mb-1.5 block flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Heure</label>
            <input id="event-time" type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div>
          <label htmlFor="event-location" className="text-sm font-medium mb-1.5 block flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Lieu</label>
          <input id="event-location" value={location} onChange={e => setLocation(e.target.value)} placeholder="Lieu de rendez-vous"
            className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <label htmlFor="event-group" className="text-sm font-medium mb-1.5 block flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Groupe</label>
          <select id="event-group" value={group} onChange={e => setGroup(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option>Tous</option>
            <option>Groupe A</option>
            <option>Groupe B</option>
            <option>Compétition</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Type</label>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'race'] as const).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${type === t ? 'rct-gradient-hero text-white rct-glow-blue' : 'bg-muted text-muted-foreground'}`}>
                {t === 'daily' ? 'Quotidien' : t === 'weekly' ? 'Hebdo' : 'Course'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="event-description" className="text-sm font-medium mb-1.5 block">Description</label>
          <textarea id="event-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Détails de l'événement..."
            rows={3} className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>

        {error && <p className="text-destructive text-sm font-medium">{error}</p>}

        <button type="submit" disabled={isSubmitting} className="w-full h-12 rct-gradient-hero text-white font-display font-bold rounded-xl rct-glow-blue transition-transform active:scale-[0.98] disabled:opacity-70">
          {isSubmitting ? 'Création...' : 'Créer l\'événement'}
        </button>
      </form>
    </div>
  );
};

export default CreateEventPage;
