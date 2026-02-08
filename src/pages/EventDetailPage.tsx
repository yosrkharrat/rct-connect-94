import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Share2, UserPlus, UserMinus, MessageCircle } from 'lucide-react';
import { eventsApi } from '@/lib/api';
import { mapApiEvent } from '@/lib/apiMappers';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { RCTEvent } from '@/types';
import EventChat from '@/components/EventChat';

const typeStyles: Record<string, string> = {
  daily: 'bg-primary/10 text-primary',
  weekly: 'bg-secondary/10 text-secondary',
  race: 'bg-accent/10 text-accent',
};
const typeLabels: Record<string, string> = { daily: 'Quotidien', weekly: 'Hebdomadaire', race: 'Course' };

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<RCTEvent | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await eventsApi.getById(id);
        if (response.success && response.data) {
          const mappedEvent = mapApiEvent(response.data);
          setEvent(mappedEvent);
          setIsJoined(user ? (response.data as any).is_joined : false);
          
          const partsResponse = await eventsApi.getParticipants(id);
          if (partsResponse.success && partsResponse.data) {
            setParticipants(partsResponse.data as any[]);
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, user]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  );

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Événement introuvable</p>
    </div>
  );

  const handleJoin = async () => {
    if (!user || !id) return;
    try {
      if (isJoined) {
        await eventsApi.leave(id);
      } else {
        await eventsApi.join(id);
      }
      setIsJoined(!isJoined);
      const partsResponse = await eventsApi.getParticipants(id);
      if (partsResponse.success && partsResponse.data) {
        setParticipants(partsResponse.data as any[]);
      }
    } catch (error) {
      console.error('Error joining/leaving event:', error);
    }
  };

  return (
    <div className="pb-20 pt-6">
      <div className="flex items-center gap-3 px-4 mb-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-extrabold text-xl flex-1">Détail</h1>
        <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="mx-4 bg-card rounded-2xl rct-shadow-elevated p-6 mb-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeStyles[event.type]}`}>
          {typeLabels[event.type]}
        </span>
        <h2 className="font-display font-extrabold text-2xl mt-3">{event.title}</h2>
        <p className="text-sm text-muted-foreground mt-2">{event.description}</p>

        <div className="grid grid-cols-2 gap-3 mt-5">
          {[
            { icon: Calendar, label: event.date, sub: 'Date' },
            { icon: Clock, label: event.time, sub: 'Heure' },
            { icon: MapPin, label: event.location, sub: 'Lieu' },
            { icon: Users, label: event.group, sub: 'Groupe' },
          ].map(item => (
            <div key={item.sub} className="bg-muted rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-[11px] text-muted-foreground">{item.sub}</span>
              </div>
              <p className="text-sm font-semibold">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Participants */}
      <div className="mx-4 bg-card rounded-2xl rct-shadow-card p-4 mb-4">
        <h3 className="font-display font-bold text-base mb-3">
          Participants ({participants.length})
        </h3>
        <div className="space-y-2">
          {participants.map(p => p && (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl bg-muted">
              <div className="w-9 h-9 rounded-full rct-gradient-hero flex items-center justify-center">
                <span className="text-xs font-bold text-white">{p.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.group || 'Membre'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Join / Leave */}
      {user && (
        <div className="mx-4 space-y-3">
          <button onClick={handleJoin}
            className={`w-full h-12 font-display font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
              isJoined
                ? 'bg-destructive/10 text-destructive border border-destructive/30'
                : 'rct-gradient-hero text-white rct-glow-blue'
            }`}>
            {isJoined ? <><UserMinus className="w-5 h-5" /> Quitter l'événement</> : <><UserPlus className="w-5 h-5" /> Participer</>}
          </button>

          {/* Chat Button - Only visible if user is joined */}
          {isJoined && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-full h-12 bg-card border-2 border-primary text-primary font-display font-bold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] hover:bg-primary/10"
              aria-label="Ouvrir le chat de groupe"
            >
              <MessageCircle className="w-5 h-5" />
              Chat de groupe
            </button>
          )}
        </div>
      )}

      {/* Event Chat Modal */}
      {id && event && isJoined && (
        <EventChat
          eventId={id}
          eventTitle={event.title}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
