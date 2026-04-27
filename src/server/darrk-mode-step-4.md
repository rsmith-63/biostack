# Step 4: Add the Theme Toggle UI

**File Path:** `src/App.jsx`

The final step is to integrate the `useDarkMode` hook into your main application layout and provide a button for users to toggle the aesthetic. We will place this button in the global header so it remains accessible from anywhere in the application.

```javascript
import React from 'react';
import { SpeechProvider } from './hooks/useNativeSpeech';
import { useDarkMode } from './hooks/useDarkMode';
import CitationCard from './components/CitationCard';
import VoiceSettings from './components/VoiceSettings';

/**
 * Main Application component for Biostack.
 * Wraps the app in necessary providers and integrates the global theme toggle.
 */
export default function App() {
  // Initialize the dark mode hook
  const { theme, toggleTheme } = useDarkMode();

  return (
    <SpeechProvider>
      <div className="biostack-layout">
        
        {/* Global Application Header */}
        <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>Biostack Search</h1>
          
          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </header>

        <div className="content-grid">
          {/* Main Results Column */}
          <main className="results-container">
             <CitationCard />
          </main>

          {/* Sidebar Column */}
          <aside className="sidebar-panels">
            <section className="mesh-terms-panel">
              <h4>MeSH Terms</h4>
              <div className="mesh-list">
                <span className="mesh-badge">Computational Biology</span>
                <span className="mesh-badge">Data Integration</span>
              </div>
            </section>

            {/* Voice Settings Configuration */}
            <VoiceSettings />
          </aside>
        </div>
      </div>
    </SpeechProvider>
  );
}