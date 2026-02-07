# 🔐 Backend et Base de Données - RCT Connect

## ⚠️ État actuel : **PAS DE BACKEND**

### Situation actuelle

L'application RCT Connect utilise **localStorage** du navigateur comme système de stockage temporaire. C'est une solution de **DÉMONSTRATION** uniquement.

```
┌─────────────────────────────────┐
│   Application Mobile (React)    │
│   ┌──────────────────────────┐  │
│   │   localStorage           │  │
│   │   - Utilisateurs         │  │
│   │   - Événements           │  │
│   │   - Posts                │  │
│   │   - Messages             │  │
│   │   - Stories              │  │
│   └──────────────────────────┘  │
└─────────────────────────────────┘
        ❌ Données perdues
        à la désinstallation
```

### ❌ Limitations actuelles

1. **Données volatiles** : Toutes les données sont effacées si l'utilisateur :
   - Désinstalle l'application
   - Vide le cache du navigateur
   - Change d'appareil

2. **Pas de synchronisation** : Les données ne sont pas partagées entre utilisateurs

3. **Pas de sécurité réelle** : Le "CIN" est stocké en clair dans le navigateur

4. **Pas de notifications push réelles** : Les notifications sont locales uniquement

5. **Données de démostration** : Les 8 utilisateurs de base sont simulés

## ✅ Solution : Backend de production

### Architecture recommandée

```
┌──────────────────────┐         ┌──────────────────────┐
│  Application Mobile  │◄───────►│   Backend API        │
│  (React + Capacitor) │  HTTPS  │   (Node.js/Django)   │
└──────────────────────┘         └──────────┬───────────┘
                                            │
                         ┌──────────────────┴────────────────────┐
                         │                                        │
                ┌────────▼──────────┐              ┌─────────────▼────────┐
                │  Base de données  │              │  Services externes   │
                │  PostgreSQL/MySQL │              │  - Firebase (Push)   │
                │  - users          │              │  - Cloudinary (IMG)  │
                │  - events         │              │  - Email service     │
                │  - posts          │              └──────────────────────┘
                │  - messages       │
                │  - notifications  │
                └───────────────────┘
```

### Technologies recommandées

#### Backend API
- **Node.js + Express** (JavaScript/TypeScript)
- **Django + DRF** (Python)
- **NestJS** (TypeScript moderne)

#### Base de données
- **PostgreSQL** (recommandé) : robuste, relationnel
- **MongoDB** : NoSQL, flexible
- **MySQL** : classique, bien documenté

#### Services
- **Firebase Cloud Messaging** : notifications push
- **Cloudinary / AWS S3** : stockage images/vidéos
- **SendGrid / Mailgun** : emails automatiques

### Endpoints API nécessaires

```typescript
// Authentification
POST   /api/auth/register        // Inscription
POST   /api/auth/login           // Connexion
POST   /api/auth/refresh         // Refresh token
POST   /api/auth/forgot-password // Récupération MDP

// Utilisateurs
GET    /api/users                // Liste utilisateurs
GET    /api/users/:id            // Détail utilisateur
PUT    /api/users/:id            // Modifier utilisateur
DELETE /api/users/:id            // Supprimer utilisateur

// Événements
GET    /api/events               // Liste événements
POST   /api/events               // Créer événement
GET    /api/events/:id           // Détail événement
PUT    /api/events/:id           // Modifier événement
DELETE /api/events/:id           // Supprimer événement
POST   /api/events/:id/join      // Rejoindre événement
POST   /api/events/:id/leave     // Quitter événement

// Posts
GET    /api/posts                // Feed posts
POST   /api/posts                // Créer post
GET    /api/posts/:id            // Détail post
DELETE /api/posts/:id            // Supprimer post
POST   /api/posts/:id/like       // Like/unlike
POST   /api/posts/:id/comment    // Commenter

// Messages
GET    /api/conversations        // Liste conversations
GET    /api/conversations/:id/messages  // Messages
POST   /api/conversations/:id/messages  // Envoyer message

// Notifications
GET    /api/notifications        // Liste notifications
PUT    /api/notifications/:id/read     // Marquer comme lu
POST   /api/push/register        // Enregistrer token FCM

// Upload
POST   /api/upload               // Upload image/vidéo
```

