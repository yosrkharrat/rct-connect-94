import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, ChevronRight } from 'lucide-react';
import type { RCTEvent } from '@/types';

interface EventCardProps {
  event: RCTEvent;
}

const typeBadge = (type: RCTEvent['type']) => {
  switch (type) {
    case 'daily': return { label: 'Quotidien', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' };
    case 'weekly': return { label: 'Hebdo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
    case 'race': return { label: 'Course', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' };
    default: return { label: type, color: 'bg-muted text-muted-foreground' };
  }
};

const EventCard = ({ event }: EventCardProps) => {
  const navigate = useNavigate();
  const badge = typeBadge(event.type);
  const date = new Date(event.date);
  const day = date.getDate();
  const month = date.toLocaleDateString('fr-FR', { month: 'short' });

  return (
    <article>
      <button
        onClick={() => navigate(`/event/${event.id}`)}
        className="w-full bg-card rounded-2xl rct-shadow-card p-4 flex items-center gap-4 
                   active:scale-[.98] transition-transform text-left
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={`${event.title}, ${badge.label}, le ${day} ${month} à ${event.time}`}
      >
        {/* Date badge */}
        <div 
          className="w-14 h-14 rounded-xl rct-gradient-hero flex flex-col items-center justify-center text-white flex-shrink-0"
          role="img"
          aria-label={`${day} ${month}`}
        >
          <span className="text-lg font-extrabold leading-none">{day}</span>
          <span className="text-[10px] uppercase font-semibold">{month}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm truncate">{event.title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" /> 
              <span className="sr-only">Heure:</span>
              {event.time}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" aria-hidden="true" /> 
              <span className="sr-only">Lieu:</span>
              {event.location}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" aria-hidden="true" />
            <span>{event.participants?.length || 0} participant{(event.participants?.length || 0) > 1 ? 's' : ''}</span>
            {event.group && <span className="ml-2 text-primary font-medium">• {event.group}</span>}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
      </button>
    </article>
  );
};

export default EventCard;
