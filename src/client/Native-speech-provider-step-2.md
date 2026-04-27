# Step 2: Create the AbstractView Component

**File Path:** `src/components/AbstractView.jsx`

This component displays the citation text and integrates our new custom hook to provide playback controls.

```javascript
import React from 'react';
import { useNativeSpeech } from '../hooks/useNativeSpeech';

export default function AbstractView({ text }) {
  const { speak, stop, isSpeaking } = useNativeSpeech();

  if (!text) return null;

  return (
    <div className="abstract-view">
      <div className="abstract-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0 }}>Abstract</h4>
        <button 
          onClick={() => isSpeaking ? stop() : speak(text)}
          style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: '4px' }}
        >
          {isSpeaking ? '🛑 Stop Reading' : '🔊 Read Abstract'}
        </button>
      </div>
      <p className="abstract-text">{text}</p>
    </div>
  );
}