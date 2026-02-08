/**
 * RCT Connect API Client
 * Handles all communication with the backend API
 * Falls back to localStorage when the backend is unreachable
 */

import {
  initStore, getUsers, getUser, getEvents, getEvent, getPosts, getPost,
  getStories, getCourses, getCourse, getNotifications, getConversations,
  getMessages, createEvent as storeCreateEvent, updateEvent as storeUpdateEvent,
  deleteEvent as storeDeleteEvent, joinEvent as storeJoinEvent, leaveEvent as storeLeaveEvent,
  createPost as storeCreatePost, toggleLike as storeToggleLike, addComment as storeAddComment,
  createStory as storeCreateStory, viewStory as storeViewStory, addRating as storeAddRating,
  markNotificationRead as storeMarkNotifRead, markAllNotificationsRead as storeMarkAllNotifsRead,
  sendMessage as storeSendMessage, updateUser as storeUpdateUser,
} from './store';
import type { User, RCTEvent, Post, Story, Course, AppNotification, Comment, Message, Conversation, Rating } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Track whether backend is available - optimistic start
let backendAvailable: boolean | null = null;
let healthCheckPromise: Promise<boolean> | null = null;

// Non-blocking health check - starts immediately on module load
function startHealthCheck(): Promise<boolean> {
  if (healthCheckPromise) return healthCheckPromise;
  healthCheckPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${API_BASE_URL}/health`, { 
        signal: controller.signal,
        method: 'HEAD' // Faster than GET
      });
      clearTimeout(timeoutId);
      backendAvailable = res.ok;
    } catch {
      backendAvailable = false;
    }
    // Re-check every 30 seconds
    setTimeout(() => { 
      backendAvailable = null; 
      healthCheckPromise = null;
    }, 30000);
    return backendAvailable;
  })();
  return healthCheckPromise;
}

// Start health check immediately (non-blocking)
startHealthCheck();

async function checkBackend(): Promise<boolean> {
  // If we already know, return immediately
  if (backendAvailable !== null) return backendAvailable;
  // Wait for the already-started check
  return startHealthCheck();
}

// Token management
let authToken: string | null = localStorage.getItem('rct_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('rct_token', token);
  } else {
    localStorage.removeItem('rct_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

// API Response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: 'Erreur de connexion au serveur',
    };
  }
}

// ============ OFFLINE-CAPABLE HELPER ============
// Tries the API first; if backend unavailable, runs the offline fallback
async function withFallback<T>(
  apiFn: () => Promise<ApiResponse<T>>,
  offlineFn: () => ApiResponse<T>,
): Promise<ApiResponse<T>> {
  const online = await checkBackend();
  if (online) {
    const result = await apiFn();
    if (result.success) return result;
    // If API failed, try offline as last resort
    try { return offlineFn(); } catch { return result; }
  }
  initStore();
  return offlineFn();
}

// ============ AUTH API ============

export const authApi = {
  login: async (email: string, password: string) => {
    return withFallback(
      () => request<{ user: any; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
      () => {
        // Offline: find user by name (email field used as name in offline mode)
        const users = getUsers();
        const user = users.find(u => u.name.toLowerCase() === email.toLowerCase() || u.cin === password);
        if (user) {
          localStorage.setItem('rct_currentUser', JSON.stringify(user));
          return { success: true, data: { user, token: 'offline-token-' + user.id } };
        }
        // If no match, allow login with first user for demo
        const defaultUser = users[0];
        localStorage.setItem('rct_currentUser', JSON.stringify(defaultUser));
        return { success: true, data: { user: defaultUser, token: 'offline-token-' + defaultUser.id } };
      }
    );
  },

  register: (data: { name: string; email: string; password: string }) =>
    request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: async () => {
    return withFallback(
      () => request<{ user: any }>('/auth/me'),
      () => {
        const saved = localStorage.getItem('rct_currentUser');
        if (saved) {
          return { success: true, data: { user: JSON.parse(saved) } };
        }
        return { success: false, error: 'Non connecté' };
      }
    );
  },

  logout: () => {
    localStorage.removeItem('rct_currentUser');
    return Promise.resolve({ success: true, message: 'Déconnexion réussie' } as ApiResponse);
  },

  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ============ USERS API ============

export const usersApi = {
  getAll: (params?: { role?: string; group?: string }) => {
    return withFallback(
      () => {
        const searchParams = new URLSearchParams();
        if (params?.role) searchParams.set('role', params.role);
        if (params?.group) searchParams.set('group', params.group);
        const query = searchParams.toString();
        return request<any[]>(`/users${query ? `?${query}` : ''}`);
      },
      () => {
        let users = getUsers();
        if (params?.role) users = users.filter(u => u.role === params.role);
        if (params?.group) users = users.filter(u => u.group === params.group);
        return { success: true, data: users as any[] };
      }
    );
  },

  getById: (id: string) => {
    return withFallback(
      () => request<any>(`/users/${id}`),
      () => {
        const user = getUser(id);
        return user ? { success: true, data: user as any } : { success: false, error: 'Utilisateur non trouvé' };
      }
    );
  },

  update: (id: string, data: Partial<any>) =>
    request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request(`/users/${id}`, { method: 'DELETE' }),

  updateStats: (id: string, stats: { distance?: number; runs?: number }) =>
    request<any>(`/users/${id}/stats`, {
      method: 'PUT',
      body: JSON.stringify(stats),
    }),

  connectStrava: (id: string, stravaId: string) =>
    request<any>(`/users/${id}/strava`, {
      method: 'POST',
      body: JSON.stringify({ stravaId }),
    }),

  disconnectStrava: (id: string) =>
    request(`/users/${id}/strava`, { method: 'DELETE' }),
};

// ============ STRAVA API ============

export const stravaApi = {
  getAuthUrl: () =>
    request<{ authUrl: string }>('/strava/auth'),

  exchangeCode: (code: string, state: string) =>
    request<{ athleteId: string; firstName: string; lastName: string; profile: string }>('/strava/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    }),

  getActivities: () =>
    request<any[]>('/strava/activities'),

  getStats: () =>
    request<any>('/strava/stats'),

  getAthlete: () =>
    request<any>('/strava/athlete'),

  disconnect: () =>
    request('/strava/disconnect', { method: 'DELETE' }),

  syncDistance: () =>
    request<{ distance: number; runs: number }>('/strava/sync-distance', { method: 'POST' }),
};

// ============ EVENTS API ============

export const eventsApi = {
  getAll: (params?: { date?: string; group?: string; type?: string }) => {
    return withFallback(
      () => {
        const searchParams = new URLSearchParams();
        if (params?.date) searchParams.set('date', params.date);
        if (params?.group) searchParams.set('group', params.group);
        if (params?.type) searchParams.set('type', params.type);
        const query = searchParams.toString();
        return request<any[]>(`/events${query ? `?${query}` : ''}`);
      },
      () => {
        let events = getEvents();
        if (params?.date) events = events.filter(e => e.date === params.date);
        if (params?.group) events = events.filter(e => e.group === params.group);
        if (params?.type) events = events.filter(e => e.type === params.type);
        return { success: true, data: events as any[] };
      }
    );
  },

  getById: (id: string) => {
    return withFallback(
      () => request<any>(`/events/${id}`),
      () => {
        const event = getEvent(id);
        return event ? { success: true, data: event as any } : { success: false, error: 'Événement non trouvé' };
      }
    );
  },

  create: (data: {
    title: string;
    description?: string;
    date: string;
    time: string;
    location: string;
    location_coords?: { lat: number; lng: number };
    distance?: number;
    group_name?: string;
    event_type?: string;
    max_participants?: number;
  }) => {
    return withFallback(
      () => request<any>('/events', { method: 'POST', body: JSON.stringify(data) }),
      () => {
        const newEvent: RCTEvent = {
          id: 'e_' + Date.now(),
          title: data.title,
          date: data.date,
          time: data.time,
          location: data.location,
          group: data.group_name || 'Tous',
          type: 'daily',
          description: data.description || '',
          participants: [],
          createdBy: 'u1',
          lat: data.location_coords?.lat,
          lng: data.location_coords?.lng,
        };
        storeCreateEvent(newEvent);
        return { success: true, data: newEvent as any };
      }
    );
  },

  update: (id: string, data: Partial<any>) =>
    request<any>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    withFallback(
      () => request(`/events/${id}`, { method: 'DELETE' }),
      () => { storeDeleteEvent(id); return { success: true }; }
    ),

  join: (id: string) =>
    withFallback(
      () => request<any>(`/events/${id}/join`, { method: 'POST' }),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        if (u.id) storeJoinEvent(id, u.id);
        return { success: true, data: getEvent(id) as any };
      }
    ),

  leave: (id: string) =>
    withFallback(
      () => request(`/events/${id}/leave`, { method: 'DELETE' }),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        if (u.id) storeLeaveEvent(id, u.id);
        return { success: true };
      }
    ),

  getParticipants: (id: string) =>
    withFallback(
      () => request<any[]>(`/events/${id}/participants`),
      () => {
        const event = getEvent(id);
        if (!event) return { success: false, error: 'Événement non trouvé' };
        const users = event.participants.map(pid => getUser(pid)).filter(Boolean);
        return { success: true, data: users as any[] };
      }
    ),
};

// ============ POSTS API ============

export const postsApi = {
  getAll: (params?: { limit?: number; offset?: number; authorId?: string }) => {
    return withFallback(
      () => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.offset) searchParams.set('offset', String(params.offset));
        if (params?.authorId) searchParams.set('authorId', params.authorId);
        const query = searchParams.toString();
        return request<any[]>(`/posts${query ? `?${query}` : ''}`);
      },
      () => {
        let posts = getPosts();
        if (params?.authorId) posts = posts.filter(p => p.authorId === params.authorId);
        const offset = params?.offset || 0;
        const limit = params?.limit || posts.length;
        return { success: true, data: posts.slice(offset, offset + limit) as any[] };
      }
    );
  },

  getById: (id: string) => {
    return withFallback(
      () => request<any>(`/posts/${id}`),
      () => {
        const post = getPost(id);
        return post ? { success: true, data: post as any } : { success: false, error: 'Publication non trouvée' };
      }
    );
  },

  create: (data: { content: string; image?: string }) => {
    return withFallback(
      () => request<any>('/posts', { method: 'POST', body: JSON.stringify(data) }),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        const newPost: Post = {
          id: 'p_' + Date.now(),
          authorId: u.id || 'u1',
          authorName: u.name || 'Utilisateur',
          authorAvatar: u.avatar || '',
          content: data.content,
          image: data.image,
          likes: [],
          comments: [],
          createdAt: new Date().toISOString(),
          type: 'post',
        };
        storeCreatePost(newPost);
        return { success: true, data: newPost as any };
      }
    );
  },

  update: (id: string, data: { content?: string; image?: string }) =>
    request<any>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request(`/posts/${id}`, { method: 'DELETE' }),

  toggleLike: (id: string) =>
    withFallback(
      () => request<{ liked: boolean; likeCount: number }>(`/posts/${id}/like`, { method: 'POST' }),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        if (u.id) storeToggleLike(id, u.id);
        const post = getPost(id);
        return { success: true, data: { liked: post?.likes.includes(u.id) || false, likeCount: post?.likes.length || 0 } };
      }
    ),

  getComments: (postId: string) =>
    withFallback(
      () => request<any[]>(`/posts/${postId}/comments`),
      () => {
        const post = getPost(postId);
        return { success: true, data: (post?.comments || []) as any[] };
      }
    ),

  addComment: (postId: string, content: string) =>
    withFallback(
      () => request<any>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        const comment: Comment = {
          id: 'c_' + Date.now(),
          authorId: u.id || 'u1',
          authorName: u.name || 'Utilisateur',
          authorAvatar: u.avatar,
          content,
          createdAt: new Date().toISOString(),
        };
        storeAddComment(postId, comment);
        return { success: true, data: comment as any };
      }
    ),

  deleteComment: (postId: string, commentId: string) =>
    request(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),
};

// ============ STORIES API ============

export const storiesApi = {
  getAll: () =>
    withFallback(
      () => request<any[]>('/stories'),
      () => ({ success: true, data: getStories() as any[] })
    ),

  getById: (id: string) =>
    withFallback(
      () => request<any>(`/stories/${id}`),
      () => {
        const story = getStories().find(s => s.id === id);
        return story ? { success: true, data: story as any } : { success: false, error: 'Story non trouvée' };
      }
    ),

  create: (data: { image: string; caption?: string }) =>
    withFallback(
      () => request<any>('/stories', { method: 'POST', body: JSON.stringify(data) }),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        const story: Story = {
          id: 's_' + Date.now(),
          authorId: u.id || 'u1',
          authorName: u.name || 'Utilisateur',
          authorAvatar: u.avatar || '',
          image: data.image,
          caption: data.caption,
          createdAt: new Date().toISOString(),
          viewers: [],
        };
        storeCreateStory(story);
        return { success: true, data: story as any };
      }
    ),

  delete: (id: string) =>
    request(`/stories/${id}`, { method: 'DELETE' }),

  markViewed: (id: string) =>
    withFallback(
      () => request(`/stories/${id}/view`, { method: 'POST' }),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        if (u.id) storeViewStory(id, u.id);
        return { success: true };
      }
    ),
};

// ============ COURSES API ============

export const coursesApi = {
  getAll: (params?: { difficulty?: string; minDistance?: number; maxDistance?: number }) => {
    return withFallback(
      () => {
        const searchParams = new URLSearchParams();
        if (params?.difficulty) searchParams.set('difficulty', params.difficulty);
        if (params?.minDistance) searchParams.set('minDistance', String(params.minDistance));
        if (params?.maxDistance) searchParams.set('maxDistance', String(params.maxDistance));
        const query = searchParams.toString();
        return request<any[]>(`/courses${query ? `?${query}` : ''}`);
      },
      () => {
        let courses = getCourses();
        if (params?.difficulty) courses = courses.filter(c => c.difficulty === params.difficulty);
        return { success: true, data: courses as any[] };
      }
    );
  },

  getById: (id: string) =>
    withFallback(
      () => request<any>(`/courses/${id}`),
      () => {
        const course = getCourse(id);
        return course ? { success: true, data: course as any } : { success: false, error: 'Parcours non trouvé' };
      }
    ),

  create: (data: {
    name: string;
    description?: string;
    distance: number;
    difficulty?: string;
    location: string;
    start_point: { lat: number; lng: number };
    route_points?: Array<{ lat: number; lng: number }>;
  }) =>
    request<any>('/courses', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: Partial<any>) =>
    request<any>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    request(`/courses/${id}`, { method: 'DELETE' }),

  rate: (id: string, rating: number, comment?: string) =>
    withFallback(
      () => request<any>(`/courses/${id}/rate`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        const r: Rating = {
          id: 'r_' + Date.now(),
          courseId: id,
          userId: u.id || 'u1',
          userName: u.name || 'Utilisateur',
          rating,
          comment: comment || '',
          createdAt: new Date().toISOString(),
        };
        storeAddRating(id, r);
        return { success: true, data: r as any };
      }
    ),
};

// ============ NOTIFICATIONS API ============

export const notificationsApi = {
  getAll: (params?: { unreadOnly?: boolean }) =>
    withFallback(
      () => {
        const searchParams = new URLSearchParams();
        if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
        const query = searchParams.toString();
        return request<any[]>(`/notifications${query ? `?${query}` : ''}`);
      },
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        let notifs = getNotifications(u.id || 'u1');
        if (params?.unreadOnly) notifs = notifs.filter(n => !n.read);
        return { success: true, data: notifs as any[] };
      }
    ),

  markRead: (id: string) =>
    withFallback(
      () => request(`/notifications/${id}/read`, { method: 'PUT' }),
      () => { storeMarkNotifRead(id); return { success: true }; }
    ),

  markAllRead: () =>
    withFallback(
      () => request('/notifications/read-all', { method: 'PUT' }),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        storeMarkAllNotifsRead(u.id || 'u1');
        return { success: true };
      }
    ),

  delete: (id: string) =>
    request(`/notifications/${id}`, { method: 'DELETE' }),
};

// ============ MESSAGES API ============

export const messagesApi = {
  getConversations: () =>
    withFallback(
      () => request<any[]>('/messages/conversations'),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        return { success: true, data: getConversations(u.id || 'u1') as any[] };
      }
    ),

  getConversation: (id: string, params?: { limit?: number; before?: string }) =>
    withFallback(
      () => {
        const searchParams = new URLSearchParams();
        if (params?.limit) searchParams.set('limit', String(params.limit));
        if (params?.before) searchParams.set('before', params.before);
        const query = searchParams.toString();
        return request<any>(`/messages/conversations/${id}${query ? `?${query}` : ''}`);
      },
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        const convs = getConversations(u.id || 'u1');
        const conv = convs.find(c => c.id === id);
        if (!conv) return { success: false, error: 'Conversation non trouvée' };
        const otherId = conv.participantIds.find(pid => pid !== (u.id || 'u1')) || '';
        const msgs = getMessages(u.id || 'u1', otherId);
        return { success: true, data: { conversation: conv, messages: msgs } as any };
      }
    ),

  startConversation: (participantId: string) =>
    request<any>('/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ participant_id: participantId }),
    }),

  sendMessage: (conversationId: string, content: string) =>
    withFallback(
      () => request<any>(`/messages/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
      () => {
        const u = JSON.parse(localStorage.getItem('rct_currentUser') || '{}');
        const convs = getConversations(u.id || 'u1');
        const conv = convs.find(c => c.id === conversationId);
        const otherId = conv?.participantIds.find(pid => pid !== (u.id || 'u1')) || '';
        const msg: Message = {
          id: 'm_' + Date.now(),
          senderId: u.id || 'u1',
          receiverId: otherId,
          content,
          createdAt: new Date().toISOString(),
          read: false,
        };
        storeSendMessage(msg);
        return { success: true, data: msg as any };
      }
    ),

  markRead: (messageId: string) =>
    request(`/messages/${messageId}/read`, { method: 'PUT' }),

  deleteConversation: (id: string) =>
    request(`/messages/conversations/${id}`, { method: 'DELETE' }),
};

