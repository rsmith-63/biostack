import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NativeSpeechContext = createContext(null);

/**
 * NativeSpeechProvider manages the system's speech synthesis voices and 
 * provides a global context for text-to-speech functionality across Biostack.
 */
export function NativeSpeechProvider({ children }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  // 1. Initialize and load system voices (some browsers load these async)
  const updateVoices = useCallback(() => {
    if (!window.speechSynthesis) {
      setSupported(false);
      return;
    }

    const list = window.speechSynthesis.getVoices();
    setVoices(list);
    
    // Set a default English voice if nothing is selected yet
    if (!selectedVoiceURI && list.length > 0) {
      const defaultVoice = list.find(v => v.lang.startsWith('en')) || list[0];
      setSelectedVoiceURI(defaultVoice.voiceURI);
    }
  }, [selectedVoiceURI]);

  useEffect(() => {
    if (!window.speechSynthesis) {
      setSupported(false);
      return;
    }

    updateVoices();
    // Re-run when the browser finishes loading voices asynchronously
    window.speechSynthesis.onvoiceschanged = updateVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [updateVoices]);

  /**
   * Core speak function that supports both global selection and specific language codes.
   * @param {string} text - The text to be spoken
   * @param {string} langCode - Optional language code from the dashboard (e.g., 'es-ES')
   */
  const speak = useCallback((text, langCode = null) => {
    if (!window.speechSynthesis) return;

    // Cancel existing speech to prevent overlapping or queuing bugs
    window.speechSynthesis.cancel();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 2. Map the language code or use the globally selected voice
    if (langCode) {
      utterance.lang = langCode;
      
      // PRIORITY: If the user-selected voice matches the current language, use it!
      const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (selectedVoice && (selectedVoice.lang === langCode || selectedVoice.lang.startsWith(langCode))) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        // Fallback: Find the best native voice matching the translation
        const preferredVoice = voices.find(voice => voice.lang === langCode) ||
                               voices.find(voice => voice.lang.startsWith(langCode));
        if (preferredVoice) {
          utterance.voice = preferredVoice;
          utterance.lang = preferredVoice.lang;
        }
      }
    } else {
      // Use the global selection directly (standard mode)
      const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }
    }

    // State Tracking
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices, selectedVoiceURI]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return (
    <NativeSpeechContext.Provider value={{ 
      voices, 
      selectedVoiceURI, 
      setSelectedVoiceURI, 
      speak, 
      stop, 
      isSpeaking,
      supported 
    }}>
      {children}
    </NativeSpeechContext.Provider>
  );
}

/**
 * useNativeSpeech provides components with access to TTS controls.
 * Supports passing an optional langCode to automatically target a language.
 */
export function useNativeSpeech(langCode = null) {
  const context = useContext(NativeSpeechContext);
  if (!context) {
    throw new Error('useNativeSpeech must be used within a NativeSpeechProvider');
  }

  // If a langCode is provided, return a wrapped speak function that uses it
  if (langCode) {
    return {
      ...context,
      speak: (text) => context.speak(text, langCode)
    };
  }

  return context;
}

export default useNativeSpeech;
