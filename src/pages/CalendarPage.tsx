import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Calendar, Filter, X, MapPin } from 'lucide-react';
import EventCard from '@/components/EventCard';
import { getEvents } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const CalendarPage = () => {
  const navigate = useNavigate();
  const { canCreateEvents } = useAuth();
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState('Tous');

  const firstDay = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const allEvents = getEvents();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get upcoming events (today and future)
  const upcomingEvents = useMemo(() => {
    return allEvents
      .filter(e => new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allEvents]);

  // Filter events
  const filteredEvents = useMemo(() => {
    let events = upcomingEvents;
    
    // Filter by date if selected
    if (selectedDate) {
      events = events.filter(e => e.date === selectedDate);
    }
    
    // Filter by group
    if (filterGroup !== 'Tous') {
      events = events.filter(e => e.group === filterGroup);
    }
    
    return events;
  }, [upcomingEvents, selectedDate, filterGroup]);

  // Get event days for current month
  const eventDays = useMemo(() => {
    return [...new Set(upcomingEvents
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .map(e => new Date(e.date).getDate()))];
  }, [upcomingEvents, currentMonth, currentYear]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const handleDaySelect = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (selectedDate === dateStr) {
      setSelectedDate(null); // Deselect if same date
    } else {
      setSelectedDate(dateStr);
    }
    setShowCalendar(false);
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  const groups = ['Tous', ...new Set(allEvents.map(e => e.group))];

  const formatSelectedDate = () => {
    if (!selectedDate) return null;
    const d = new Date(selectedDate);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  };

  return (
    <div className="pb-20 pt-6">
      {/* Header */}
      <div className="px-4 mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl">Événements</h1>
          <p className="text-sm text-muted-foreground">
            {filteredEvents.length} événement{filteredEvents.length > 1 ? 's' : ''} à venir
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/map')}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center transition-all hover:bg-muted/80"
            title="Voir la carte"
          >
            <MapPin className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              showCalendar || selectedDate ? 'rct-gradient-hero rct-glow-blue' : 'bg-muted'
            }`}
          >
            <Filter className={`w-5 h-5 ${showCalendar || selectedDate ? 'text-white' : ''}`} />
          </button>
          {canCreateEvents && (
            <button 
              onClick={() => navigate('/create-event')}
              className="w-10 h-10 rounded-full rct-gradient-hero flex items-center justify-center rct-glow-blue"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Selected date badge */}
      {selectedDate && (
        <div className="px-4 mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-semibold">{formatSelectedDate()}</span>
            <button onClick={clearDateFilter} className="hover:bg-primary/20 rounded-full p-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Calendar dropdown */}
      {showCalendar && (
        <div className="mx-4 bg-card rounded-2xl rct-shadow-elevated p-4 mb-4 animate-slide-up">
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
            {DAYS.map(d => (
              <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const hasEvent = eventDays.includes(day);
              const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
              const isPast = new Date(currentYear, currentMonth, day) < today;
              
              return (
                <button 
                  key={day} 
                  onClick={() => handleDaySelect(day)}
                  disabled={isPast && !hasEvent}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                    isSelected ? 'rct-gradient-hero text-primary-foreground rct-glow-blue scale-105'
                    : isPast ? 'text-muted-foreground/40'
                    : isToday ? 'ring-2 ring-primary'
                    : hasEvent ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'hover:bg-muted'
                  }`}
                >
                  {day}
                  {hasEvent && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Group filter */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto hide-scrollbar">
        {groups.map(g => (
          <button 
            key={g} 
            onClick={() => setFilterGroup(g)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterGroup === g ? 'rct-gradient-hero text-white' : 'bg-muted text-muted-foreground'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="px-4 space-y-3">
        {filteredEvents.map(event => (
          <EventCard key={event.id} event={event} />
        ))}
        
        {filteredEvents.length === 0 && (
          <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">
              {selectedDate 
                ? 'Aucun événement à cette date'
                : 'Aucun événement à venir'
              }
            </p>
            {selectedDate && (
              <button 
                onClick={clearDateFilter}
                className="text-primary text-sm font-semibold mt-2"
              >
                Voir tous les événements
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
