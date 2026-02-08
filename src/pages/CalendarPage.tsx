import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, Calendar, MapPin, Trophy, Medal, Award, ChevronDown, ChevronUp, Crown, Users } from 'lucide-react';
import EventCard from '@/components/EventCard';
import { getEvents, getUsers } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Sample leaderboard data for expired events (in real app, would come from API)
const generateLeaderboard = (eventId: string, participants: string[]) => {
  const users = getUsers();
  return participants.slice(0, 5).map((id, index) => {
    const user = users.find(u => u.id === id);
    return {
      rank: index + 1,
      name: user?.name || 'Participant',
      group: user?.group || 'Non assigné',
      time: `${Math.floor(Math.random() * 30 + 20)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      distance: (Math.random() * 5 + 5).toFixed(1),
    };
  });
};

// All-time leaderboard by group
const GROUPS = ['Débutants', 'Intermédiaires', 'Confirmés', 'Élite'];

const getAllTimeLeaderboard = () => {
  const users = getUsers();
  return GROUPS.map(group => ({
    group,
    leaders: users
      .filter(u => u.group === group)
      .sort((a, b) => (b.stats?.totalDistance || 0) - (a.stats?.totalDistance || 0))
      .slice(0, 3)
      .map((u, i) => ({
        rank: i + 1,
        name: u.name,
        totalDistance: u.stats?.totalDistance || 0,
        totalRuns: u.stats?.totalRuns || 0,
      })),
  }));
};

// Generate next 14 days for horizontal date selector
const generateDateRange = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const { user, canCreateEvents, isLoggedIn } = useAuth();
  const { t, language } = useLanguage();
  const dateScrollRef = useRef<HTMLDivElement>(null);
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState('Tous');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const dateRange = useMemo(() => generateDateRange(), []);

  const allEvents = getEvents();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get upcoming events (today and future)
  const upcomingEvents = useMemo(() => {
    return allEvents
      .filter(e => new Date(e.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allEvents]);

  // Get expired events (past)
  const expiredEvents = useMemo(() => {
    return allEvents
      .filter(e => new Date(e.date) < today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [allEvents]);

  // Filter events based on tab and filters
  const filteredEvents = useMemo(() => {
    let events = activeTab === 'upcoming' ? upcomingEvents : expiredEvents;
    
    if (selectedDate) {
      events = events.filter(e => e.date === selectedDate);
    }
    
    if (filterGroup !== 'Tous') {
      events = events.filter(e => e.group === filterGroup || e.group === 'Tous');
    }
    
    return events;
  }, [upcomingEvents, expiredEvents, activeTab, selectedDate, filterGroup]);

  // Get events for date range
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return upcomingEvents.filter(e => e.date === dateStr).length;
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    if (selectedDate === dateStr) {
      setSelectedDate(null);
    } else {
      setSelectedDate(dateStr);
      setActiveTab('upcoming');
    }
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'tn' ? 'ar-TN' : language === 'en' ? 'en-US' : 'fr-FR', { weekday: 'short' }).slice(0, 3);
  };

  const formatMonthName = (date: Date) => {
    return date.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'tn' ? 'ar-TN' : language === 'en' ? 'en-US' : 'fr-FR', { month: 'short' });
  };

  const groups = ['Tous', ...new Set(allEvents.map(e => e.group).filter(g => g !== 'Tous'))];

  return (
    <div className="pb-20 min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl">{t('events.title', 'Événements')}</h1>
            <p className="text-sm text-muted-foreground">
              {upcomingEvents.length} {t('events.upcoming', 'à venir')}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => navigate('/map')}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center transition-all hover:bg-muted/80"
            >
              <MapPin className="w-5 h-5" />
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

        {/* Horizontal Date Selector */}
        <div 
          ref={dateScrollRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4"
        >
          {dateRange.map((date, idx) => {
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = selectedDate === dateStr;
            const isToday = idx === 0;
            const eventCount = getEventsForDate(date);
            
            return (
              <button
                key={dateStr}
                onClick={() => handleDateSelect(date)}
                className={`flex-shrink-0 w-14 py-2 px-1 rounded-xl flex flex-col items-center transition-all ${
                  isSelected 
                    ? 'rct-gradient-hero text-white rct-glow-blue' 
                    : isToday 
                      ? 'bg-primary/10 text-primary border-2 border-primary'
                      : 'bg-muted hover:bg-muted/80'
                }`}
              >
                <span className="text-[10px] font-medium uppercase">{formatDayName(date)}</span>
                <span className="text-lg font-bold">{date.getDate()}</span>
                <span className="text-[10px]">{formatMonthName(date)}</span>
                {eventCount > 0 && !isSelected && (
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-secondary" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="px-4 py-3 space-y-3">
        {/* Tab Toggle */}
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => { setActiveTab('upcoming'); setSelectedDate(null); }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'upcoming'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            <Calendar className="w-4 h-4" />
            {t('events.upcoming', 'À venir')} ({upcomingEvents.length})
          </button>
          <button
            onClick={() => { setActiveTab('past'); setSelectedDate(null); }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'past'
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            <Trophy className="w-4 h-4" />
            {t('events.past', 'Terminés')} ({expiredEvents.length})
          </button>
        </div>

        {/* Group Filter Pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {groups.map(g => (
            <button 
              key={g} 
              onClick={() => setFilterGroup(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filterGroup === g 
                  ? 'rct-gradient-hero text-white' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Users className="w-3 h-3" />
              {g === 'Tous' ? t('filter.all', 'Tous') : g}
            </button>
          ))}
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="flex items-center justify-between bg-primary/10 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2 text-primary">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {new Date(selectedDate).toLocaleDateString(
                  language === 'ar' ? 'ar-TN' : language === 'tn' ? 'ar-TN' : language === 'en' ? 'en-US' : 'fr-FR',
                  { weekday: 'long', day: 'numeric', month: 'long' }
                )}
              </span>
            </div>
            <button 
              onClick={() => setSelectedDate(null)}
              className="text-primary text-xs font-semibold hover:underline"
            >
              {t('filter.clear', 'Effacer')}
            </button>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="px-4 space-y-3">
        {filteredEvents.length > 0 ? (
          <>
            {activeTab === 'upcoming' ? (
              // Upcoming events - use EventCard
              filteredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              // Past events - show with leaderboard
              filteredEvents.map(event => {
                const leaderboard = generateLeaderboard(event.id, event.participants);
                const isExpanded = expandedEvent === event.id;

                return (
                  <div key={event.id} className="bg-card rounded-2xl rct-shadow-card overflow-hidden">
                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                      className="w-full p-4 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString(
                            language === 'ar' ? 'ar-TN' : language === 'tn' ? 'ar-TN' : language === 'en' ? 'en-US' : 'fr-FR',
                            { day: 'numeric', month: 'short', year: 'numeric' }
                          )} • {event.participants.length} {t('events.participants', 'participants')}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-border pt-3 animate-in slide-in-from-top duration-200">
                        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                          {t('events.leaderboard', 'Classement')}
                        </p>
                        <div className="space-y-2">
                          {leaderboard.map((entry, i) => (
                            <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                              i === 0 ? 'bg-yellow-500/10' : i === 1 ? 'bg-gray-400/10' : i === 2 ? 'bg-orange-600/10' : 'bg-muted/50'
                            }`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-muted'
                              }`}>
                                {i < 3 ? (
                                  <Crown className="w-4 h-4 text-white" />
                                ) : (
                                  <span className="text-xs font-bold text-muted-foreground">{entry.rank}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{entry.name}</p>
                                <p className="text-[10px] text-muted-foreground">{entry.group}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold">{entry.time}</p>
                                <p className="text-[10px] text-muted-foreground">{entry.distance} km</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        ) : (
          <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium mb-1">
              {selectedDate 
                ? t('events.noEventsDate', 'Aucun événement à cette date')
                : activeTab === 'upcoming'
                  ? t('events.noUpcoming', 'Aucun événement à venir')
                  : t('events.noPast', 'Aucun événement terminé')
              }
            </p>
            {selectedDate && (
              <button 
                onClick={() => setSelectedDate(null)}
                className="text-primary text-sm font-semibold mt-2 hover:underline"
              >
                {t('events.viewAll', 'Voir tous les événements')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* All-Time Leaderboard Section */}
      {activeTab === 'past' && (
        <div className="px-4 mt-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-purple-500" />
            <h2 className="font-display font-bold text-lg">{t('events.generalRanking', 'Classement général')}</h2>
          </div>
          
          <div className="space-y-3">
            {getAllTimeLeaderboard().map(({ group, leaders }) => (
              <div key={group} className="bg-card rounded-2xl rct-shadow-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Medal className="w-4 h-4 text-primary" />
                  <p className="font-semibold text-sm">{group}</p>
                </div>
                {leaders.length > 0 ? (
                  <div className="space-y-2">
                    {leaders.map((leader, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${
                        i === 0 ? 'bg-yellow-500/10' : i === 1 ? 'bg-gray-400/10' : 'bg-orange-600/10'
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-600'
                        }`}>
                          {leader.rank}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{leader.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{leader.totalDistance.toFixed(0)} km</p>
                          <p className="text-[10px] text-muted-foreground">{leader.totalRuns} {t('events.runs', 'sorties')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    {t('events.noRunners', 'Aucun coureur dans ce groupe')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
