import Database from 'better-sqlite3';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Database Types
export interface DbUser {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar: string | null;
  role: 'admin' | 'coach' | 'member';
  group_name: string | null;
  distance: number;
  runs: number;
  joined_events: number;
  strava_connected: boolean | number;
  strava_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  location: string;
  location_coords: string | null;
  distance: number;
  group_name: string;
  event_type: string;
  max_participants: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbEventParticipant {
  event_id: string;
  user_id: string;
  joined_at: string;
}

export interface DbPost {
  id: string;
  author_id: string;
  content: string;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface DbComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface DbStory {
  id: string;
  user_id: string;
  image: string;
  caption: string | null;
  expires_at: string;
  created_at: string;
}

export interface DbStoryView {
  story_id: string;
  user_id: string;
  viewed_at: string;
}

export interface DbCourse {
  id: string;
  name: string;
  description: string | null;
  distance: number;
  difficulty: string;
  location: string;
  start_point: string;
  route_points: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbRating {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  read: boolean | number;
  created_at: string;
}

export interface DbConversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface DbConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean | number;
  created_at: string;
}

export interface DbUserSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: 'fr' | 'en' | 'ar';
  notifications_enabled: boolean | number;
  email_notifications: boolean | number;
}

export interface DbChatGroup {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DbChatGroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface DbChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

// Initialize database
const dbPath = process.env.DATABASE_PATH || './data/rct.db';
const dataDir = dirname(dbPath);

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create tables
function initializeTables() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'coach', 'member')),
      group_name TEXT,
      distance REAL DEFAULT 0,
      runs INTEGER DEFAULT 0,
      joined_events INTEGER DEFAULT 0,
      strava_connected INTEGER DEFAULT 0,
      strava_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Events table
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      location TEXT NOT NULL,
      location_coords TEXT,
      distance REAL DEFAULT 0,
      group_name TEXT,
      event_type TEXT,
      max_participants INTEGER,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Event Participants table
    CREATE TABLE IF NOT EXISTS event_participants (
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Posts table
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    -- Post Likes table
    CREATE TABLE IF NOT EXISTS post_likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Comments table
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    -- Stories table
    CREATE TABLE IF NOT EXISTS stories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      image TEXT NOT NULL,
      caption TEXT,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Story Views table
    CREATE TABLE IF NOT EXISTS story_views (
      story_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      viewed_at TEXT NOT NULL,
      PRIMARY KEY (story_id, user_id),
      FOREIGN KEY (story_id) REFERENCES stories(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Courses table
    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      distance REAL DEFAULT 0,
      difficulty TEXT,
      location TEXT,
      start_point TEXT,
      route_points TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Ratings table
    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      related_id TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Conversations table
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Conversation Participants table
    CREATE TABLE IF NOT EXISTS conversation_participants (
      conversation_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (conversation_id, user_id),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Messages table
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    -- User Settings table
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'system' CHECK(theme IN ('light', 'dark', 'system')),
      language TEXT DEFAULT 'fr' CHECK(language IN ('fr', 'en', 'ar')),
      notifications_enabled INTEGER DEFAULT 1,
      email_notifications INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Chat Groups table
    CREATE TABLE IF NOT EXISTS chat_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- Chat Group Members table
    CREATE TABLE IF NOT EXISTS chat_group_members (
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'member')),
      joined_at TEXT NOT NULL,
      PRIMARY KEY (group_id, user_id),
      FOREIGN KEY (group_id) REFERENCES chat_groups(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Chat Messages table
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES chat_groups(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
    CREATE INDEX IF NOT EXISTS idx_events_group ON events(group_name);
    CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_group ON chat_messages(group_id);
  `);
}

// Initialize tables on startup
initializeTables();

// Database Helper class with methods for all operations
class DatabaseHelper {
  // Users
  getAllUsers(): DbUser[] {
    return db.prepare('SELECT * FROM users').all() as DbUser[];
  }

  getUserById(id: string): DbUser | undefined {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
  }

  getUserByEmail(email: string): DbUser | undefined {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUser | undefined;
  }

  createUser(user: DbUser): void {
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, name, avatar, role, group_name, distance, runs, joined_events, strava_connected, strava_id, created_at, updated_at)
      VALUES (@id, @email, @password, @name, @avatar, @role, @group_name, @distance, @runs, @joined_events, @strava_connected, @strava_id, @created_at, @updated_at)
    `);
    stmt.run({ ...user, strava_connected: user.strava_connected ? 1 : 0 });
  }

  updateUser(id: string, updates: Partial<DbUser>): void {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    if (updates.strava_connected !== undefined) {
      updates.strava_connected = updates.strava_connected ? 1 : 0;
    }
    const stmt = db.prepare(`UPDATE users SET ${setClause}, updated_at = @updated_at WHERE id = @id`);
    stmt.run({ ...updates, id, updated_at: new Date().toISOString() });
  }

  deleteUser(id: string): void {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  // Events
  getAllEvents(): DbEvent[] {
    return db.prepare('SELECT * FROM events ORDER BY date, time').all() as DbEvent[];
  }

  getEventById(id: string): DbEvent | undefined {
    return db.prepare('SELECT * FROM events WHERE id = ?').get(id) as DbEvent | undefined;
  }

  createEvent(event: DbEvent): void {
    const stmt = db.prepare(`
      INSERT INTO events (id, title, description, date, time, location, location_coords, distance, group_name, event_type, max_participants, created_by, created_at, updated_at)
      VALUES (@id, @title, @description, @date, @time, @location, @location_coords, @distance, @group_name, @event_type, @max_participants, @created_by, @created_at, @updated_at)
    `);
    stmt.run(event);
  }

  updateEvent(id: string, updates: Partial<DbEvent>): void {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    const stmt = db.prepare(`UPDATE events SET ${setClause}, updated_at = @updated_at WHERE id = @id`);
    stmt.run({ ...updates, id, updated_at: new Date().toISOString() });
  }

  deleteEvent(id: string): void {
    db.prepare('DELETE FROM event_participants WHERE event_id = ?').run(id);
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
  }

  // Event Participants
  getEventParticipants(eventId: string): DbEventParticipant[] {
    return db.prepare('SELECT * FROM event_participants WHERE event_id = ?').all(eventId) as DbEventParticipant[];
  }

  addEventParticipant(participant: DbEventParticipant): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO event_participants (event_id, user_id, joined_at)
      VALUES (@event_id, @user_id, @joined_at)
    `);
    stmt.run(participant);
  }

  removeEventParticipant(eventId: string, userId: string): void {
    db.prepare('DELETE FROM event_participants WHERE event_id = ? AND user_id = ?').run(eventId, userId);
  }

  // Posts
  getAllPosts(): DbPost[] {
    return db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all() as DbPost[];
  }

  getPostById(id: string): DbPost | undefined {
    return db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as DbPost | undefined;
  }

  createPost(post: DbPost): void {
    const stmt = db.prepare(`
      INSERT INTO posts (id, author_id, content, image, created_at, updated_at)
      VALUES (@id, @author_id, @content, @image, @created_at, @updated_at)
    `);
    stmt.run(post);
  }

  updatePost(id: string, updates: Partial<DbPost>): void {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    const stmt = db.prepare(`UPDATE posts SET ${setClause}, updated_at = @updated_at WHERE id = @id`);
    stmt.run({ ...updates, id, updated_at: new Date().toISOString() });
  }

  deletePost(id: string): void {
    db.prepare('DELETE FROM post_likes WHERE post_id = ?').run(id);
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(id);
    db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  }

  // Post Likes
  getPostLikes(postId: string): DbPostLike[] {
    return db.prepare('SELECT * FROM post_likes WHERE post_id = ?').all(postId) as DbPostLike[];
  }

  addPostLike(like: DbPostLike): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO post_likes (post_id, user_id, created_at)
      VALUES (@post_id, @user_id, @created_at)
    `);
    stmt.run(like);
  }

  removePostLike(postId: string, userId: string): void {
    db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(postId, userId);
  }

  // Comments
  getCommentsByPost(postId: string): DbComment[] {
    return db.prepare('SELECT * FROM comments WHERE post_id = ? ORDER BY created_at').all(postId) as DbComment[];
  }

  createComment(comment: DbComment): void {
    const stmt = db.prepare(`
      INSERT INTO comments (id, post_id, author_id, content, created_at)
      VALUES (@id, @post_id, @author_id, @content, @created_at)
    `);
    stmt.run(comment);
  }

  deleteComment(id: string): void {
    db.prepare('DELETE FROM comments WHERE id = ?').run(id);
  }

  // Stories
  getAllStories(): DbStory[] {
    return db.prepare("SELECT * FROM stories WHERE expires_at > datetime('now') ORDER BY created_at DESC").all() as DbStory[];
  }

  getStoryById(id: string): DbStory | undefined {
    return db.prepare('SELECT * FROM stories WHERE id = ?').get(id) as DbStory | undefined;
  }

  createStory(story: DbStory): void {
    const stmt = db.prepare(`
      INSERT INTO stories (id, user_id, image, caption, expires_at, created_at)
      VALUES (@id, @user_id, @image, @caption, @expires_at, @created_at)
    `);
    stmt.run(story);
  }

  deleteStory(id: string): void {
    db.prepare('DELETE FROM story_views WHERE story_id = ?').run(id);
    db.prepare('DELETE FROM stories WHERE id = ?').run(id);
  }

  // Story Views
  getStoryViews(storyId: string): DbStoryView[] {
    return db.prepare('SELECT * FROM story_views WHERE story_id = ?').all(storyId) as DbStoryView[];
  }

  addStoryView(view: DbStoryView): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO story_views (story_id, user_id, viewed_at)
      VALUES (@story_id, @user_id, @viewed_at)
    `);
    stmt.run(view);
  }

  // Courses
  getAllCourses(): DbCourse[] {
    return db.prepare('SELECT * FROM courses ORDER BY name').all() as DbCourse[];
  }

  getCourseById(id: string): DbCourse | undefined {
    return db.prepare('SELECT * FROM courses WHERE id = ?').get(id) as DbCourse | undefined;
  }

  createCourse(course: DbCourse): void {
    const stmt = db.prepare(`
      INSERT INTO courses (id, name, description, distance, difficulty, location, start_point, route_points, created_by, created_at, updated_at)
      VALUES (@id, @name, @description, @distance, @difficulty, @location, @start_point, @route_points, @created_by, @created_at, @updated_at)
    `);
    stmt.run(course);
  }

  updateCourse(id: string, updates: Partial<DbCourse>): void {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    const stmt = db.prepare(`UPDATE courses SET ${setClause}, updated_at = @updated_at WHERE id = @id`);
    stmt.run({ ...updates, id, updated_at: new Date().toISOString() });
  }

  deleteCourse(id: string): void {
    db.prepare('DELETE FROM ratings WHERE course_id = ?').run(id);
    db.prepare('DELETE FROM courses WHERE id = ?').run(id);
  }

  // Ratings
  getCourseRatings(courseId: string): DbRating[] {
    return db.prepare('SELECT * FROM ratings WHERE course_id = ?').all(courseId) as DbRating[];
  }

  createRating(rating: DbRating): void {
    const stmt = db.prepare(`
      INSERT INTO ratings (id, course_id, user_id, rating, comment, created_at)
      VALUES (@id, @course_id, @user_id, @rating, @comment, @created_at)
    `);
    stmt.run(rating);
  }

  // Notifications
  getUserNotifications(userId: string): DbNotification[] {
    return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(userId) as DbNotification[];
  }

  createNotification(notification: DbNotification): void {
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, related_id, read, created_at)
      VALUES (@id, @user_id, @type, @title, @message, @related_id, @read, @created_at)
    `);
    stmt.run({ ...notification, read: notification.read ? 1 : 0 });
  }

  markNotificationRead(id: string): void {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(id);
  }

  markAllNotificationsRead(userId: string): void {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
  }

  // Conversations
  getAllConversations(): DbConversation[] {
    return db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all() as DbConversation[];
  }

  getConversationById(id: string): DbConversation | undefined {
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as DbConversation | undefined;
  }

  createConversation(conversation: DbConversation): void {
    const stmt = db.prepare(`
      INSERT INTO conversations (id, created_at, updated_at)
      VALUES (@id, @created_at, @updated_at)
    `);
    stmt.run(conversation);
  }

  // Conversation Participants
  getConversationParticipants(conversationId: string): DbConversationParticipant[] {
    return db.prepare('SELECT * FROM conversation_participants WHERE conversation_id = ?').all(conversationId) as DbConversationParticipant[];
  }

  addConversationParticipant(participant: DbConversationParticipant): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO conversation_participants (conversation_id, user_id, joined_at)
      VALUES (@conversation_id, @user_id, @joined_at)
    `);
    stmt.run(participant);
  }

  // Messages
  getConversationMessages(conversationId: string): DbMessage[] {
    return db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at').all(conversationId) as DbMessage[];
  }

  createMessage(message: DbMessage): void {
    const stmt = db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, content, read, created_at)
      VALUES (@id, @conversation_id, @sender_id, @content, @read, @created_at)
    `);
    stmt.run({ ...message, read: message.read ? 1 : 0 });
  }

  markMessageRead(id: string): void {
    db.prepare('UPDATE messages SET read = 1 WHERE id = ?').run(id);
  }

  // User Settings
  getUserSettings(userId: string): DbUserSettings | undefined {
    return db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as DbUserSettings | undefined;
  }

  createUserSettings(settings: DbUserSettings): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_settings (user_id, theme, language, notifications_enabled, email_notifications)
      VALUES (@user_id, @theme, @language, @notifications_enabled, @email_notifications)
    `);
    stmt.run({
      ...settings,
      notifications_enabled: settings.notifications_enabled ? 1 : 0,
      email_notifications: settings.email_notifications ? 1 : 0,
    });
  }

  updateUserSettings(userId: string, updates: Partial<DbUserSettings>): void {
    if (updates.notifications_enabled !== undefined) {
      updates.notifications_enabled = updates.notifications_enabled ? 1 : 0;
    }
    if (updates.email_notifications !== undefined) {
      updates.email_notifications = updates.email_notifications ? 1 : 0;
    }
    const fields = Object.keys(updates).filter(k => k !== 'user_id');
    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    const stmt = db.prepare(`UPDATE user_settings SET ${setClause} WHERE user_id = @user_id`);
    stmt.run({ ...updates, user_id: userId });
  }

  // Chat Groups
  getAllChatGroups(): DbChatGroup[] {
    return db.prepare('SELECT * FROM chat_groups ORDER BY name').all() as DbChatGroup[];
  }

  getChatGroupById(id: string): DbChatGroup | undefined {
    return db.prepare('SELECT * FROM chat_groups WHERE id = ?').get(id) as DbChatGroup | undefined;
  }

  createChatGroup(group: DbChatGroup): void {
    const stmt = db.prepare(`
      INSERT INTO chat_groups (id, name, description, created_by, created_at, updated_at)
      VALUES (@id, @name, @description, @created_by, @created_at, @updated_at)
    `);
    stmt.run(group);
  }

  updateChatGroup(id: string, updates: Partial<DbChatGroup>): void {
    const fields = Object.keys(updates).filter(k => k !== 'id');
    const setClause = fields.map(f => `${f} = @${f}`).join(', ');
    const stmt = db.prepare(`UPDATE chat_groups SET ${setClause}, updated_at = @updated_at WHERE id = @id`);
    stmt.run({ ...updates, id, updated_at: new Date().toISOString() });
  }

  deleteChatGroup(id: string): void {
    db.prepare('DELETE FROM chat_messages WHERE group_id = ?').run(id);
    db.prepare('DELETE FROM chat_group_members WHERE group_id = ?').run(id);
    db.prepare('DELETE FROM chat_groups WHERE id = ?').run(id);
  }

  // Chat Group Members
  getChatGroupMembers(groupId: string): DbChatGroupMember[] {
    return db.prepare('SELECT * FROM chat_group_members WHERE group_id = ?').all(groupId) as DbChatGroupMember[];
  }

  getUserChatGroups(userId: string): DbChatGroup[] {
    return db.prepare(`
      SELECT cg.* FROM chat_groups cg
      INNER JOIN chat_group_members cgm ON cg.id = cgm.group_id
      WHERE cgm.user_id = ?
      ORDER BY cg.name
    `).all(userId) as DbChatGroup[];
  }

  addChatGroupMember(member: DbChatGroupMember): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO chat_group_members (group_id, user_id, role, joined_at)
      VALUES (@group_id, @user_id, @role, @joined_at)
    `);
    stmt.run(member);
  }

  removeChatGroupMember(groupId: string, userId: string): void {
    db.prepare('DELETE FROM chat_group_members WHERE group_id = ? AND user_id = ?').run(groupId, userId);
  }

  // Chat Messages
  getChatGroupMessages(groupId: string): DbChatMessage[] {
    return db.prepare('SELECT * FROM chat_messages WHERE group_id = ? ORDER BY created_at').all(groupId) as DbChatMessage[];
  }

  createChatMessage(message: DbChatMessage): void {
    const stmt = db.prepare(`
      INSERT INTO chat_messages (id, group_id, sender_id, content, created_at)
      VALUES (@id, @group_id, @sender_id, @content, @created_at)
    `);
    stmt.run(message);
  }

  // Utility methods
  clearAllData(): void {
    db.exec(`
      DELETE FROM chat_messages;
      DELETE FROM chat_group_members;
      DELETE FROM chat_groups;
      DELETE FROM user_settings;
      DELETE FROM messages;
      DELETE FROM conversation_participants;
      DELETE FROM conversations;
      DELETE FROM notifications;
      DELETE FROM ratings;
      DELETE FROM courses;
      DELETE FROM story_views;
      DELETE FROM stories;
      DELETE FROM comments;
      DELETE FROM post_likes;
      DELETE FROM posts;
      DELETE FROM event_participants;
      DELETE FROM events;
      DELETE FROM users;
    `);
  }

  // Get raw database connection for custom queries
  get raw(): Database.Database {
    return db;
  }

  // Backward compatibility - data object proxy
  get data(): {
    users: DbUser[];
    events: DbEvent[];
    event_participants: DbEventParticipant[];
    posts: DbPost[];
    post_likes: DbPostLike[];
    comments: DbComment[];
    stories: DbStory[];
    story_views: DbStoryView[];
    courses: DbCourse[];
    ratings: DbRating[];
    notifications: DbNotification[];
    conversations: DbConversation[];
    conversation_participants: DbConversationParticipant[];
    messages: DbMessage[];
    user_settings: DbUserSettings[];
    chat_groups: DbChatGroup[];
    chat_group_members: DbChatGroupMember[];
    chat_messages: DbChatMessage[];
  } {
    return {
      users: this.getAllUsers(),
      events: this.getAllEvents(),
      event_participants: db.prepare('SELECT * FROM event_participants').all() as DbEventParticipant[],
      posts: this.getAllPosts(),
      post_likes: db.prepare('SELECT * FROM post_likes').all() as DbPostLike[],
      comments: db.prepare('SELECT * FROM comments').all() as DbComment[],
      stories: this.getAllStories(),
      story_views: db.prepare('SELECT * FROM story_views').all() as DbStoryView[],
      courses: this.getAllCourses(),
      ratings: db.prepare('SELECT * FROM ratings').all() as DbRating[],
      notifications: db.prepare('SELECT * FROM notifications').all() as DbNotification[],
      conversations: this.getAllConversations(),
      conversation_participants: db.prepare('SELECT * FROM conversation_participants').all() as DbConversationParticipant[],
      messages: db.prepare('SELECT * FROM messages').all() as DbMessage[],
      user_settings: db.prepare('SELECT * FROM user_settings').all() as DbUserSettings[],
      chat_groups: this.getAllChatGroups(),
      chat_group_members: db.prepare('SELECT * FROM chat_group_members').all() as DbChatGroupMember[],
      chat_messages: db.prepare('SELECT * FROM chat_messages').all() as DbChatMessage[],
    };
  }

  // No-op methods for backward compatibility
  async init(): Promise<void> {
    // SQLite is already initialized synchronously
  }

  async write(): Promise<void> {
    // SQLite auto-commits, no manual write needed
  }

  writeSync(): void {
    // SQLite auto-commits, no manual write needed
  }
}

export const dbHelper = new DatabaseHelper();
export default dbHelper;
