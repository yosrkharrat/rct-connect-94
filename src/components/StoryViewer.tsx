import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Pause, Play, Trash2 } from 'lucide-react';
import { Story } from '@/types';
import { viewStory } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { storiesApi } from '@/lib/api';

interface StoryViewerProps {
  storyGroups: [string, Story[]][];  // Array of [userId, stories[]]
  initialGroupIndex: number;
  onClose: () => void;
}

const StoryViewer = ({ storyGroups, initialGroupIndex, onClose }: StoryViewerProps) => {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentGroup = storyGroups[groupIndex];
  const currentStories = currentGroup?.[1] || [];
  const story = currentStories[storyIndex];

  useEffect(() => {
    if (user && story) viewStory(story.id, user.id);
  }, [groupIndex, storyIndex, user, story]);

  // Auto-progression
  useEffect(() => {
    setProgress(0);
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          // Story suivante dans le groupe actuel
          if (storyIndex < currentStories.length - 1) {
            setStoryIndex(i => i + 1);
          }
          // Groupe suivant
          else if (groupIndex < storyGroups.length - 1) {
            setGroupIndex(g => g + 1);
            setStoryIndex(0);
          }
          // Fin de toutes les stories
          else {
            onClose();
          }
          return 0;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [groupIndex, storyIndex, currentStories.length, storyGroups.length, onClose, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          e.stopPropagation();
          // Story précédente dans le groupe actuel
          if (storyIndex > 0) {
            setStoryIndex(i => i - 1);
          }
          // Dernière story du groupe précédent
          else if (groupIndex > 0) {
            const prevGroup = storyGroups[groupIndex - 1];
            setGroupIndex(g => g - 1);
            setStoryIndex(prevGroup[1].length - 1);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          e.stopPropagation();
          // Story suivante dans le groupe actuel
          if (storyIndex < currentStories.length - 1) {
            setStoryIndex(i => i + 1);
          }
          // Première story du groupe suivant
          else if (groupIndex < storyGroups.length - 1) {
            setGroupIndex(g => g + 1);
            setStoryIndex(0);
          }
          // Fin de toutes les stories, fermer
          else {
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case ' ':
          e.preventDefault();
          setIsPaused(p => !p);
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    container.focus();
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [groupIndex, storyIndex, currentStories.length, storyGroups, onClose]);

  if (!story) return null;

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    return `${Math.floor(diff / 3600000)}h`;
  };

  const handleDeleteStory = async () => {
    if (!user || story.authorId !== user.id) return;
    if (!confirm('Supprimer cette story ?')) return;
    
    setIsDeleting(true);
    try {
      await storiesApi.delete(story.id);
      // Move to next story or close if last
      if (storyIndex < currentStories.length - 1) {
        setStoryIndex(storyIndex + 1);
      } else if (groupIndex < storyGroups.length - 1) {
        setGroupIndex(groupIndex + 1);
        setStoryIndex(0);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      tabIndex={-1}
      className="fixed inset-0 z-[100] bg-black flex flex-col outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Story de ${story.authorName}, ${storyIndex + 1} sur ${currentStories.length}`}
    >
      {/* Progress bars */}
      <div 
        className="flex gap-1 p-3 pt-[calc(env(safe-area-inset-top,0px)+12px)]"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Story ${storyIndex + 1} sur ${currentStories.length}`}
      >
        {currentStories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%' }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-full rct-gradient-hero flex items-center justify-center"
            role="img"
            aria-label={`Avatar de ${story.authorName}`}
          >
            <span className="text-xs font-bold text-white">{story.authorName.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-white text-sm font-semibold">{story.authorName}</p>
            <p className="text-white/50 text-[11px]">Il y a {formatTime(story.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label={isPaused ? "Reprendre" : "Pause"}
          >
            {isPaused ? <Play className="w-4 h-4 text-white" /> : <Pause className="w-4 h-4 text-white" />}
          </button>
          {user && story.authorId === user.id && (
            <button 
              onClick={handleDeleteStory}
              disabled={isDeleting}
              className="w-9 h-9 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Supprimer cette story"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          )}
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Fermer les stories"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 relative">
        <img 
          src={story.image} 
          alt={story.caption || `Story de ${story.authorName}`} 
          className="w-full h-full object-cover" 
        />

        {/* Navigation zones */}
        <button 
          onClick={() => {
            if (storyIndex > 0) {
              setStoryIndex(storyIndex - 1);
            } else if (groupIndex > 0) {
              const prevGroup = storyGroups[groupIndex - 1];
              setGroupIndex(groupIndex - 1);
              setStoryIndex(prevGroup[1].length - 1);
            }
          }}
          className="absolute left-0 top-0 bottom-0 w-1/3 flex items-center pl-2 hover:bg-black/10 transition-colors"
          disabled={groupIndex === 0 && storyIndex === 0}
          aria-label="Story précédente"
          tabIndex={-1}
        >
          {(groupIndex > 0 || storyIndex > 0) && <ChevronLeft className="w-8 h-8 text-white/50" aria-hidden="true" />}
        </button>
        <button 
          onClick={() => {
            if (storyIndex < currentStories.length - 1) {
              setStoryIndex(storyIndex + 1);
            } else if (groupIndex < storyGroups.length - 1) {
              setGroupIndex(groupIndex + 1);
              setStoryIndex(0);
            } else {
              onClose();
            }
          }}
          className="absolute right-0 top-0 bottom-0 w-1/3 flex items-center justify-end pr-2 hover:bg-black/10 transition-colors"
          aria-label={(storyIndex < currentStories.length - 1 || groupIndex < storyGroups.length - 1) ? "Story suivante" : "Fermer"}
          tabIndex={-1}
        >
          {(storyIndex < currentStories.length - 1 || groupIndex < storyGroups.length - 1) && <ChevronRight className="w-8 h-8 text-white/50" aria-hidden="true" />}
        </button>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-16">
            <p className="text-white text-sm">{story.caption}</p>
          </div>
        )}
      </div>

      {/* Viewers */}
      <div 
        className="px-4 py-3 flex items-center gap-2 bg-black/80" 
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        aria-live="polite"
      >
        <Eye className="w-4 h-4 text-white/50" aria-hidden="true" />
        <span className="text-white/50 text-xs">{story.viewers.length} vues</span>
      </div>

      {/* Screen reader announcement */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Story {storyIndex + 1} sur {currentStories.length} par {story.authorName}. 
        Groupe {groupIndex + 1} sur {storyGroups.length}.
        {isPaused ? "Pause" : "En lecture"}. 
        Utilisez les flèches gauche et droite pour naviguer, espace pour pause, échap pour fermer.
      </div>
    </div>
  );
};

export default StoryViewer;
