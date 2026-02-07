import { useState, useEffect } from 'react';
import { Bell, Plus, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBanner from '@/assets/hero-banner.jpg';
import rctLogo from '@/assets/rct-logo.svg';
import StoriesBar from '@/components/StoriesBar';
import PostCard from '@/components/PostCard';
import EventCard from '@/components/EventCard';
import { useAuth } from '@/contexts/AuthContext';
import { eventsApi, postsApi, notificationsApi } from '@/lib/api';
import { mapApiEvent, mapApiPost } from '@/lib/apiMappers';
import { RCTEvent, Post } from '@/types';

const HomePage = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<RCTEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch events
        const eventsResponse = await eventsApi.getAll();
        if (eventsResponse.success && eventsResponse.data) {
          const mappedEvents = (eventsResponse.data as any[]).map(mapApiEvent);
          setEvents(mappedEvents.slice(0, 3));
        }

        // Fetch posts
        const postsResponse = await postsApi.getAll({ limit: 5 });
        if (postsResponse.success && postsResponse.data) {
          const mappedPosts = (postsResponse.data as any[]).map(mapApiPost);
          setPosts(mappedPosts);
        }

        // Fetch unread notifications count
        if (user) {
          const notifResponse = await notificationsApi.getAll({ unreadOnly: true });
          if (notifResponse.success && notifResponse.data) {
            setUnread((notifResponse.data as any[]).length);
          }
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="pb-20">
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <img src={heroBanner} alt="Running Club Tunis" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-2">
          <div className="flex items-center gap-2">
            <img src={rctLogo} alt="RCT Logo" className="h-12 w-12 drop-shadow-lg" />
            <div>
              <h1 className="font-display font-extrabold text-xl text-primary-foreground drop-shadow-lg">RCT</h1>
              <p className="text-[11px] text-primary-foreground/80 font-body drop-shadow">Running Club Tunis</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/history')} className="w-10 h-10 rounded-full bg-card/20 backdrop-blur-md flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </button>
            <button onClick={() => navigate('/notifications')} className="w-10 h-10 rounded-full bg-card/20 backdrop-blur-md flex items-center justify-center relative">
              <Bell className="w-5 h-5 text-primary-foreground" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-[10px] text-white font-bold flex items-center justify-center">{unread}</span>
              )}
            </button>
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-display font-bold text-lg text-primary-foreground drop-shadow-lg">
            {isLoggedIn ? `Salut ${user?.name.split(' ')[0]}! 🏃‍♂️` : 'Depuis 2016, on court ensemble 🇹🇳'}
          </p>
        </div>
      </div>

      <StoriesBar />

      {/* Events */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg">Événements à venir</h2>
          <button onClick={() => navigate('/calendar')} className="text-xs text-primary font-semibold">Voir tout →</button>
        </div>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-4">Chargement...</div>
          ) : events.length > 0 ? (
            events.map(event => <EventCard key={event.id} event={event} />)
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">Aucun événement à venir</div>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-lg">Actualités</h2>
          {isLoggedIn && (
            <button onClick={() => navigate('/create-post')} className="flex items-center gap-1 text-xs text-primary font-semibold">
              <Plus className="w-3.5 h-3.5" /> Publier
            </button>
          )}
        </div>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-4">Chargement...</div>
          ) : posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center text-sm text-muted-foreground py-4">Aucune publication</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
