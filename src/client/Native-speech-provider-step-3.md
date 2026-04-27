import React from 'react';
import { useNativeSpeech } from '../hooks/useNativeSpeech';
import './VoiceSettings.css';

/**
 * VoiceSettings provides a UI panel for configuring the browser's 
 * native speech synthesis, maintaining the Biostack project aesthetic.
 */
const VoiceSettings = () => {
  const { voices, selectedVoiceURI, setSelectedVoiceURI, speak } = useNativeSpeech();

  const handleVoiceChange = (e) => {
    setSelectedVoiceURI(e.target.value);
  };

  const handleTestVoice = () => {
    // Play an example to demonstrate the selected voice and accent
    speak("This is an example of the selected voice for the Biostack platform.");
  };

  return (
    <section className="voice-settings-panel">
      <h4 className="settings-header">Voice Settings</h4>
      <div className="voice-controls-container">
        <select 
          className="voice-selector"
          value={selectedVoiceURI} 
          onChange={handleVoiceChange}
          aria-label="Select TTS Voice"
        >
          {voices.length === 0 ? (
            <option>Loading voices...</option>
          ) : (
            voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))
          )}
        </select>
        
        <button 
          type="button"
          className="btn-play-example"
          onClick={handleTestVoice}
          disabled={!selectedVoiceURI}
        >
          Play Example
        </button>
      </div>
    </section>
  );
};

export default VoiceSettings;