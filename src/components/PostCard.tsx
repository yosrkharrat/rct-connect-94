import { useState } from 'react';
import { Heart, MessageCircle, Share2, Send } from 'lucide-react';
import { toggleLike, addComment, getUsers } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import type { Post, Comment } from '@/types';

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const users = getUsers();
  const author = users.find(u => u.id === post.authorId);
  const [liked, setLiked] = useState(user ? post.likes?.includes(user.id) : false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);

  const handleLike = () => {
    if (!user) return;
    toggleLike(post.id, user.id);
    if (liked) {
      setLikeCount(c => c - 1);
    } else {
      setLikeCount(c => c + 1);
    }
    setLiked(!liked);
  };

  const handleComment = () => {
    if (!user || !commentText.trim()) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      authorId: user.id,
      authorName: user.name,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    addComment(post.id, newComment);
    setComments(prev => [...prev, newComment]);
    setCommentText('');
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}j`;
  };

  return (
    <div className="bg-card rounded-2xl rct-shadow-card overflow-hidden">
      {/* Author header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <div className="w-9 h-9 rounded-full rct-gradient-hero flex items-center justify-center text-white text-sm font-bold">
          {author?.name.split(' ').map(n => n[0]).join('') || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{author?.name || 'Inconnu'}</p>
          <p className="text-[11px] text-muted-foreground">{timeAgo(post.createdAt)}</p>
        </div>
        {post.distance && (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-semibold">
              {post.distance} km
            </span>
            {post.pace && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                {post.pace}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-2 text-sm">{post.content}</p>
      )}

      {/* Image */}
      {post.image && (
        <div className="w-full aspect-[4/3] bg-muted overflow-hidden">
          <img src={post.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-5">
        <button onClick={handleLike} className="flex items-center gap-1.5 transition-all active:scale-90">
          <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          <span className="text-sm font-medium">{likeCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5">
          <MessageCircle className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm font-medium">{comments.length}</span>
        </button>
        <button className="ml-auto">
          <Share2 className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
          {comments.map(c => {
            const commenter = users.find(u => u.id === c.authorId);
            return (
              <div key={c.id} className="text-sm">
                <span className="font-bold">{commenter?.name || 'Inconnu'}</span>{' '}
                <span className="text-muted-foreground">{c.content}</span>
              </div>
            );
          })}
          {user && (
            <div className="flex items-center gap-2 mt-2">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
                placeholder="Commenter..."
                className="flex-1 bg-muted rounded-full px-3 py-2 text-sm outline-none"
              />
              <button onClick={handleComment}
                className="w-8 h-8 rounded-full rct-gradient-hero flex items-center justify-center">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
