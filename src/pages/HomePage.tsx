import { useState, useEffect } from 'react';
import { Bell, Plus, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import heroBanner from '@/assets/hero-banner.jpg';
import StoriesBar from '@/components/StoriesBar';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/contexts/AuthContext';
import { postsApi, notificationsApi } from '@/lib/api';
import { mapApiPost } from '@/lib/apiMappers';
import { Post } from '@/types';

const HomePage = () => {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
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
      <div className="relative">
        <img src={heroBanner} alt="Running Club Tunis" className="w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          <button onClick={() => navigate('/history')} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => navigate('/notifications')} className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-white" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-[10px] text-white font-bold flex items-center justify-center">{unread}</span>
            )}
          </button>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-display font-bold text-lg text-white drop-shadow-lg">
            {isLoggedIn ? `Salut ${user?.name.split(' ')[0]}! 🏃‍♂️` : 'Depuis 2016, on court ensemble 🇹🇳'}
          </p>
        </div>
      </div>

      <StoriesBar />

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
        <div>
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
