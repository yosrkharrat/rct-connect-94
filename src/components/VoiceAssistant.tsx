import { Mic, MicOff, Volume2, VolumeX, HelpCircle, X, Loader2, Trash2 } from 'lucide-react';
import { useGroqVoiceAssistant } from '@/hooks/use-groq-voice-assistant';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';

const VoiceAssistant = () => {
  const {
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    interimTranscript,
    response,
    isEnabled,
    startListening,
    stopListening,
    stopSpeaking,
    toggle,
    clearHistory,
    isSupported,
  } = useGroqVoiceAssistant();

  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  // Keyboard shortcut: Ctrl/Cmd + Shift + V to toggle assistant
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [toggle]);

  if (!isSupported) {
    return null;
  }

  const texts = {
    fr: {
      enable: 'Activer l\'assistant vocal',
      title: 'Assistant Vocal IA',
      listening: 'Je vous écoute... (2s de pause pour valider)',
      speaking: 'Je parle...',
      processing: 'Réflexion...',
      waiting: 'En attente',
      youSaid: 'Vous avez dit :',
      currentlySaying: 'Vous dites :',
      response: 'Réponse :',
      commands: 'Exemples de commandes :',
      speak: 'Parler',
      stop: 'Valider',
      silence: 'Silence',
      shortcut: 'Raccourci: Ctrl+Shift+V',
      commandList: [
        '"Ouvre le calendrier"',
        '"Quels événements cette semaine ?"',
        '"Crée une publication: 5km ce matin"',
        '"Envoie un message à Mohamed"',
        '"Change la langue en anglais"',
        '"Aide"',
      ],
    },
    en: {
      enable: 'Enable voice assistant',
      title: 'AI Voice Assistant',
      listening: 'Listening... (2s pause to submit)',
      speaking: 'Speaking...',
      processing: 'Thinking...',
      waiting: 'Ready',
      youSaid: 'You said:',
      currentlySaying: 'You\'re saying:',
      response: 'Response:',
      commands: 'Example commands:',
      speak: 'Speak',
      stop: 'Submit',
      silence: 'Silence',
      shortcut: 'Shortcut: Ctrl+Shift+V',
      commandList: [
        '"Open the calendar"',
        '"What events this week?"',
        '"Create a post: 5km run this morning"',
        '"Send a message to Mohamed"',
        '"Change language to French"',
        '"Help"',
      ],
    },
    ar: {
      enable: 'تفعيل المساعد الصوتي',
      title: 'المساعد الصوتي الذكي',
      listening: 'جاري الاستماع... (ثانيتان للتأكيد)',
      speaking: 'جاري التحدث...',
      processing: 'جاري التفكير...',
      waiting: 'جاهز',
      youSaid: 'قلت:',
      currentlySaying: 'تقول:',
      response: 'الرد:',
      commands: 'أمثلة على الأوامر:',
      speak: 'تحدث',
      stop: 'تأكيد',
      silence: 'صمت',
      shortcut: 'اختصار: Ctrl+Shift+V',
      commandList: [
        '"افتح التقويم"',
        '"ما هي أحداث هذا الأسبوع؟"',
        '"أنشئ منشور: جريت 5 كم هذا الصباح"',
        '"أرسل رسالة إلى محمد"',
        '"غير اللغة للفرنسية"',
        '"مساعدة"',
      ],
    },
  };

  const txt = texts[language] || texts.fr;

  if (!isEnabled) {
    return (
      <button
        onClick={toggle}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[#FC4C02] to-[#FF6B35] text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        aria-label={txt.enable}
        title={`${txt.enable}\n${txt.shortcut}`}
      >
        <Volume2 className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-24 right-4 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300"
      style={{ width: isExpanded ? '340px' : '300px' }}
      role="dialog"
      aria-label={txt.title}
      aria-live="polite"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[#FC4C02] to-[#FF6B35] text-white rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Volume2 className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-sm">{txt.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Clear history"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={toggle}
            className="w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Status */}
        <div className="text-center">
          {isProcessing ? (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mx-auto flex items-center justify-center animate-pulse">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {txt.processing}
              </p>
            </div>
          ) : isListening ? (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-full bg-red-500 mx-auto flex items-center justify-center relative">
                <Mic className="w-7 h-7 text-white" />
                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {txt.listening}
              </p>
            </div>
          ) : isSpeaking ? (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-full bg-blue-500 mx-auto flex items-center justify-center relative">
                <Volume2 className="w-7 h-7 text-white" />
                <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-30" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {txt.speaking}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto flex items-center justify-center">
                <MicOff className="w-7 h-7 text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {txt.waiting}
              </p>
            </div>
          )}
        </div>

        {/* Transcript */}
        {(transcript || interimTranscript) && (
          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              {interimTranscript ? txt.currentlySaying : txt.youSaid}
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              "{transcript}{interimTranscript && <span className="text-gray-400 dark:text-gray-500"> {interimTranscript}...</span>}"
            </p>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="bg-gradient-to-r from-[#FC4C02]/10 to-[#FF6B35]/10 rounded-xl p-3 max-h-32 overflow-y-auto">
            <p className="text-xs font-semibold text-[#FC4C02] mb-1">
              {txt.response}
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {response}
            </p>
          </div>
        )}

        {/* Help - expanded mode */}
        {isExpanded && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
              {txt.commands}
            </p>
            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1.5">
              {txt.commandList.map((cmd, i) => (
                <li key={i} className="flex items-start gap-1">
                  <span className="text-blue-500">•</span>
                  <span>{cmd}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {isListening ? (
            <button
              onClick={stopListening}
              className="flex-1 h-12 bg-red-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-red-600"
              aria-label={txt.stop}
            >
              <MicOff className="w-5 h-5" />
              {txt.stop}
            </button>
          ) : isSpeaking ? (
            <button
              onClick={stopSpeaking}
              className="flex-1 h-12 bg-gray-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-gray-600"
              aria-label={txt.silence}
            >
              <VolumeX className="w-5 h-5" />
              {txt.silence}
            </button>
          ) : (
            <button
              onClick={startListening}
              disabled={isProcessing}
              className="flex-1 h-12 bg-gradient-to-r from-[#FC4C02] to-[#FF6B35] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 hover:opacity-90 disabled:opacity-50"
              aria-label={txt.speak}
            >
              <Mic className="w-5 h-5" />
              {txt.speak}
            </button>
          )}
        </div>

        {/* Keyboard shortcut hint */}
        <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">
          {txt.shortcut}
        </p>
      </div>
    </div>
  );
};

export default VoiceAssistant;
