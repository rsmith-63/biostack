import React, { useRef } from 'react';
import { useNativeSpeech } from '../hooks/useNativeSpeech';
import { getActiveLanguage } from '../utils/languageDetection'; 

/**
 * AbstractView provides a UI for reading scientific abstracts.
 * It integrates with the language detection utility to automatically 
 * match the system voice with the dashboard's current translation.
 */
const AbstractView = ({ title, text }) => {
  // Use 'text' as the prop for the abstract content to match CitationCard's current usage
  const abstractText = text;
  const contentRef = useRef(null);

  // 1. Get the current active language from the Google Translate cookie
  const targetLanguage = getActiveLanguage();
  
  // 2. Use the global speech hook with the target language code.
  // This ensures the voice matches the dashboard's current translation.
  const { speak, stop, isSpeaking } = useNativeSpeech(targetLanguage);

  const handleSpeak = () => {
    // CAPTURE TRANSLATED TEXT:
    // If Google Translate is active, 'abstractText' (the React prop) remains English.
    // We read from the DOM via contentRef to get the actual translated text the user sees.
    const textToRead = contentRef.current ? contentRef.current.innerText : abstractText;
    speak(textToRead);
  };

  return (
    <section className="abstract-card">
      <div className="abstract-header notranslate">
        {title && (
          <h2 className="abstract-title" key={`title-${targetLanguage}`}>
            <span>{title}</span>
          </h2>
        )}
        <div className="speech-controls">
          {!isSpeaking ? (
            <button 
              className="speech-btn play" 
              onClick={handleSpeak}
              aria-label={`Read abstract in ${targetLanguage}`}
              title={`Read abstract in ${targetLanguage.toUpperCase()}`}
            >
              <span className="icon">▶</span> <span>Play ({targetLanguage.toUpperCase()})</span>
            </button>
          ) : (
            <button 
              className="speech-btn stop" 
              onClick={stop}
              aria-label="Stop reading"
            >
              <span className="icon">■</span> <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      <div className="abstract-body" key={`body-${targetLanguage}`} ref={contentRef}>
        <p><span>{abstractText}</span></p>
      </div>

      <style>{`
        .abstract-card {
          background: var(--bg-secondary, #ffffff);
          color: var(--text-primary, #1a1a1a);
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
          white-space: pre-wrap;
        }

        .icon {
          font-size: 12px;
        }
      `}</style>
    </section>
  );
};

export default AbstractView;
