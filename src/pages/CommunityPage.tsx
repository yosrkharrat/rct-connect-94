import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StoriesBar from '@/components/StoriesBar';
import PostCard from '@/components/PostCard';
import { postsApi } from '@/lib/api';
import { mapApiPost } from '@/lib/apiMappers';
import { useAuth } from '@/contexts/AuthContext';
import { Post } from '@/types';

const CommunityPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'following' | 'reels'>('all');
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await postsApi.getAll();
        if (response.success && response.data) {
          const mappedPosts = (response.data as any[]).map(mapApiPost);
          setAllPosts(mappedPosts);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const posts = activeTab === 'reels'
    ? allPosts.filter(p => p.type === 'reel')
    : allPosts.filter(p => p.type === 'post');

  return (
    <div className="pb-20 pt-6">
      <div className="px-4 mb-2 flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl">Communauté</h1>
          <p className="text-sm text-muted-foreground">Feed des coureurs RCT</p>
        </div>
        {isLoggedIn && (
          <button onClick={() => navigate('/create-post')}
            className="w-10 h-10 rounded-full rct-gradient-hero flex items-center justify-center rct-glow-blue">
            <Plus className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      <StoriesBar />

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {([
          { key: 'all' as const, label: 'Pour vous' },
          { key: 'following' as const, label: 'Suivis' },
          { key: 'reels' as const, label: 'Reels' },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'rct-gradient-hero text-primary-foreground rct-glow-blue'
                : 'bg-muted text-muted-foreground'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-4">
        {isLoading ? (
          <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
            <p className="text-muted-foreground text-sm">
              {activeTab === 'reels' ? 'Aucun reel pour le moment. Soyez le premier!' : 'Aucune publication'}
            </p>
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
};

export default CommunityPage;
