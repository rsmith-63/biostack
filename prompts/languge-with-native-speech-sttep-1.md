# Updated useNativeSpeech Hook

This hook allows the Translation Dashboard to pass a specific language code (e.g., `es-ES`, `fr-FR`) to the browser's Speech Synthesis engine.

### `useNativeSpeech.jsx`

```javascript
import { useState, useEffect, useCallback } from 'react';

const useNativeSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState([]);

  // 1. Initialize and load system voices (some browsers load these async)
  useEffect(() => {
    if (!window.speechSynthesis) {
      setSupported(false);
      return;
    }

    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, []);

  /**
   * @param {string} text - The text to be spoken
   * @param {string} langCode - The language code from the dashboard (e.g., 'en-US')
   */
  const speak = useCallback((text, langCode = 'en-US') => {
    if (!window.speechSynthesis) return;

    // Cancel existing speech to prevent overlapping or queuing bugs
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 2. Map the language code from the dashboard
    utterance.lang = langCode;

    // 3. Attempt to find a high-quality native voice matching the language
    const preferredVoice = voices.find(voice => voice.lang === langCode);
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // State Tracking
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, supported };
};

export default useNativeSpeech;