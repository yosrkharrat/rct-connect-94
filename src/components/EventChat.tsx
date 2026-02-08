import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Users, Loader2 } from 'lucide-react';
import { eventChatApi, EventChatMessage, EventChatMember } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface EventChatProps {
  eventId: string;
  eventTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

const EventChat = ({ eventId, eventTitle, isOpen, onClose }: EventChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<EventChatMessage[]>([]);
  const [members, setMembers] = useState<EventChatMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages and members
  useEffect(() => {
    if (isOpen && eventId) {
      loadData();
      // Poll for new messages every 5 seconds
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, eventId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadMessages(), loadMembers()]);
    setLoading(false);
  };

  const loadMessages = async () => {
    try {
      const response = await eventChatApi.getMessages(eventId);
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await eventChatApi.getMembers(eventId);
      if (response.success && response.data) {
        setMembers(response.data);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await eventChatApi.sendMessage(eventId, newMessage.trim());
      if (response.success && response.data) {
        setMessages([...messages, response.data]);
        setNewMessage('');
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full h-[600px] flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-display font-bold text-sm">{eventTitle}</h2>
              <p className="text-xs text-muted-foreground">{members.length} participant{members.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMembers(!showMembers)}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              aria-label="Voir les membres"
            >
              <Users className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages */}
          <div className={`flex-1 flex flex-col ${showMembers ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun message encore</p>
                    <p className="text-xs text-muted-foreground mt-1">Soyez le premier à écrire !</p>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isOwn = message.sender_id === user?.id;
                    return (
                      <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                          {!isOwn && (
                            <div className="flex items-center gap-2 mb-1">
                              {message.sender_avatar ? (
                                <img src={message.sender_avatar} alt={message.sender_name} className="w-6 h-6 rounded-full" width={24} height={24} />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">
                                    {message.sender_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {message.sender_name}
                              </span>
                            </div>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isOwn
                                ? 'bg-primary text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez un message..."
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                  aria-label="Envoyer le message"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Members Sidebar */}
          {showMembers && (
            <div className="w-64 overflow-y-auto p-4">
              <h3 className="font-display font-bold text-sm mb-3">Participants ({members.length})</h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.user_id} className="flex items-center gap-2">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full" width={32} height={32} />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      {member.role === 'admin' && (
                        <p className="text-xs text-primary">Organisateur</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventChat;
