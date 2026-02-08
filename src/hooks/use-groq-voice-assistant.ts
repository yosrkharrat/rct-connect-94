import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface ActionResult {
  success: boolean;
  message: string;
  action?: string;
  data?: any;
}

// Actions that the AI can request
type ActionType = 
  | 'navigate'
  | 'send_message'
  | 'create_post'
  | 'create_event'
  | 'fill_event_form'
  | 'fill_post_form'
  | 'fill_calories_form'
  | 'add_calorie_entry'
  | 'fill_profile_form'
  | 'fill_login_form'
  | 'fill_message'
  | 'update_calorie_profile'
  | 'add_water'
  | 'join_event'
  | 'leave_event'
  | 'get_events'
  | 'get_profile'
  | 'change_theme'
  | 'change_language'
  | 'search'
  | 'help'
  | 'none';

interface AIAction {
  action: ActionType;
  params: Record<string, any>;
}

export function useGroqVoiceAssistant() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef<string>('');
  
  // Silence duration before processing (in ms) - gives user time to pause
  const SILENCE_TIMEOUT = 2000;

  // System prompt for the AI
  const getSystemPrompt = () => {
    const langName = language === 'fr' ? 'French' : language === 'ar' ? 'Arabic' : language === 'tn' ? 'Tunisian Arabic (Derja)' : 'English';
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().slice(0, 5);
    
    return `You are a helpful voice assistant for RCT Connect, a running club mobile app. Respond in ${langName}.${language === 'tn' ? ' Use Tunisian dialect (Derja) in your responses, mixing Arabic script with common Tunisian expressions.' : ''}

Current user: ${user ? user.name : 'Not logged in'}
User role: ${user?.role || 'visitor'}
User group: ${user?.group || 'none'}
Current language: ${language}
Today's date: ${today}
Current time: ${currentTime}

You have FULL control over ALL forms in the app. You can:
1. Navigation - go to any page
2. Create events - fill all event creation fields
3. Create posts - fill post content, distance, pace
4. Calorie tracker - add food entries, update profile (weight, height, age, goal), add water
5. Edit profile - update name, bio
6. Login - fill email and password
7. Messaging - compose and send messages
8. Settings - change theme, language

When the user wants to perform an action, respond with a JSON object in this exact format:
{"action": "ACTION_TYPE", "params": {...}}

COMPLETE ACTION LIST with params:

NAVIGATION:
- navigate: {"page": "home|calendar|profile|strava|calories|settings|messages|create-post|create-event|edit-profile|login"}

EVENT CREATION (navigates to create-event and fills form):
- fill_event_form: {"title": "Event name", "date": "YYYY-MM-DD", "time": "HH:MM", "location": "Place", "group": "Tous|Groupe A|Groupe B|Compétition", "type": "daily|weekly|race", "description": "Description text"}

POST CREATION (navigates to create-post and fills form):
- fill_post_form: {"content": "Post text", "distance": "5.2", "pace": "5:30", "type": "post|reel"}

CALORIE TRACKER:
- add_calorie_entry: {"name": "Food name", "calories": 250, "protein": 20, "carbs": 30, "fat": 10, "meal": "breakfast|lunch|dinner|snack"}
- update_calorie_profile: {"height": 175, "weight": 70, "age": 30, "gender": "male|female", "activityLevel": "sedentary|light|moderate|active|very_active", "goal": "lose|maintain|gain"}
- add_water: {"glasses": 1}

PROFILE EDIT (navigates to edit-profile and fills form):
- fill_profile_form: {"name": "New name", "bio": "New bio text"}

LOGIN (navigates to login and fills form):
- fill_login_form: {"email": "user@email.com", "password": "123"}

MESSAGING:
- fill_message: {"to": "user_name or group_name", "message": "Message content"}
- send_message: {"to": "recipient", "message": "content"}

EVENTS:
- join_event: {"eventName": "Event to join"}
- leave_event: {"eventName": "Event to leave"}
- get_events: {"filter": "today|tomorrow|week|all"}

SETTINGS:
- change_theme: {"theme": "dark|light"}
- change_language: {"language": "fr|en|ar"}

OTHER:
- get_profile: {}
- search: {"query": "search term"}
- help: {}
- none: {} (just conversation, no action)

EXAMPLES:
- User: "Crée un événement course dimanche à 8h au parc" → fill_event_form with appropriate params
- User: "Ajoute mon déjeuner: salade 350 calories" → add_calorie_entry
- User: "Je pèse 75kg et je mesure 180cm" → update_calorie_profile
- User: "Publie que j'ai couru 10km" → fill_post_form
- User: "Connecte-moi avec admin@rct.tn" → fill_login_form
- User: "Envoie un message à Mohamed: Salut!" → fill_message

Always be concise and helpful. Extract ALL relevant information from user requests.
If missing required info, ask for it or use reasonable defaults.
For dates, convert relative dates (demain, dimanche) to YYYY-MM-DD format.
For times, use 24h format HH:MM.

IMPORTANT: Only output the JSON when an action is requested. For normal conversation, just respond naturally.`;
  };

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true; // Keep listening
        recognitionRef.current.interimResults = true; // Show partial results
        recognitionRef.current.maxAlternatives = 1;

        // Set language based on app language
        const langMap: Record<string, string> = {
          'fr': 'fr-FR',
          'en': 'en-US',
          'ar': 'ar-SA',
          'tn': 'ar-TN'
        };
        recognitionRef.current.lang = langMap[language] || 'fr-FR';

        recognitionRef.current.onresult = (event: any) => {
          let interim = '';
          let final = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }
          
          // Accumulate final transcript
          if (final) {
            finalTranscriptRef.current += ' ' + final;
            finalTranscriptRef.current = finalTranscriptRef.current.trim();
            setTranscript(finalTranscriptRef.current);
          }
          
          // Show interim results
          setInterimTranscript(interim);
          
          // Reset silence timeout on any speech activity
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          
          // Start silence timeout - process after user stops speaking
          silenceTimeoutRef.current = setTimeout(() => {
            if (finalTranscriptRef.current.trim()) {
              const textToProcess = finalTranscriptRef.current.trim();
              // Stop listening before processing
              if (recognitionRef.current) {
                recognitionRef.current.stop();
              }
              setIsListening(false);
              setInterimTranscript('');
              processWithGroq(textToProcess);
              finalTranscriptRef.current = '';
            }
          }, SILENCE_TIMEOUT);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          // Don't stop on no-speech error, just continue listening
          if (event.error !== 'no-speech') {
            setIsListening(false);
          }
        };

        recognitionRef.current.onend = () => {
          // Only set listening to false if we're not in processing mode
          // This prevents the UI from flickering
          if (!isProcessing) {
            setIsListening(false);
          }
          setInterimTranscript('');
        };
      }

      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [language]);

  // Update recognition language when app language changes
  useEffect(() => {
    if (recognitionRef.current) {
      const langMap: Record<string, string> = {
        'fr': 'fr-FR',
        'en': 'en-US',
        'ar': 'ar-SA',
        'tn': 'ar-TN'
      };
      recognitionRef.current.lang = langMap[language] || 'fr-FR';
    }
  }, [language]);

  // Process user input with Groq API
  const processWithGroq = async (userMessage: string) => {
    setIsProcessing(true);
    
    const messages = [
      { role: 'system', content: getSystemPrompt() },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      ]);

      // Check if response contains an action
      const actionResult = await parseAndExecuteAction(aiResponse);
      
      if (actionResult) {
        setResponse(actionResult.message);
        speak(actionResult.message);
      } else {
        // Regular conversation response
        setResponse(aiResponse);
        speak(aiResponse);
      }
    } catch (error) {
      console.error('Groq API error:', error);
      const errorMsg = language === 'fr' 
        ? "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer."
        : language === 'ar'
        ? "عذراً، لم أتمكن من معالجة طلبك. يرجى المحاولة مرة أخرى."
        : language === 'tn'
        ? "سامحني، ماقدرتش نعالج الطلب متاعك. عاود جرب."
        : "Sorry, I couldn't process your request. Please try again.";
      setResponse(errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse AI response and execute actions
  const parseAndExecuteAction = async (aiResponse: string): Promise<ActionResult | null> => {
    try {
      // Try to find JSON in the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*"action"[\s\S]*\}/);
      if (!jsonMatch) return null;

      const actionData: AIAction = JSON.parse(jsonMatch[0]);
      if (actionData.action === 'none') return null;

      return await executeAction(actionData);
    } catch (e) {
      // Not a JSON response, treat as regular conversation
      return null;
    }
  };

  // Execute the parsed action
  const executeAction = async (actionData: AIAction): Promise<ActionResult> => {
    const { action, params } = actionData;

    switch (action) {
      case 'navigate': {
        const pageMap: Record<string, string> = {
          'home': '/',
          'calendar': '/calendar',
          'events': '/calendar',
          'profile': '/profile',
          'strava': '/strava',
          'calories': '/calories',
          'settings': '/settings',
          'messages': '/messaging',
          'messaging': '/messaging',
          'create-post': '/create-post',
          'create-event': '/create-event',
          'notifications': '/notifications',
          'edit-profile': '/edit-profile',
          'login': '/login',
        };
        const path = pageMap[params.page] || '/';
        window.location.hash = `#${path}`;
        
        const messages: Record<string, Record<string, string>> = {
          fr: { success: `Navigation vers ${params.page}` },
          en: { success: `Navigating to ${params.page}` },
          ar: { success: `الانتقال إلى ${params.page}` }
        };
        return { success: true, message: messages[language].success, action: 'navigate' };
      }

      case 'fill_event_form': {
        // Store event form data and navigate to create event page
        sessionStorage.setItem('voice_event_draft', JSON.stringify({
          title: params.title || '',
          date: params.date || '',
          time: params.time || '',
          location: params.location || '',
          group: params.group || 'Tous',
          type: params.type || 'daily',
          description: params.description || '',
        }));
        window.location.hash = '#/create-event';
        
        const messages: Record<string, string> = {
          fr: `J'ai rempli le formulaire d'événement "${params.title}". Vérifiez et validez.`,
          en: `I've filled the event form "${params.title}". Review and submit.`,
          ar: `قمت بملء نموذج الحدث "${params.title}". راجع وأرسل.`
        };
        return { success: true, message: messages[language], action: 'fill_event_form' };
      }

      case 'fill_post_form': {
        // Store post form data and navigate to create post page
        sessionStorage.setItem('voice_post_draft', JSON.stringify({
          content: params.content || '',
          distance: params.distance || '',
          pace: params.pace || '',
          type: params.type || 'post',
        }));
        window.location.hash = '#/create-post';
        
        const messages: Record<string, string> = {
          fr: `J'ai rempli votre publication. Vous pouvez la modifier et la publier.`,
          en: `I've filled your post. You can edit and publish it.`,
          ar: `قمت بملء منشورك. يمكنك تعديله ونشره.`
        };
        return { success: true, message: messages[language], action: 'fill_post_form' };
      }

      case 'create_post': {
        // Legacy action - redirect to fill_post_form
        sessionStorage.setItem('voice_post_draft', JSON.stringify({
          content: params.content,
          distance: params.distance,
          pace: params.pace
        }));
        window.location.hash = '#/create-post';
        
        const messages: Record<string, string> = {
          fr: "J'ai préparé votre publication. Vous pouvez la modifier et la publier.",
          en: "I've prepared your post. You can edit and publish it.",
          ar: "أعددت منشورك. يمكنك تعديله ونشره."
        };
        return { success: true, message: messages[language], action: 'create_post' };
      }

      case 'add_calorie_entry': {
        // Store calorie entry and navigate to calories page
        const entry = {
          id: 'food_' + Date.now(),
          name: params.name || 'Food',
          calories: parseInt(params.calories) || 0,
          protein: params.protein ? parseInt(params.protein) : undefined,
          carbs: params.carbs ? parseInt(params.carbs) : undefined,
          fat: params.fat ? parseInt(params.fat) : undefined,
          meal: params.meal || 'snack',
          timestamp: new Date().toISOString(),
        };
        sessionStorage.setItem('voice_calorie_entry', JSON.stringify(entry));
        
        // Dispatch custom event to notify the page
        window.dispatchEvent(new CustomEvent('voice-add-calorie', { detail: entry }));
        
        // Navigate to calories page if not already there
        if (!window.location.hash.includes('/calories')) {
          window.location.hash = '#/calories';
        }
        
        const messages: Record<string, string> = {
          fr: `Ajouté: ${params.name} - ${params.calories} calories au ${params.meal || 'snack'}.`,
          en: `Added: ${params.name} - ${params.calories} calories to ${params.meal || 'snack'}.`,
          ar: `تمت الإضافة: ${params.name} - ${params.calories} سعرة حرارية إلى ${params.meal || 'snack'}.`
        };
        return { success: true, message: messages[language], action: 'add_calorie_entry' };
      }

      case 'update_calorie_profile': {
        // Store profile updates
        const profileUpdate = {
          height: params.height ? parseInt(params.height) : undefined,
          weight: params.weight ? parseInt(params.weight) : undefined,
          age: params.age ? parseInt(params.age) : undefined,
          gender: params.gender,
          activityLevel: params.activityLevel,
          goal: params.goal,
        };
        sessionStorage.setItem('voice_calorie_profile_update', JSON.stringify(profileUpdate));
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('voice-update-calorie-profile', { detail: profileUpdate }));
        
        // Navigate to calories page if not already there
        if (!window.location.hash.includes('/calories')) {
          window.location.hash = '#/calories';
        }
        
        const updateParts: string[] = [];
        if (params.weight) updateParts.push(`${params.weight}kg`);
        if (params.height) updateParts.push(`${params.height}cm`);
        if (params.age) updateParts.push(`${params.age} ans`);
        if (params.goal) updateParts.push(`objectif: ${params.goal}`);
        
        const messages: Record<string, string> = {
          fr: `Profil mis à jour: ${updateParts.join(', ')}.`,
          en: `Profile updated: ${updateParts.join(', ')}.`,
          ar: `تم تحديث الملف الشخصي: ${updateParts.join(', ')}.`
        };
        return { success: true, message: messages[language], action: 'update_calorie_profile' };
      }

      case 'add_water': {
        const glasses = params.glasses || 1;
        sessionStorage.setItem('voice_water_add', JSON.stringify({ glasses }));
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('voice-add-water', { detail: { glasses } }));
        
        // Navigate to calories page if not already there
        if (!window.location.hash.includes('/calories')) {
          window.location.hash = '#/calories';
        }
        
        const messages: Record<string, string> = {
          fr: `Ajouté ${glasses} verre${glasses > 1 ? 's' : ''} d'eau.`,
          en: `Added ${glasses} glass${glasses > 1 ? 'es' : ''} of water.`,
          ar: `تمت إضافة ${glasses} كوب ماء.`
        };
        return { success: true, message: messages[language], action: 'add_water' };
      }

      case 'fill_profile_form': {
        // Store profile form data and navigate to edit profile
        sessionStorage.setItem('voice_profile_draft', JSON.stringify({
          name: params.name || '',
          bio: params.bio || '',
        }));
        window.location.hash = '#/edit-profile';
        
        const messages: Record<string, string> = {
          fr: `J'ai rempli le formulaire de profil. Vérifiez et enregistrez.`,
          en: `I've filled the profile form. Review and save.`,
          ar: `قمت بملء نموذج الملف الشخصي. راجع واحفظ.`
        };
        return { success: true, message: messages[language], action: 'fill_profile_form' };
      }

      case 'fill_login_form': {
        // Store login form data and navigate to login
        sessionStorage.setItem('voice_login_draft', JSON.stringify({
          email: params.email || '',
          password: params.password || '',
        }));
        window.location.hash = '#/login';
        
        const messages: Record<string, string> = {
          fr: `J'ai rempli le formulaire de connexion. Cliquez sur connexion pour continuer.`,
          en: `I've filled the login form. Click login to continue.`,
          ar: `قمت بملء نموذج الدخول. انقر لتسجيل الدخول.`
        };
        return { success: true, message: messages[language], action: 'fill_login_form' };
      }

      case 'fill_message': {
        // Store message draft and navigate to messaging
        sessionStorage.setItem('voice_message_draft', JSON.stringify({
          to: params.to || '',
          message: params.message || '',
        }));
        window.location.hash = '#/messaging';
        
        const messages: Record<string, string> = {
          fr: `Message préparé pour ${params.to}. Sélectionnez la conversation pour l'envoyer.`,
          en: `Message prepared for ${params.to}. Select the conversation to send it.`,
          ar: `تم تحضير الرسالة لـ ${params.to}. حدد المحادثة لإرسالها.`
        };
        return { success: true, message: messages[language], action: 'fill_message' };
      }

      case 'join_event': {
        const messages: Record<string, string> = {
          fr: `Inscription à l'événement "${params.eventName}" en cours...`,
          en: `Signing up for event "${params.eventName}"...`,
          ar: `جاري التسجيل في الحدث "${params.eventName}"...`
        };
        // Navigate to events page
        window.location.hash = '#/calendar';
        return { success: true, message: messages[language], action: 'join_event' };
      }

      case 'leave_event': {
        const messages: Record<string, string> = {
          fr: `Désinscription de l'événement "${params.eventName}"`,
          en: `Leaving event "${params.eventName}"`,
          ar: `إلغاء التسجيل من الحدث "${params.eventName}"`
        };
        return { success: true, message: messages[language], action: 'leave_event' };
      }

      case 'get_events': {
        window.location.hash = '#/calendar';
        const messages: Record<string, string> = {
          fr: "Voici les événements. Consultez la page du calendrier.",
          en: "Here are the events. Check the calendar page.",
          ar: "إليك الأحداث. تحقق من صفحة التقويم."
        };
        return { success: true, message: messages[language], action: 'get_events' };
      }

      case 'get_profile': {
        window.location.hash = '#/profile';
        const messages: Record<string, string> = {
          fr: user ? `Voici votre profil, ${user.name}.` : "Navigation vers le profil.",
          en: user ? `Here's your profile, ${user.name}.` : "Navigating to profile.",
          ar: user ? `إليك ملفك الشخصي، ${user.name}.` : "الانتقال إلى الملف الشخصي."
        };
        return { success: true, message: messages[language], action: 'get_profile' };
      }

      case 'change_theme': {
        // Dispatch theme toggle event
        window.dispatchEvent(new CustomEvent('toggle-theme', { detail: params.theme }));
        const messages: Record<string, string> = {
          fr: `Thème changé en mode ${params.theme === 'dark' ? 'sombre' : 'clair'}.`,
          en: `Theme changed to ${params.theme} mode.`,
          ar: `تم تغيير المظهر إلى الوضع ${params.theme === 'dark' ? 'المظلم' : 'الفاتح'}.`
        };
        return { success: true, message: messages[language], action: 'change_theme' };
      }

      case 'change_language': {
        const newLang = params.language as 'fr' | 'en' | 'ar';
        setLanguage(newLang);
        const messages: Record<string, string> = {
          fr: "Langue changée en Français.",
          en: "Language changed to English.",
          ar: "تم تغيير اللغة إلى العربية."
        };
        return { success: true, message: messages[newLang], action: 'change_language' };
      }

      case 'send_message': {
        // Navigate to messaging and store draft
        sessionStorage.setItem('voice_message_draft', JSON.stringify({
          to: params.to,
          message: params.message
        }));
        window.location.hash = '#/messaging';
        const messages: Record<string, string> = {
          fr: `Message préparé pour ${params.to}. Ouvrez la conversation pour l'envoyer.`,
          en: `Message prepared for ${params.to}. Open the conversation to send it.`,
          ar: `تم تحضير الرسالة لـ ${params.to}. افتح المحادثة لإرسالها.`
        };
        return { success: true, message: messages[language], action: 'send_message' };
      }

      case 'search': {
        const messages: Record<string, string> = {
          fr: `Recherche de "${params.query}"...`,
          en: `Searching for "${params.query}"...`,
          ar: `جاري البحث عن "${params.query}"...`
        };
        return { success: true, message: messages[language], action: 'search' };
      }

      case 'help': {
        const helpMessages: Record<string, string> = {
          fr: `Je peux remplir tous les formulaires! Dites: "Crée un événement course dimanche", "Ajoute 500 calories pour le déjeuner", "Publie que j'ai couru 10km", "Change mon poids à 75kg", "Envoie un message à Mohamed", "Connecte-moi avec admin@rct.tn".`,
          en: `I can fill all forms! Say: "Create a running event on Sunday", "Add 500 calories for lunch", "Post that I ran 10km", "Change my weight to 75kg", "Send a message to Mohamed", "Log me in as admin@rct.tn".`,
          ar: `يمكنني ملء جميع النماذج! قل: "إنشاء حدث جري يوم الأحد"، "إضافة 500 سعرة حرارية للغداء"، "نشر أنني ركضت 10 كم"، "تغيير وزني إلى 75 كجم"، "إرسال رسالة إلى محمد"، "تسجيل الدخول كـ admin@rct.tn".`
        };
        return { success: true, message: helpMessages[language], action: 'help' };
      }

      default:
        return { success: false, message: 'Unknown action', action: 'none' };
    }
  };

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language for speech synthesis
    const langMap: Record<string, string> = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'ar': 'ar-SA',
      'tn': 'ar-TN'
    };
    utterance.lang = langMap[language] || 'fr-FR';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      const errorMsg = language === 'fr' 
        ? "Désolé, la reconnaissance vocale n'est pas supportée."
        : language === 'ar'
        ? "عذراً، التعرف على الصوت غير مدعوم."
        : language === 'tn'
        ? "سامحني، التعرف على الصوت ما يخدمش."
        : "Sorry, voice recognition is not supported.";
      speak(errorMsg);
      return;
    }
    
    try {
      // Reset state
      setTranscript('');
      setInterimTranscript('');
      setResponse('');
      finalTranscriptRef.current = '';
      
      // Clear any existing timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  }, [speak, language]);

  const stopListening = useCallback(() => {
    // Clear timeout
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    // Process any pending transcript before stopping
    if (finalTranscriptRef.current.trim()) {
      const textToProcess = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = '';
      processWithGroq(textToProcess);
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);

  return {
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    interimTranscript, // Show what user is currently saying
    response,
    isEnabled,
    startListening,
    stopListening,
    stopSpeaking,
    speak,
    toggle,
    clearHistory,
    isSupported: typeof window !== 'undefined' && 
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && 
      !!window.speechSynthesis,
  };
}
