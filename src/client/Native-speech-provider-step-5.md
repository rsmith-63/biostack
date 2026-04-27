# Step 5: Update the Global App

**File Path:** `src/App.jsx`

To ensure the Text-to-Speech functionality is available throughout the application and the selected voice persists, we must wrap the main application structure with the `SpeechProvider`. We will also integrate the `VoiceSettings` panel into the sidebar, positioning it directly below the MeSH terms panel as requested.

```javascript
import React from 'react';
import { SpeechProvider } from './hooks/useNativeSpeech';
import CitationCard from './components/CitationCard';
import VoiceSettings from './components/VoiceSettings';

/**
 * Main Application component for Biostack.
 * Integrates the SpeechProvider to manage global TTS state and
 * positions the VoiceSettings configuration in the sidebar.
 */
export default function App() {
  return (
    <SpeechProvider>
      <div className="app-container">
        <header className="app-header">
          <h1>Biostack Search</h1>
        </header>
        
        {/* Main Content Area */}
        <main className="main-content">
          <div className="results-list">
             {/* Example citation rendering */}
             <CitationCard />
          </div>
          
          {/* Sidebar Area */}
          <aside className="sidebar">
            <div className="mesh-terms-panel">
              <h4>MeSH Terms</h4>
              {/* Mesh terms data renders here */}
              <div className="mesh-list">
                <span className="mesh-badge">Computational Biology</span>
                <span className="mesh-badge">Data Integration</span>
              </div>
            </div>
            
            {/* VoiceSettings integrated directly below Mesh Terms */}
            <VoiceSettings />
          </aside>
        </main>
      </div>
    </SpeechProvider>
  );
}