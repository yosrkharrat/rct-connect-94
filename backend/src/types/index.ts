export type UserRole = 'admin' | 'coach' | 'group_admin' | 'member' | 'visitor';
export type RunningLevel = 'débutant' | 'intermédiaire' | 'élite';

export interface User {
  id: string;
  name: string;
  cin: string;
  password_hash: string;
  role: UserRole;
  level: RunningLevel;
  group_name: string | null;
  avatar: string | null;
  join_date: string;
  total_distance: number;
  total_runs: number;
  avg_pace: string;
  streak: number;
  ranking: number;
  strava_connected: boolean;
  strava_athlete_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPublic {
  id: string;
  name: string;
  role: UserRole;
  level: RunningLevel;
  group_name: string | null;
  avatar: string | null;
  join_date: string;
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
  };
}

export interface RCTEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  end_time: string | null;
  location: string;
  group_name: string;
  type: 'daily' | 'weekly' | 'race';
  description: string;
  created_by: string;
  lat: number | null;
  lng: number | null;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  event_id: string;
  user_id: string;
  joined_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image: string | null;
  video: string | null;
  distance: string | null;
  pace: string | null;
  type: 'post' | 'reel';
  created_at: string;
  updated_at: string;
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Story {
  id: string;
  author_id: string;
  image: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
}

export interface StoryView {
  story_id: string;
  user_id: string;
  viewed_at: string;
}

export interface Course {
  id: string;
  name: string;
  distance: string;
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  lat: number;
  lng: number;
  description: string;
  image: string | null;
  created_at: string;
}

export interface Rating {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'event' | 'social' | 'system' | 'reminder';
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

// Auth types
export interface JWTPayload {
  userId: string;
  role: UserRole;
}

export interface LoginRequest {
  name: string;
  cin: string;
}

export interface AuthResponse {
  token: string;
  user: UserPublic;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
