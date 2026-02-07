/**
 * API Data Mappers
 * Transform API responses to match frontend types
 */

import { RCTEvent, Post, Comment, User } from '@/types';

// Map API user to User
export function mapApiUser(apiUser: any): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    cin: apiUser.cin || '000', // Default CIN si non fourni
    role: mapUserRole(apiUser.role),
    group: apiUser.group_name || undefined,
    avatar: apiUser.avatar || undefined,
    joinDate: apiUser.created_at ? new Date(apiUser.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    stats: {
      totalDistance: apiUser.distance || 0,
      totalRuns: apiUser.runs || 0,
      avgPace: apiUser.avg_pace || '5:30',
      streak: apiUser.streak || 0,
      ranking: apiUser.ranking || 0,
    },
    strava: apiUser.strava_connected ? {
      connected: true,
      athleteId: apiUser.strava_id || undefined,
      accessToken: undefined,
    } : undefined,
  };
}

// Map user role from API
function mapUserRole(apiRole: string): 'admin' | 'coach' | 'group_admin' | 'member' | 'visitor' {
  const roleMap: Record<string, 'admin' | 'coach' | 'group_admin' | 'member'> = {
    'admin': 'admin',
    'coach': 'coach',
    'group_admin': 'group_admin',
    'member': 'member',
  };
  return roleMap[apiRole] || 'member';
}

// Map API event to RCTEvent
export function mapApiEvent(apiEvent: any): RCTEvent {
  return {
    id: apiEvent.id,
    title: apiEvent.title,
    date: apiEvent.date,
    time: apiEvent.time,
    endTime: apiEvent.end_time,
    location: apiEvent.location,
    group: apiEvent.group_name || 'Tous',
    type: mapEventType(apiEvent.event_type),
    description: apiEvent.description || '',
    participants: [], // L'API retourne participant_count, pas la liste
    createdBy: apiEvent.created_by,
    lat: apiEvent.location_coords ? JSON.parse(apiEvent.location_coords).lat : undefined,
    lng: apiEvent.location_coords ? JSON.parse(apiEvent.location_coords).lng : undefined,
    image: apiEvent.image,
  };
}

// Map event type from API
function mapEventType(apiType: string): 'daily' | 'weekly' | 'race' {
  const typeMap: Record<string, 'daily' | 'weekly' | 'race'> = {
    'Quotidien': 'daily',
    'Hebdomadaire': 'weekly',
    'Hebdo': 'weekly',
    'Course': 'race',
    'Sortie': 'weekly',
    'Entraînement': 'daily',
    'Initiation': 'daily',
  };
  return typeMap[apiType] || 'daily';
}

// Map API post to Post
export function mapApiPost(apiPost: any): Post {
  return {
    id: apiPost.id,
    authorId: apiPost.author_id,
    authorName: apiPost.author?.name || 'Inconnu',
    authorAvatar: apiPost.author?.avatar || '',
    content: apiPost.content || '',
    image: apiPost.image,
    video: apiPost.video,
    likes: [], // L'API retourne like_count et is_liked
    comments: (apiPost.comments || []).map(mapApiComment),
    distance: apiPost.distance ? String(apiPost.distance) : undefined,
    pace: apiPost.pace,
    createdAt: apiPost.created_at,
    type: 'post',
  };
}

// Map API comment to Comment
function mapApiComment(apiComment: any): Comment {
  return {
    id: apiComment.id,
    authorId: apiComment.author_id,
    authorName: apiComment.author?.name || 'Inconnu',
    authorAvatar: apiComment.author?.avatar,
    content: apiComment.content,
    createdAt: apiComment.created_at,
  };
}
