import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'en' | 'ar' | 'tn';

interface Translations {
  [key: string]: {
    fr: string;
    en: string;
    ar: string;
    tn: string;
  };
}

// All translations
export const translations: Translations = {
  // Navigation
  'nav.home': { fr: 'Accueil', en: 'Home', ar: 'الرئيسية', tn: 'الدار' },
  'nav.events': { fr: 'Événements', en: 'Events', ar: 'الأحداث', tn: 'الأحداث' },
  'nav.strava': { fr: 'Strava', en: 'Strava', ar: 'سترافا', tn: 'سترافا' },
  'nav.calories': { fr: 'Calories', en: 'Calories', ar: 'السعرات', tn: 'الكالوري' },
  'nav.profile': { fr: 'Profil', en: 'Profile', ar: 'الملف الشخصي', tn: 'البروفيل' },
  'nav.login': { fr: 'Connexion', en: 'Login', ar: 'تسجيل الدخول', tn: 'كونكتي' },

  // Common
  'common.loading': { fr: 'Chargement...', en: 'Loading...', ar: 'جاري التحميل...', tn: 'يلودي...' },
  'common.save': { fr: 'Enregistrer', en: 'Save', ar: 'حفظ', tn: 'سجل' },
  'common.cancel': { fr: 'Annuler', en: 'Cancel', ar: 'إلغاء', tn: 'أنيلي' },
  'common.delete': { fr: 'Supprimer', en: 'Delete', ar: 'حذف', tn: 'فسخ' },
  'common.edit': { fr: 'Modifier', en: 'Edit', ar: 'تعديل', tn: 'بدل' },
  'common.back': { fr: 'Retour', en: 'Back', ar: 'رجوع', tn: 'أرجع' },
  'common.next': { fr: 'Suivant', en: 'Next', ar: 'التالي', tn: 'أكمل' },
  'common.search': { fr: 'Rechercher', en: 'Search', ar: 'بحث', tn: 'لوج' },
  'common.all': { fr: 'Tous', en: 'All', ar: 'الكل', tn: 'الكل' },
  'common.yes': { fr: 'Oui', en: 'Yes', ar: 'نعم', tn: 'إيه' },
  'common.no': { fr: 'Non', en: 'No', ar: 'لا', tn: 'لا' },

  // Home Page
  'home.welcome': { fr: 'Bienvenue', en: 'Welcome', ar: 'مرحبا', tn: 'مرحبا بيك' },
  'home.stories': { fr: 'Stories', en: 'Stories', ar: 'القصص', tn: 'الستوريات' },
  'home.feed': { fr: 'Fil d\'actualité', en: 'Feed', ar: 'آخر الأخبار', tn: 'الفيد' },
  'home.noStories': { fr: 'Aucune story', en: 'No stories', ar: 'لا توجد قصص', tn: 'ما فماش ستوريات' },
  'home.noPosts': { fr: 'Aucune publication', en: 'No posts', ar: 'لا توجد منشورات', tn: 'ما فماش بوستات' },

  // Events
  'events.title': { fr: 'Événements', en: 'Events', ar: 'الأحداث', tn: 'الأحداث' },
  'events.upcoming': { fr: 'À venir', en: 'Upcoming', ar: 'القادمة', tn: 'الجايين' },
  'events.past': { fr: 'Terminés', en: 'Past', ar: 'المنتهية', tn: 'الفاتت' },
  'events.myEvents': { fr: 'Mes événements', en: 'My Events', ar: 'أحداثي', tn: 'أحداثي' },
  'events.allEvents': { fr: 'Tous', en: 'All', ar: 'الكل', tn: 'الكل' },
  'events.noEvents': { fr: 'Aucun événement', en: 'No events', ar: 'لا توجد أحداث', tn: 'ما فماش أحداث' },
  'events.noUpcoming': { fr: 'Aucun événement à venir', en: 'No upcoming events', ar: 'لا توجد أحداث قادمة', tn: 'ما فماش أحداث جايين' },
  'events.noPast': { fr: 'Aucun événement terminé', en: 'No past events', ar: 'لا توجد أحداث منتهية', tn: 'ما فماش أحداث فاتت' },
  'events.noEventsDate': { fr: 'Aucun événement à cette date', en: 'No events on this date', ar: 'لا توجد أحداث في هذا التاريخ', tn: 'ما فماش أحداث في هالتاريخ' },
  'events.viewAll': { fr: 'Voir tous les événements', en: 'View all events', ar: 'عرض جميع الأحداث', tn: 'شوف الكل' },
  'events.participate': { fr: 'Participer', en: 'Join', ar: 'المشاركة', tn: 'شارك' },
  'events.leave': { fr: 'Se désinscrire', en: 'Leave', ar: 'إلغاء المشاركة', tn: 'أفسخ المشاركة' },
  'events.participants': { fr: 'participants', en: 'participants', ar: 'مشاركين', tn: 'مشاركين' },
  'events.expired': { fr: 'Événements terminés', en: 'Past Events', ar: 'الأحداث المنتهية', tn: 'الأحداث الفاتت' },
  'events.leaderboard': { fr: 'Classement', en: 'Leaderboard', ar: 'الترتيب', tn: 'الترتيب' },
  'events.allTimeLeaderboard': { fr: 'Classement général', en: 'All-Time Leaderboard', ar: 'الترتيب العام', tn: 'الترتيب العام' },
  'events.generalRanking': { fr: 'Classement général', en: 'Overall Ranking', ar: 'الترتيب العام', tn: 'الترتيب العام' },
  'events.runs': { fr: 'sorties', en: 'runs', ar: 'جولات', tn: 'دورات' },
  'events.noRunners': { fr: 'Aucun coureur dans ce groupe', en: 'No runners in this group', ar: 'لا يوجد عدائين في هذه المجموعة', tn: 'ما فماش عدائين في هالغروب' },
  'events.create': { fr: 'Créer un événement', en: 'Create Event', ar: 'إنشاء حدث', tn: 'أصنع حدث' },

  // Filter
  'filter.all': { fr: 'Tous', en: 'All', ar: 'الكل', tn: 'الكل' },
  'filter.clear': { fr: 'Effacer', en: 'Clear', ar: 'مسح', tn: 'فسخ' },

  // Profile
  'profile.title': { fr: 'Profil', en: 'Profile', ar: 'الملف الشخصي', tn: 'البروفيل' },
  'profile.editProfile': { fr: 'Modifier le profil', en: 'Edit Profile', ar: 'تعديل الملف', tn: 'بدل البروفيل' },
  'profile.publications': { fr: 'publications', en: 'posts', ar: 'منشورات', tn: 'بوستات' },
  'profile.totalKm': { fr: 'km total', en: 'total km', ar: 'كم إجمالي', tn: 'كم توتال' },
  'profile.badges': { fr: 'Badges', en: 'Badges', ar: 'الشارات', tn: 'البادجات' },
  'profile.badgeProgress': { fr: 'Progression des badges', en: 'Badge Progress', ar: 'تقدم الشارات', tn: 'تقدم البادجات' },
  'profile.stats': { fr: 'Statistiques', en: 'Statistics', ar: 'الإحصائيات', tn: 'الإحصائيات' },
  'profile.totalDistance': { fr: 'Distance totale', en: 'Total Distance', ar: 'المسافة الإجمالية', tn: 'المسافة الكل' },
  'profile.runs': { fr: 'Sorties', en: 'Runs', ar: 'الجولات', tn: 'الدورات' },
  'profile.participations': { fr: 'Participations', en: 'Participations', ar: 'المشاركات', tn: 'المشاركات' },

  // Settings
  'settings.title': { fr: 'Paramètres', en: 'Settings', ar: 'الإعدادات', tn: 'الباراماترات' },
  'settings.appearance': { fr: 'Apparence', en: 'Appearance', ar: 'المظهر', tn: 'الشكل' },
  'settings.darkMode': { fr: 'Mode sombre', en: 'Dark Mode', ar: 'الوضع المظلم', tn: 'المود الكحل' },
  'settings.lightMode': { fr: 'Mode clair', en: 'Light Mode', ar: 'الوضع الفاتح', tn: 'المود البيض' },
  'settings.language': { fr: 'Langue', en: 'Language', ar: 'اللغة', tn: 'اللغة' },
  'settings.accessibility': { fr: 'Accessibilité', en: 'Accessibility', ar: 'إمكانية الوصول', tn: 'سهولة الوصول' },
  'settings.account': { fr: 'Compte', en: 'Account', ar: 'الحساب', tn: 'الكونت' },
  'settings.notifications': { fr: 'Notifications', en: 'Notifications', ar: 'الإشعارات', tn: 'النوتيفيكاسيون' },
  'settings.admin': { fr: 'Administration', en: 'Administration', ar: 'الإدارة', tn: 'الأدمين' },
  'settings.data': { fr: 'Données', en: 'Data', ar: 'البيانات', tn: 'الداتا' },
  'settings.reset': { fr: 'Réinitialiser les données', en: 'Reset Data', ar: 'إعادة تعيين البيانات', tn: 'ريست الداتا' },
  'settings.logout': { fr: 'Se déconnecter', en: 'Log Out', ar: 'تسجيل الخروج', tn: 'أخرج' },

  // Calories
  'calories.title': { fr: 'Suivi des calories', en: 'Calorie Tracker', ar: 'متتبع السعرات', tn: 'تتبع الكالوري' },
  'calories.daily': { fr: 'Objectif journalier', en: 'Daily Goal', ar: 'الهدف اليومي', tn: 'الهدف اليومي' },
  'calories.consumed': { fr: 'Consommées', en: 'Consumed', ar: 'المستهلكة', tn: 'المستهلكة' },
  'calories.remaining': { fr: 'Restantes', en: 'Remaining', ar: 'المتبقية', tn: 'الباقي' },
  'calories.breakfast': { fr: 'Petit-déjeuner', en: 'Breakfast', ar: 'الإفطار', tn: 'الفطور' },
  'calories.lunch': { fr: 'Déjeuner', en: 'Lunch', ar: 'الغداء', tn: 'الغدا' },
  'calories.dinner': { fr: 'Dîner', en: 'Dinner', ar: 'العشاء', tn: 'العشا' },
  'calories.snack': { fr: 'Collation', en: 'Snack', ar: 'وجبة خفيفة', tn: 'سناك' },
  'calories.addFood': { fr: 'Ajouter un aliment', en: 'Add Food', ar: 'إضافة طعام', tn: 'زيد ماكلة' },
  'calories.water': { fr: 'Hydratation', en: 'Water', ar: 'الماء', tn: 'الماء' },
  'calories.macros': { fr: 'Macros', en: 'Macros', ar: 'المغذيات', tn: 'الماكروس' },
  'calories.protein': { fr: 'Protéines', en: 'Protein', ar: 'البروتين', tn: 'البروتين' },
  'calories.carbs': { fr: 'Glucides', en: 'Carbs', ar: 'الكربوهيدرات', tn: 'الكاربس' },
  'calories.fat': { fr: 'Lipides', en: 'Fat', ar: 'الدهون', tn: 'الدهون' },
  'calories.bmi': { fr: 'IMC', en: 'BMI', ar: 'مؤشر كتلة الجسم', tn: 'BMI' },
  'calories.weight': { fr: 'Poids', en: 'Weight', ar: 'الوزن', tn: 'الوزن' },
  'calories.height': { fr: 'Taille', en: 'Height', ar: 'الطول', tn: 'الطول' },
  'calories.age': { fr: 'Âge', en: 'Age', ar: 'العمر', tn: 'العمر' },
  'calories.gender': { fr: 'Sexe', en: 'Gender', ar: 'الجنس', tn: 'الجنس' },
  'calories.male': { fr: 'Homme', en: 'Male', ar: 'ذكر', tn: 'راجل' },
  'calories.female': { fr: 'Femme', en: 'Female', ar: 'أنثى', tn: 'مرا' },
  'calories.activity': { fr: 'Niveau d\'activité', en: 'Activity Level', ar: 'مستوى النشاط', tn: 'مستوى النشاط' },
  'calories.goal': { fr: 'Objectif', en: 'Goal', ar: 'الهدف', tn: 'الهدف' },
  'calories.lose': { fr: 'Perdre du poids', en: 'Lose Weight', ar: 'إنقاص الوزن', tn: 'نقص الوزن' },
  'calories.maintain': { fr: 'Maintenir', en: 'Maintain', ar: 'الحفاظ', tn: 'خليه كيما هو' },
  'calories.gain': { fr: 'Prendre du poids', en: 'Gain Weight', ar: 'زيادة الوزن', tn: 'زيد الوزن' },

  // Strava
  'strava.title': { fr: 'Strava', en: 'Strava', ar: 'سترافا', tn: 'سترافا' },
  'strava.connect': { fr: 'Connecter Strava', en: 'Connect Strava', ar: 'ربط سترافا', tn: 'كونكتي سترافا' },
  'strava.disconnect': { fr: 'Déconnecter', en: 'Disconnect', ar: 'فصل', tn: 'افصل' },
  'strava.activities': { fr: 'Activités', en: 'Activities', ar: 'الأنشطة', tn: 'الأنشطة' },
  'strava.stats': { fr: 'Statistiques', en: 'Statistics', ar: 'الإحصائيات', tn: 'الستاتس' },

  // Login
  'login.title': { fr: 'Connexion', en: 'Login', ar: 'تسجيل الدخول', tn: 'الكونكسيون' },
  'login.email': { fr: 'Email', en: 'Email', ar: 'البريد الإلكتروني', tn: 'الإيمايل' },
  'login.password': { fr: 'Mot de passe', en: 'Password', ar: 'كلمة المرور', tn: 'الموتدوباس' },
  'login.submit': { fr: 'Se connecter', en: 'Log In', ar: 'دخول', tn: 'أدخل' },
  'login.visitor': { fr: 'Continuer en tant que visiteur', en: 'Continue as Guest', ar: 'المتابعة كزائر', tn: 'كمل كضيف' },
  'login.forgotPassword': { fr: 'Mot de passe oublié ?', en: 'Forgot Password?', ar: 'نسيت كلمة المرور؟', tn: 'نسيت الموتدوباس؟' },

  // Messages
  'messages.title': { fr: 'Messages', en: 'Messages', ar: 'الرسائل', tn: 'الميساجات' },
  'messages.send': { fr: 'Envoyer', en: 'Send', ar: 'إرسال', tn: 'أبعث' },
  'messages.typeMessage': { fr: 'Écrivez un message...', en: 'Type a message...', ar: 'اكتب رسالة...', tn: 'أكتب ميساج...' },
  'messages.noConversations': { fr: 'Aucune conversation', en: 'No conversations', ar: 'لا توجد محادثات', tn: 'ما فماش كلام' },

  // Posts
  'posts.like': { fr: 'J\'aime', en: 'Like', ar: 'إعجاب', tn: 'عجبني' },
  'posts.comment': { fr: 'Commenter', en: 'Comment', ar: 'تعليق', tn: 'كومونتي' },
  'posts.share': { fr: 'Partager', en: 'Share', ar: 'مشاركة', tn: 'بارتاجي' },
  'posts.create': { fr: 'Créer une publication', en: 'Create Post', ar: 'إنشاء منشور', tn: 'أصنع بوست' },
  'posts.writePost': { fr: 'Écrivez quelque chose...', en: 'Write something...', ar: 'اكتب شيئاً...', tn: 'أكتب حاجة...' },

  // Voice Assistant
  'voice.title': { fr: 'Assistant Vocal', en: 'Voice Assistant', ar: 'المساعد الصوتي', tn: 'المساعد الصوتي' },
  'voice.listening': { fr: 'Je vous écoute...', en: 'Listening...', ar: 'جاري الاستماع...', tn: 'نسمع فيك...' },
  'voice.speaking': { fr: 'Je parle...', en: 'Speaking...', ar: 'جاري التحدث...', tn: 'نحكي...' },
  'voice.waiting': { fr: 'En attente', en: 'Waiting', ar: 'في الانتظار', tn: 'نستنى' },
  'voice.youSaid': { fr: 'Vous avez dit :', en: 'You said:', ar: 'قلت:', tn: 'قلت:' },
  'voice.response': { fr: 'Réponse :', en: 'Response:', ar: 'الرد:', tn: 'الجواب:' },
  'voice.commands': { fr: 'Commandes disponibles', en: 'Available Commands', ar: 'الأوامر المتاحة', tn: 'الأوامر الموجودة' },
  'voice.speak': { fr: 'Parler', en: 'Speak', ar: 'تحدث', tn: 'أحكي' },
  'voice.stop': { fr: 'Arrêter', en: 'Stop', ar: 'توقف', tn: 'وقف' },
  'voice.silence': { fr: 'Silence', en: 'Silence', ar: 'صمت', tn: 'سكوت' },

  // Notifications
  'notifications.title': { fr: 'Notifications', en: 'Notifications', ar: 'الإشعارات', tn: 'النوتيفيكاسيون' },
  'notifications.empty': { fr: 'Aucune notification', en: 'No notifications', ar: 'لا توجد إشعارات', tn: 'ما فماش نوتيفيكاسيون' },
  'notifications.markRead': { fr: 'Marquer comme lu', en: 'Mark as read', ar: 'تحديد كمقروء', tn: 'ماركيه كمقري' },

  // Badges
  'badge.firstRun': { fr: 'Première course', en: 'First Run', ar: 'الجولة الأولى', tn: 'الجرية الأولى' },
  'badge.km10': { fr: '10 km total', en: '10 km total', ar: '10 كم إجمالي', tn: '10 كم توتال' },
  'badge.km50': { fr: '50 km total', en: '50 km total', ar: '50 كم إجمالي', tn: '50 كم توتال' },
  'badge.km100': { fr: '100 km total', en: '100 km total', ar: '100 كم إجمالي', tn: '100 كم توتال' },
  'badge.streak7': { fr: 'Semaine parfaite', en: 'Perfect Week', ar: 'أسبوع مثالي', tn: 'جمعة مليحة' },
  'badge.streak30': { fr: 'Mois parfait', en: 'Perfect Month', ar: 'شهر مثالي', tn: 'شهر مليح' },
  'badge.events5': { fr: 'Participant actif', en: 'Active Participant', ar: 'مشارك نشط', tn: 'مشارك نشيط' },
  'badge.events20': { fr: 'Vétéran', en: 'Veteran', ar: 'محترف', tn: 'فيتيران' },

  // Time
  'time.today': { fr: 'Aujourd\'hui', en: 'Today', ar: 'اليوم', tn: 'اليوم' },
  'time.yesterday': { fr: 'Hier', en: 'Yesterday', ar: 'أمس', tn: 'البارح' },
  'time.tomorrow': { fr: 'Demain', en: 'Tomorrow', ar: 'غداً', tn: 'غدوة' },
  'time.thisWeek': { fr: 'Cette semaine', en: 'This Week', ar: 'هذا الأسبوع', tn: 'هالجمعة' },

  // Groups
  'group.beginners': { fr: 'Débutants', en: 'Beginners', ar: 'المبتدئين', tn: 'المبتدئين' },
  'group.intermediate': { fr: 'Intermédiaires', en: 'Intermediate', ar: 'المتوسطين', tn: 'المتوسطين' },
  'group.advanced': { fr: 'Confirmés', en: 'Advanced', ar: 'المتقدمين', tn: 'المحترفين' },
  'group.elite': { fr: 'Élite', en: 'Elite', ar: 'النخبة', tn: 'الإيليت' },

  // Roles
  'role.admin': { fr: 'Admin', en: 'Admin', ar: 'مدير', tn: 'أدمين' },
  'role.coach': { fr: 'Coach', en: 'Coach', ar: 'مدرب', tn: 'كوتش' },
  'role.groupAdmin': { fr: 'Chef de groupe', en: 'Group Leader', ar: 'قائد المجموعة', tn: 'شاف الغروب' },
  'role.member': { fr: 'Membre', en: 'Member', ar: 'عضو', tn: 'عضو' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  languageNames: Record<Language, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'rct_language';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['fr', 'en', 'ar', 'tn'].includes(saved)) {
        return saved as Language;
      }
    }
    return 'fr';
  });

  const languageNames: Record<Language, string> = {
    fr: 'Français',
    en: 'English',
    ar: 'العربية',
    tn: 'تونسي',
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'tn' ? 'ar-TN' : language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const translation = translations[key];
    if (translation) {
      return translation[language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageNames }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