// ============ SETTINGS API ============

export const settingsApi = {
  get: () => request<any>('/settings'),

  update: (data: {
    theme?: 'light' | 'dark' | 'system';
    language?: 'fr' | 'en' | 'ar';
    notifications_enabled?: boolean;
    email_notifications?: boolean;
  }) =>
    request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateTheme: (theme: 'light' | 'dark' | 'system') =>
    request('/settings/theme', {
      method: 'PUT',
      body: JSON.stringify({ theme }),
    }),

  updateLanguage: (language: 'fr' | 'en' | 'ar') =>
    request('/settings/language', {
      method: 'PUT',
      body: JSON.stringify({ language }),
    }),
};

// ============ EVENT CHAT API ============

export interface EventChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  created_at: string;
}

export interface EventChatGroup {
  id: string;
  name: string;
  description: string | null;
  event_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EventChatMember {
  user_id: string;
  name: string;
  avatar: string | null;
  role: 'admin' | 'member';
  joined_at: string;
}

export const eventChatApi = {
  // Get chat group for an event
  getGroup: (eventId: string) =>
    request<EventChatGroup>(`/event-chat/${eventId}/group`),

  // Get messages for event chat
  getMessages: (eventId: string) =>
    request<EventChatMessage[]>(`/event-chat/${eventId}/messages`),

  // Send message to event chat
  sendMessage: (eventId: string, content: string) =>
    request<EventChatMessage>(`/event-chat/${eventId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // Get chat members
  getMembers: (eventId: string) =>
    request<EventChatMember[]>(`/event-chat/${eventId}/members`),
};

// ============ HEALTH CHECK ============

export const healthCheck = () => request('/health');

// Export all APIs
export default {
  auth: authApi,
  users: usersApi,
  events: eventsApi,
  posts: postsApi,
  stories: storiesApi,
  courses: coursesApi,
  notifications: notificationsApi,
  messages: messagesApi,
  settings: settingsApi,
  eventChat: eventChatApi,
  healthCheck,
  setAuthToken,
  getAuthToken,
};
