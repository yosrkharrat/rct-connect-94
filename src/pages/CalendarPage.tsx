import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import EventCard from '@/components/EventCard';
import { eventsApi } from '@/lib/api';
import { mapApiEvent } from '@/lib/apiMappers';
import { useAuth } from '@/contexts/AuthContext';
import { RCTEvent } from '@/types';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const CalendarPage = () => {
  const navigate = useNavigate();
  const { canCreateEvents } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(1); // Feb
  const [currentYear, setCurrentYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [filterGroup, setFilterGroup] = useState('Tous');
  const [allEvents, setAllEvents] = useState<RCTEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await eventsApi.getAll();
        if (response.success && response.data) {
          const mappedEvents = (response.data as any[]).map(mapApiEvent);
          setAllEvents(mappedEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const firstDay = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthEvents = allEvents.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const eventDays = [...new Set(monthEvents.map(e => new Date(e.date).getDate()))];

  const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
  const dayEvents = allEvents.filter(e => {
    const match = e.date === selectedDateStr;
    if (filterGroup === 'Tous') return match;
    return match && e.group === filterGroup;
  });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(1);
  };

  const groups = ['Tous', ...new Set(allEvents.map(e => e.group))];

  return (
    <div className="pb-20 pt-6">
      <div className="px-4 mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl">Calendrier</h1>
          <p className="text-sm text-muted-foreground">Événements et sorties</p>
        </div>
        {canCreateEvents && (
          <button onClick={() => navigate('/create-event')}
            className="w-10 h-10 rounded-full rct-gradient-hero flex items-center justify-center rct-glow-blue">
            <Plus className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Calendar grid */}
      <div className="mx-4 bg-card rounded-2xl rct-shadow-card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h3 className="font-display font-bold">{MONTHS[currentMonth]} {currentYear}</h3>
          <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map(d => <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
            const isSelected = day === selectedDay;
            const hasEvent = eventDays.includes(day);
            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
            return (
              <button key={day} onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                  isSelected ? 'rct-gradient-hero text-primary-foreground rct-glow-blue scale-105'
                  : isToday ? 'ring-2 ring-primary'
                  : 'hover:bg-muted'
                }`}>
                {day}
                {hasEvent && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 px-4 mb-3 overflow-x-auto hide-scrollbar">
        {groups.map(g => (
          <button key={g} onClick={() => setFilterGroup(g)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterGroup === g ? 'rct-gradient-hero text-white' : 'bg-muted text-muted-foreground'
            }`}>
            {g}
          </button>
        ))}
      </div>

      {/* Day events */}
      <div className="px-4">
        <h3 className="font-display font-bold mb-3">{selectedDay} {MONTHS[currentMonth]}</h3>
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
              <p className="text-muted-foreground text-sm">Chargement...</p>
            </div>
          ) : dayEvents.length > 0 ? (
            dayEvents.map(event => <EventCard key={event.id} event={event} />)
          ) : (
            <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
              <p className="text-muted-foreground text-sm">Aucun événement ce jour</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
