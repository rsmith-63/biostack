# Implementation Logic: AbstractView.jsx

This document provides the complete implementation for the `AbstractView` component in the Biostack project. It integrates the language detection utility with the native speech hook, ensuring the text-to-speech engine automatically matches the language currently selected in your dashboard's Google Translate settings.

## Component Code

Save this code in your components directory (e.g., `src/components/AbstractView.jsx`). Make sure the import paths for the hook and utility match your project structure.

```jsx
import React from 'react';
import { useNativeSpeech } from '../hooks/useNativeSpeech';
import { getActiveLanguage } from '../utils/languageDetection'; 

const AbstractView = ({ title, abstractText }) => {
  // 1. Get the current active language from the Google Translate cookie
  const targetLanguage = getActiveLanguage();
  
  // 2. Pass the language to the hook to filter for the correct macOS/system voice
  const { speak, stop, isSpeaking } = useNativeSpeech(targetLanguage);

  return (
    <section className="abstract-card">
      <div className="abstract-header">
        <h2 className="abstract-title">{title}</h2>
        <div className="speech-controls">
          {!isSpeaking ? (
            <button 
              className="speech-btn play" 
              onClick={() => speak(abstractText)}
              aria-label={`Read abstract in ${targetLanguage.toUpperCase()}`}
              title={`Read in ${targetLanguage.toUpperCase()}`}
            >
              <span className="icon">▶</span> Play ({targetLanguage.toUpperCase()})
            </button>
          ) : (
            <button 
              className="speech-btn stop" 
              onClick={stop}
              aria-label="Stop reading"
            >
              <span className="icon">■</span> Stop
            </button>
          )}
        </div>
      </div>

      <div className="abstract-body">
        <p>{abstractText}</p>
      </div>

      <style>{`
        .abstract-card {
          background: var(--bg-color, #ffffff);
          color: var(--text-color, #1a1a1a);
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 12px;
          padding: 24px;
          margin: 16px 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        .abstract-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          gap: 16px;
        }

        .abstract-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
        }

        .speech-controls {
          flex-shrink: 0;
        }

        .speech-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: opacity 0.2s;
          white-space: nowrap;
        }

        .speech-btn.play {
          background-color: #2563eb;
          color: white;
        }

        .speech-btn.stop {
          background-color: #dc2626;
          color: white;
        }

        .speech-btn:hover {
          opacity: 0.9;
        }

        .abstract-body {
          line-height: 1.6;
          font-size: 1rem;
          opacity: 0.9;
        }

        .icon {
          font-size: 12px;
        }
      `}</style>
    </section>
  );
};

export default AbstractView;