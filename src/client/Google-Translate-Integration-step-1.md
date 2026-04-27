# Updated VoiceSettings.jsx Implementation

This component integrates Google Translate into the Biostack dashboard. It uses a custom dialog to bypass the default Google Translate banner, maintaining the application's UI consistency.

## Component Code

```jsx
import React, { useState, useEffect } from 'react';
import { SUPPORTED_LANGUAGES } from './languageSupport'; // Path to your language data file

const VoiceSettings = () => {
  const [isTranslateDialogOpen, setIsTranslateDialogOpen] = useState(false);
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('es');

  useEffect(() => {
    // 1. Programmatic Script Injection
    // Ensures Google's legacy library is available globally
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//[translate.google.com/translate_a/element.js?cb=googleTranslateElementInit](https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit)';
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        }, 'google_translate_element');
      };
    }
  }, []);

  const handleApplyTranslation = () => {
    // Google Translate looks for the 'googtrans' cookie
    // Format: /source_language/target_language
    const langValue = `/${fromLang}/${toLang}`;
    
    // Clear existing cookies to ensure the new selection takes priority
    const cookieBase = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = cookieBase;
    document.cookie = `${cookieBase} domain=.${window.location.hostname};`;
    
    // Set the new translation cookie
    document.cookie = `googtrans=${langValue}; path=/;`;
    document.cookie = `googtrans=${langValue}; domain=.${window.location.hostname}; path=/;`;
    
    // Reload is necessary for the Google script to re-parse the DOM
    window.location.reload();
  };

  const handleReset = () => {
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${window.location.hostname}; path=/;`;
    window.location.reload();
  };

  return (
    <div className="voice-settings-wrapper">
      {/* Existing Native TTS Controls would go here */}

      <div className="translation-section" style={{ marginTop: '24px' }}>
        <button 
          className="control-button primary" 
          onClick={() => setIsTranslateDialogOpen(true)}
        >
          Translate Dashboard
        </button>
        <button 
          className="control-button secondary" 
          onClick={handleReset}
          style={{ marginLeft: '8px' }}
        >
          Reset
        </button>
      </div>

      {/* Required hidden anchor for Google API */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>

      {/* Modal Dialog */}
      {isTranslateDialogOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Language Settings</h3>
            
            <div className="field-group">
              <label htmlFor="from-select">Translate From:</label>
              <select 
                id="from-select"
                value={fromLang} 
                onChange={(e) => setFromLang(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={`from-${lang.code}`} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="to-select">Translate To:</label>
              <select 
                id="to-select"
                value={toLang} 
                onChange={(e) => setToLang(e.target.value)}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={`to-${lang.code}`} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn-action apply" onClick={handleApplyTranslation}>
                Apply
              </button>
              <button className="btn-action cancel" onClick={() => setIsTranslateDialogOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        .modal-content {
          background: var(--bg-color, #fff);
          color: var(--text-color, #1a1a1a);
          padding: 24px;
          border-radius: 12px;
          width: 400px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border-color, #e5e7eb);
        }
        .modal-title {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 1.25rem;
        }
        .field-group {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        }
        .field-group label {
          font-size: 0.875rem;
          margin-bottom: 6px;
          opacity: 0.8;
        }
        .field-group select {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--border-color, #d1d5db);
          background: var(--bg-color, #fff);
          color: var(--text-color, #111);
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        .btn-action {
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          border: none;
        }
        .btn-action.apply {
          background: #2563eb;
          color: white;
        }
        .btn-action.cancel {
          background: transparent;
          color: var(--text-color);
          border: 1px solid var(--border-color);
        }
        .control-button {
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          border: 1px solid var(--border-color);
          background: var(--bg-color);
          color: var(--text-color);
        }
        .control-button.primary {
          background: #2563eb;
          color: #fff;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default VoiceSettings;