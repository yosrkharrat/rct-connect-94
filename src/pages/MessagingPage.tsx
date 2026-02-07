import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { messagesApi } from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const MessagingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await messagesApi.getConversations();
        if (response.success && response.data) {
          setConversations(response.data as any[]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConv) return;
      try {
        const response = await messagesApi.getConversation(selectedConv);
        if (response.success && response.data) {
          setMessages((response.data as any).messages || []);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [selectedConv]);

  if (!user) return null;

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}j`;
  };

  // Chat view
  if (selectedConv) {
    const conv = conversations.find(c => c.id === selectedConv);
    if (!conv) return null;
    const otherId = conv.participantIds.find((id: string) => id !== user.id) || '';
    const otherIdx = conv.participantIds.indexOf(otherId);
    const otherName = conv.participantNames[otherIdx];

    const handleSend = async () => {
      if (!newMsg.trim()) return;
      try {
        await messagesApi.sendMessage(selectedConv, newMsg);
        setNewMsg('');
        const response = await messagesApi.getConversation(selectedConv);
        if (response.success && response.data) {
          setMessages((response.data as any).messages || []);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    };

    return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 bg-card border-b border-border safe-top">
          <button onClick={() => setSelectedConv(null)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar className="w-10 h-10">
            <AvatarFallback className="rct-gradient-hero text-white font-display text-sm font-bold">
              {otherName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-display font-bold text-sm">{otherName}</p>
            <p className="text-[11px] text-accent">En ligne</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map(m => {
            const isMine = m.senderId === user.id;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? 'rct-gradient-hero text-white rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  <p>{m.content}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-card border-t border-border safe-bottom">
          <div className="flex gap-2">
            <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Votre message..."
              className="flex-1 h-11 px-4 rounded-full bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={handleSend}
              className="w-11 h-11 rounded-full rct-gradient-hero flex items-center justify-center rct-glow-blue transition-transform active:scale-90">
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversations list
  return (
    <div className="pb-20 pt-6">
      <div className="flex items-center gap-3 px-4 mb-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-extrabold text-xl">Messages</h1>
      </div>

      {/* Conversations */}
      <div className="px-4 space-y-2">
        {conversations.map(conv => {
          const otherId = conv.participantIds.find(id => id !== user.id) || '';
          const otherIdx = conv.participantIds.indexOf(otherId);
          const otherName = conv.participantNames[otherIdx];
          return (
            <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
              className="w-full bg-card rounded-2xl rct-shadow-card p-4 flex items-center gap-3 text-left">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="rct-gradient-hero text-white font-display font-bold">
                  {otherName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-display font-semibold text-sm">{otherName}</p>
                  <span className="text-[10px] text-muted-foreground">{formatTime(conv.lastMessageTime)}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full rct-gradient-hero text-[10px] text-white font-bold flex items-center justify-center">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          );
        })}

        {conversations.length === 0 && !isLoading && (
          <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
            <p className="text-muted-foreground text-sm">Aucune conversation</p>
          </div>
        )}
        
        {isLoading && (
          <div className="bg-card rounded-2xl rct-shadow-card p-8 text-center">
            <p className="text-muted-foreground text-sm">Chargement...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;
