# 🏃‍♂️ RCT Connect - Running Club de Tunis

[![#MaraTechEsprit2026](https://img.shields.io/badge/%23MaraTechEsprit2026-FF6B35?style=for-the-badge)](https://github.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)

## 📋 À propos du projet

**RCT Connect** est une application mobile et web innovante développée pour le **Running Club de Tunis (RCT)**, une communauté dynamique de passionnés de course à pied. Cette solution numérique complète vise à renforcer les liens entre les membres du club, faciliter l'organisation d'événements sportifs, et suivre les performances individuelles et collectives.

### 🎯 Association bénéficiaire : Running Club de Tunis

Le **Running Club de Tunis (RCT)** est une association sportive tunisienne dédiée à la promotion de la course à pied et au développement d'une communauté soudée de coureurs de tous niveaux. L'association organise régulièrement des entraînements collectifs, des compétitions, et des événements sociaux pour encourager la pratique sportive et favoriser l'esprit d'équipe.

**RCT Connect** répond aux besoins spécifiques du club en offrant :
- Une plateforme centralisée pour la communication entre membres
- Un système de gestion d'événements adapté aux activités sportives
- Un suivi des performances et de la progression des coureurs
- Une intégration avec Strava pour synchroniser automatiquement les données de course

---

## 👥 Équipe de développement

| Nom | Rôle | Contact |
|-----|------|---------|
| **Yosr Kharrat** | Lead Developer | [GitHub](https://github.com/yosrk) |
| _[Ajouter membre]_ | _[Rôle]_ | _[Contact]_ |
| _[Ajouter membre]_ | _[Rôle]_ | _[Contact]_ |

---

## 🛠️ Technologies utilisées

### Frontend
- **React 18.3** - Bibliothèque JavaScript pour l'interface utilisateur
- **TypeScript 5.6** - Typage statique pour un code plus robuste
- **Vite 5.4** - Build tool ultra-rapide
- **Tailwind CSS 3.4** - Framework CSS utility-first
- **shadcn/ui** - Composants UI réutilisables et accessibles
- **React Router** - Navigation et routing
- **Lucide React** - Icônes modernes
- **Capacitor 8.0** - Framework pour applications mobiles (iOS/Android)

### Backend
- **Node.js** - Environnement d'exécution JavaScript
- **Express.js** - Framework web minimaliste
- **TypeScript** - Langage typé
- **better-sqlite3** - Base de données SQLite performante
- **JWT (jsonwebtoken)** - Authentification sécurisée
- **bcrypt** - Hashage des mots de passe
- **Zod** - Validation de schémas

### Intégrations
- **Strava API** - Synchronisation des activités sportives
- **Axios** - Client HTTP
- **CORS** - Gestion des requêtes cross-origin

### Outils de développement
- **ESLint** - Linting du code
- **Vitest** - Framework de tests unitaires
- **tsx** - Exécution TypeScript en développement

---

## 📦 Installation

### Prérequis
- **Node.js** (version 18 ou supérieure)
- **npm** ou **bun**
- **Git**

### Étape 1 : Cloner le dépôt
```bash
git clone https://github.com/[votre-compte]/rct-connect.git
cd rct-connect
```

### Étape 2 : Installation des dépendances

#### Frontend
```bash
npm install
```

#### Backend
```bash
cd backend
npm install
```

### Étape 3 : Configuration de l'environnement

Créez un fichier `.env` dans le dossier `backend/` avec les variables suivantes :

```env
# Server
PORT=3001

# JWT Secret
JWT_SECRET=votre_secret_jwt_super_securise

# Strava API (optionnel)
STRAVA_CLIENT_ID=votre_client_id
STRAVA_CLIENT_SECRET=votre_client_secret
STRAVA_REDIRECT_URI=http://localhost:8080/strava/callback
```

### Étape 4 : Initialiser la base de données

```bash
cd backend
npm run seed
```

Cette commande créera la base de données SQLite et la peuplera avec des données de test.

---

## 🚀 Utilisation

### Lancement en mode développement

#### Terminal 1 : Backend
```bash
cd backend
npm run dev
```
Le serveur backend sera accessible sur `http://localhost:3001`

#### Terminal 2 : Frontend
```bash
npm run dev
```
L'application frontend sera accessible sur `http://localhost:8080`

### Compte administrateur par défaut
- **Email** : `admin@rct.tn`
- **Mot de passe** : `123`

### Build pour la production

#### Frontend
```bash
npm run build
```

#### Backend
```bash
cd backend
npm run build
```

### Déploiement mobile (Capacitor)

#### Android
```bash
npm run cap:android
```

#### iOS
```bash
npm run cap:ios
```

---

## ✨ Fonctionnalités principales

### 🔐 Authentification et gestion des utilisateurs
- Inscription et connexion sécurisées avec JWT
- Gestion des rôles (Admin, Coach, Member, Visitor)
- Profils utilisateurs personnalisables avec avatar
- Classification par niveau (Débutant, Intermédiaire, Élite)
- Organisation en groupes (Groupe A, B, etc.)

### 📱 Stories et contenu social
- Création et partage de stories avec photos/vidéos
- Carrousel de stories interactif avec timer automatique
- Suppression des stories par les auteurs
- Système de likes et d'interactions
- Barre d'inspiration de contenu

### 📰 Publications (Posts)
- Création de posts avec images multiples
- Support des légendes et descriptions
- Système de likes et de commentaires
- Prévisualisation des images dans un carrousel élégant
- Posts spécifiques au RCT avec images locales

### 📅 Gestion d'événements
- Création d'événements de course avec détails complets
- Carte interactive pour visualiser les parcours
- Inscription et désinscription aux événements
- Limitation du nombre de participants
- Chat en temps réel pour chaque événement
- Notifications pour les nouveaux événements
- Vue calendrier mensuelle

### 🏃 Intégration Strava
- Connexion sécurisée avec compte Strava
- Synchronisation automatique de la distance totale parcourue
- Affichage du nombre de courses effectuées
- Gestion des tokens d'accès avec rafraîchissement automatique
- Badge de connexion Strava sur le profil

### 💬 Messagerie et notifications
- Chat en temps réel pour chaque événement
- Notifications push pour les nouveaux messages
- Notifications pour les nouveaux événements
- Historique des conversations

### 📊 Statistiques et performances
- Distance totale parcourue (synchronisée avec Strava)
- Nombre de courses effectuées
- Classement des membres
- Séries d'entraînement (streak)
- Allure moyenne (pace)

### 🎨 Interface utilisateur
- Design moderne et responsive (mobile-first)
- Mode sombre/clair avec persistance
- Navigation intuitive avec barre de navigation inférieure
- Animations fluides et transitions élégantes
- Accessibilité optimisée (WCAG 2.1 niveau AA)
- Componentes UI réutilisables (shadcn/ui)

### 👑 Fonctionnalités administrateur
- Gestion complète des utilisateurs
- Modification des rôles et groupes
- Création et gestion d'événements
- Modération du contenu
- Accès aux statistiques globales

### 🔔 Système de notifications
- Notifications en temps réel
- Paramètres de notification personnalisables
- Badge de compteur non lu
- Historique des notifications

### 🌐 Multi-plateforme
- Application web (PWA)
- Application mobile iOS (via Capacitor)
- Application mobile Android (via Capacitor)
- Expérience native sur mobile

---

## 📁 Structure du projet

```
rct-connect/
├── src/                      # Code source frontend
│   ├── components/          # Composants React réutilisables
│   ├── pages/               # Pages de l'application
│   ├── contexts/            # Contextes React (Auth, Theme)
│   ├── hooks/               # Hooks personnalisés
│   ├── lib/                 # Utilitaires et API clients
│   ├── types/               # Définitions TypeScript
│   └── assets/              # Images et ressources statiques
├── backend/                 # Code source backend
│   ├── src/
│   │   ├── routes/         # Routes Express
│   │   ├── middleware/     # Middlewares (auth, CORS)
│   │   ├── types/          # Types TypeScript backend
│   │   ├── scripts/        # Scripts utilitaires
│   │   ├── db.ts           # Gestion de la base de données
│   │   └── index.ts        # Point d'entrée du serveur
│   └── data/               # Données de seed
├── public/                  # Fichiers publics statiques
├── android/                 # Configuration Capacitor Android
├── ios/                     # Configuration Capacitor iOS
└── README.md               # Ce fichier
```

---

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests en mode watch
npm run test:watch
```

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Poussez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📄 Licence

Ce projet est développé pour le **Running Club de Tunis** dans le cadre de **#MaraTechEsprit2026**.

---

## 📞 Contact

Pour toute question ou suggestion concernant le projet :

- 📧 Email : contact@rct.tn
- 🌐 Site web : [Running Club de Tunis](https://rct.tn)
- 💬 Discord : [Rejoindre la communauté](https://discord.gg/rct)

---

## 🏆 Remerciements

- Le **Running Club de Tunis** pour la confiance accordée
- L'équipe **Esprit** pour l'organisation de **#MaraTechEsprit2026**
- La communauté open-source pour les outils et bibliothèques utilisés
- Tous les contributeurs et testeurs du projet

---

<div align="center">

**#MaraTechEsprit2026** 🏃‍♂️💨

*Développé avec ❤️ pour la communauté RCT*

</div>
