export type UserRole = 'admin' | 'coach' | 'group_admin' | 'member' | 'visitor';

export interface User {
  id: string;
  name: string;
  cin: string;
  role: UserRole;
  group?: string;
  avatar?: string;
  joinDate: string;
  stats: {
    totalDistance: number;
    totalRuns: number;
    avgPace: string;
    streak: number;
    ranking: number;
  };
  strava?: {
    connected: boolean;
    athleteId?: string;
    accessToken?: string;
  };
}

export interface RCTEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  group: string;
  type: 'daily' | 'weekly' | 'race';
  description: string;
  participants: string[];
  createdBy: string;
  lat?: number;
  lng?: number;
  image?: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  image?: string;
  video?: string;
  likes: string[];
  comments: Comment[];
  distance?: string;
  pace?: string;
  createdAt: string;
  type: 'post' | 'reel';
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  image: string;
  createdAt: string;
  viewers: string[];
  caption?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  image?: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames: string[];
  participantAvatars: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Rating {
  id: string;
  courseId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  distance: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  lat: number;
  lng: number;
  ratings: Rating[];
  description: string;
  image?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'event' | 'social' | 'system' | 'reminder';
  read: boolean;
  createdAt: string;
  link?: string;
}
