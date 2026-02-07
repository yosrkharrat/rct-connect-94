import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { getStories, createStory } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import StoryViewer from '@/components/StoryViewer';
import type { Story } from '@/types';

const StoriesBar = () => {
  const { user, isLoggedIn } = useAuth();
  const stories = getStories();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedStoryIdx, setSelectedStoryIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  // Group stories by user
  const storyGroups = stories.reduce<Record<string, Story[]>>((acc, s) => {
    if (!acc[s.authorId]) acc[s.authorId] = [];
    acc[s.authorId].push(s);
    return acc;
  }, {});

  const groupEntries = Object.entries(storyGroups);

  const openStory = (idx: number) => {
    setSelectedStoryIdx(idx);
    setViewerOpen(true);
  };

  const handleAddStory = () => {
    fileRef.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newStory: Story = {
        id: Date.now().toString(),
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar || '',
        image: reader.result as string,
        createdAt: new Date().toISOString(),
        viewers: [],
      };
      createStory(newStory);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      <div className="px-4 mb-4">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Add Story */}
          {isLoggedIn && (
            <button onClick={handleAddStory} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center bg-muted">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">Ajouter</span>
            </button>
          )}

          {/* Story avatars */}
          {groupEntries.map(([userId, userStories], idx) => {
            const hasUnviewed = userStories.some(s => user && !s.viewers.includes(user.id));
            return (
              <button key={userId} onClick={() => openStory(idx)} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-16 h-16 rounded-full p-[2px] ${hasUnviewed ? 'rct-gradient-hero' : 'bg-muted'}`}>
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {userStories[0]?.authorName.split(' ').map(n => n[0]).join('') || '?'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium truncate w-16 text-center">
                  {userStories[0]?.authorName.split(' ')[0] || 'User'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {viewerOpen && (
        <StoryViewer
          storyGroups={groupEntries}
          initialGroupIndex={selectedStoryIdx}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
};

export default StoriesBar;
