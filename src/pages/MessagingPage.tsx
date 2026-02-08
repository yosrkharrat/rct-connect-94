import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Users, MessageCircle, Mic } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getChatGroups, getChatMessages, sendChatMessage, createChatGroup, getUsers, addNotification } from '@/lib/store';
import { ChatGroup, ChatMessage, User } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

const MessagingPage = () => {
  const { user, isAdmin, isCoach, isGroupAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [voiceDraft, setVoiceDraft] = useState<{ to: string; message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canSendMessages = isAdmin || isCoach || isGroupAdmin;
  const canCreateGroups = isAdmin;

  useEffect(() => {
    if (!user) return;
    setGroups(getChatGroups(user.id));
    setAllUsers(getUsers().filter(u => u.id !== user.id));
  }, [user]);

  // Check for voice-filled message
  useEffect(() => {
    const draft = sessionStorage.getItem('voice_message_draft');
    if (draft) {
      try {
        const data = JSON.parse(draft);
        setVoiceDraft(data);
        if (data.message) {
          setNewMsg(data.message);
        }
        // Try to find and select the matching group
        if (data.to && groups.length > 0) {
          const matchingGroup = groups.find(g => 
            g.name.toLowerCase().includes(data.to.toLowerCase())
          );
          if (matchingGroup) {
            setSelectedGroup(matchingGroup.id);
          }
        }
        sessionStorage.removeItem('voice_message_draft');
      } catch (e) {
        console.error('Error parsing voice draft:', e);
      }
    }
  }, [groups]);

  useEffect(() => {
    if (selectedGroup) {
      setMessages(getChatMessages(selectedGroup));
    }
  }, [selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!user) return null;

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}j`;
  };

  const handleSend = () => {
    if (!newMsg.trim() || !selectedGroup || !canSendMessages) return;

    const message: ChatMessage = {
      id: 'cm_' + Date.now(),
      groupId: selectedGroup,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content: newMsg.trim(),
      createdAt: new Date().toISOString(),
    };

    sendChatMessage(message);
    setMessages(getChatMessages(selectedGroup));
    setGroups(getChatGroups(user.id));
    setNewMsg('');

    // Send notifications to members
    const group = groups.find(g => g.id === selectedGroup);
    if (group) {
      group.memberIds.filter(id => id !== user.id).forEach(memberId => {
        addNotification({
          id: 'n_' + Date.now() + '_' + memberId,
          userId: memberId,
          title: `Nouveau message - ${group.name}`,
          message: `${user.name}: ${newMsg.substring(0, 50)}${newMsg.length > 50 ? '...' : ''}`,
          type: 'social',
          read: false,
          createdAt: new Date().toISOString(),
          link: '/messaging',
        });
      });
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) return;

    const group: ChatGroup = {
      id: 'cg_' + Date.now(),
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || undefined,
      memberIds: [user.id, ...selectedMembers],
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    };

    createChatGroup(group);
    setGroups(getChatGroups(user.id));
    setShowCreateGroup(false);
    setNewGroupName('');
    setNewGroupDesc('');
    setSelectedMembers([]);

    // Send notifications to new members
    selectedMembers.forEach(memberId => {
      addNotification({
        id: 'n_' + Date.now() + '_' + memberId,
        userId: memberId,
        title: 'Nouveau groupe de discussion',
        message: `Vous avez été ajouté au groupe "${group.name}"`,
        type: 'social',
        read: false,
        createdAt: new Date().toISOString(),
        link: '/messaging',
      });
    });
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">Admin</span>;
      case 'coach':
        return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold">Coach</span>;
      case 'group_admin':
        return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-semibold">Resp.</span>;
      default:
        return null;
    }
  };

  // Chat view
  if (selectedGroup) {
    const group = groups.find(g => g.id === selectedGroup);
    if (!group) return null;

    return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 bg-card border-b border-border safe-top">
          <button onClick={() => setSelectedGroup(null)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full rct-gradient-hero flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm truncate">{group.name}</p>
            <p className="text-[11px] text-muted-foreground">{group.memberIds.length} membres</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map(m => {
            const isMine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isMine ? '' : 'flex gap-2'}`}>
                  {!isMine && (
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="rct-gradient-hero text-white text-xs font-bold">
                        {m.senderName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'rct-gradient-hero text-white rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    {!isMine && (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-xs">{m.senderName}</p>
                        {getRoleBadge(m.senderRole)}
                      </div>
                    )}
                    <p>{m.content}</p>
                    <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-muted-foreground'}`}>
                      {formatTime(m.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - only for admins/coaches */}
        {canSendMessages ? (
          <div className="px-4 py-3 bg-card border-t border-border safe-bottom">
            {voiceDraft && newMsg && (
              <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium w-fit">
                <Mic className="w-3 h-3" /> Message préparé par l'assistant
              </div>
            )}
            <div className="flex gap-2">
              <input
                id="message-input"
                aria-label="Écrire un message"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Votre message..."
                className="flex-1 h-11 px-4 rounded-full bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                disabled={!newMsg.trim()}
                className="w-11 h-11 rounded-full rct-gradient-hero flex items-center justify-center rct-glow-blue transition-transform active:scale-90 disabled:opacity-50"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 bg-muted/50 border-t border-border safe-bottom">
            <p className="text-center text-sm text-muted-foreground">
              Seuls les coachs et admins peuvent envoyer des messages
            </p>
          </div>
        )}
      </div>
    );
  }

  // Groups list
  return (
    <div className="pb-20 pt-6">
      <div className="flex items-center justify-between px-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-extrabold text-xl">Messages</h1>
        </div>
        {canCreateGroups && (
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-10 h-10 rounded-full rct-gradient-hero flex items-center justify-center rct-glow-blue"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Groups */}
      <div className="px-4 space-y-2">
        {groups.map(group => (
          <button
            key={group.id}
            onClick={() => setSelectedGroup(group.id)}
            className="w-full bg-card rounded-2xl rct-shadow-card p-4 flex items-center gap-3 text-left"
          >
            <div className="w-12 h-12 rounded-full rct-gradient-hero flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold text-sm truncate">{group.name}</p>
                {group.lastMessageTime && (
                  <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                    {formatTime(group.lastMessageTime)}
                  </span>
                )}
              </div>
              {group.lastMessage ? (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  <span className="font-medium">{group.lastMessageSender}:</span> {group.lastMessage}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">Aucun message</p>
              )}
              <p className="text-[10px] text-muted-foreground/70 mt-1">{group.memberIds.length} membres</p>
            </div>
          </button>
        ))}

        {groups.length === 0 && (
          <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">Aucun groupe de discussion</p>
            {canCreateGroups && (
              <button
                onClick={() => setShowCreateGroup(true)}
                className="text-primary text-sm font-semibold mt-2"
              >
                Créer un groupe
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="font-display">Nouveau groupe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="group-name" className="text-sm font-medium mb-1.5 block">Nom du groupe</label>
              <Input
                id="group-name"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Ex: Groupe A - Entraînements"
              />
            </div>
            <div>
              <label htmlFor="group-description" className="text-sm font-medium mb-1.5 block">Description (optionnel)</label>
              <Input
                id="group-description"
                value={newGroupDesc}
                onChange={e => setNewGroupDesc(e.target.value)}
                placeholder="Description du groupe..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Membres ({selectedMembers.length} sélectionnés)</label>
              <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2">
                {allUsers.map(u => (
                  <label
                    key={u.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedMembers.includes(u.id)}
                      onCheckedChange={() => toggleMember(u.id)}
                    />
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-muted text-xs font-semibold">
                        {u.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">{u.group} • {u.role}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreateGroup(false)}>
                Annuler
              </Button>
              <Button
                className="flex-1 rct-gradient-hero text-white"
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedMembers.length === 0}
              >
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessagingPage;