### Schéma de base de données

```sql
-- Table users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cin CHAR(3) NOT NULL UNIQUE,  -- Hasher en production
  password_hash VARCHAR(255),     -- Ajouter vraie authentification
  role VARCHAR(50) NOT NULL,
  group_name VARCHAR(100),
  avatar_url TEXT,
  join_date DATE NOT NULL,
  total_distance DECIMAL(10,2) DEFAULT 0,
  total_runs INT DEFAULT 0,
  avg_pace VARCHAR(10),
  streak INT DEFAULT 0,
  ranking INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table events
CREATE TABLE events (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  group_name VARCHAR(100),
  type VARCHAR(50) NOT NULL,  -- daily, weekly, race
  description TEXT,
  created_by UUID REFERENCES users(id),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table event_participants
CREATE TABLE event_participants (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Table posts
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  video_url TEXT,
  distance DECIMAL(10,2),
  pace VARCHAR(10),
  type VARCHAR(20) NOT NULL,  -- post, reel
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table comments
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table likes
CREATE TABLE likes (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Table stories
CREATE TABLE stories (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP  -- Stories 24h
);

-- Table story_views
CREATE TABLE story_views (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (story_id, user_id)
);

-- Table conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table conversation_participants
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- Table messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,  -- event, social, system, reminder
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table push_tokens (pour FCM)
CREATE TABLE push_tokens (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20) NOT NULL,  -- android, ios
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, platform)
);
```

## 🚀 Migration vers le backend

### Étapes de migration

1. **Phase 1 : Backend basique** (1 semaine)
   - Créer API REST
   - Implémenter authentification JWT
   - CRUD utilisateurs et événements

2. **Phase 2 : Fonctionnalités sociales** (1 semaine)
   - Posts, likes, commentaires
   - Stories avec expiration 24h
   - Messagerie en temps réel (WebSocket)

3. **Phase 3 : Notifications** (3-4 jours)
   - Intégration Firebase Cloud Messaging
   - Rappels automatiques d'événements
   - Notifications sociales

4. **Phase 4 : Upload et médias** (2-3 jours)
   - Intégration Cloudinary/S3
   - Compression images
   - Upload vidéos

5. **Phase 5 : Tests et déploiement** (1 semaine)
   - Tests API
   - Déploiement backend (Heroku, Railway, AWS)
   - Migration données de démo
   - Tests end-to-end

### Coûts estimés

**Hébergement gratuit (démo) :**
- Backend : Railway.app / Render (gratuit jusqu'à X requêtes)
- Base de données : PostgreSQL gratuit (jusqu'à 1 GB)
- Firebase : Plan gratuit (push notifications limité)
- Cloudinary : Plan gratuit (25 GB stockage/mois)

**Hébergement production :**
- Backend : $7-20/mois (Heroku, Railway, DigitalOcean)
- Base de données : $7-15/mois (Managed PostgreSQL)
- Firebase : $25-50/mois (notifications illimitées)
- Stockage médias : $10-20/mois (Cloudinary plan payant)

**Total : ~$50-100/mois en production**

## 📝 Modification de l'app mobile

Pour connecter l'app au backend, remplacer dans tous les fichiers :

```typescript
// AVANT (localStorage)
import { getUsers, createEvent } from '@/lib/store';

// APRÈS (API)
import { apiGetUsers, apiCreateEvent } from '@/lib/api';
```

Créer `src/lib/api.ts` :
```typescript
const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

async function apiCall(endpoint: string, options = {}) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export const apiGetUsers = () => apiCall('/users');
export const apiCreateEvent = (event) => apiCall('/events', {
  method: 'POST',
  body: JSON.stringify(event),
});
// ... etc
```

## ⏱️ Timeline complète

- **Actuellement** : Démo fonctionnelle avec localStorage (✅ fait)
- **Semaine 1** : Backend + base de données + auth
- **Semaine 2** : Fonctionnalités sociales
- **Semaine 3** : Notifications + médias
- **Semaine 4** : Tests + déploiement

**Total : ~4 semaines pour backend production complet**

## 💡 Recommandation

Pour le **hackathon** : L'app actuelle est parfaite pour la démo

Pour la **production** : Backend obligatoire sous 1 mois maximum
