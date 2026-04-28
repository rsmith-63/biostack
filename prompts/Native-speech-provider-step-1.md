# Browser-TTS-Implementation.md

This document outlines the 6-step implementation for integrating native browser Text-To-Speech (TTS) into the Biostack application using `window.speechSynthesis`.

## Step 1: Create the Global State Hook
**File Path:** `src/hooks/useNativeSpeech.js`

To ensure the selected voice remains consistent across the entire UI, we use a React Context combined with a custom React 19 hook.

```javascript
import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const SpeechContext = createContext(null);

export const SpeechProvider = ({ children }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const synth = window.speechSynthesis;
    
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      
      // Default to the first available voice if none is selected
      if (availableVoices.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(availableVoices[0].voiceURI);
      }
    };

    loadVoices();
    
    // Chrome handles voice loading asynchronously
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, [selectedVoiceURI]);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    
    // Stop any current speech before starting a new one
    window.speechSynthesis.cancel(); 

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices, selectedVoiceURI]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return (
    <SpeechContext.Provider value={{ voices, selectedVoiceURI, setSelectedVoiceURI, speak, stop, isSpeaking }}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useNativeSpeech = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error("useNativeSpeech must be used within a SpeechProvider");
  }
  return context;
};