import React, { use, Suspense } from 'react';
import PubmedSearch from './PubmedSearch';
import VoiceSettings from './components/VoiceSettings';
import { useDarkMode } from './hooks/useDarkMode';

// Demo of using a promise with React 19's 'use' hook
const healthPromise = fetch('/api/health').then(res => res.json());

function HealthStatus() {
  const data = use(healthPromise);
  return <p>System Status: {data.status} (as of {new Date(data.timestamp).toLocaleTimeString()})</p>;
}

function App() {
  const { theme, toggleTheme } = useDarkMode();

  return (
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>BioStack</h1>
          <Suspense fallback={<p>Checking system health...</p>}>
            <HealthStatus />
          </Suspense>
        </div>
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn notranslate"
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
          <span>{theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
        </button>
      </header>
      <main style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <PubmedSearch />
        </div>
        <aside style={{ width: '300px' }}>
          <VoiceSettings />
        </aside>
      </main>
      <footer>
        <p>&copy; 2026 BioStack Platform | Apple Silicon Optimized</p>
      </footer>
    </div>
  );
}

export default App;
