import React, { useRef, useState, useEffect } from 'react';
import { useNativeSpeech } from '../hooks/useNativeSpeech';
import { getActiveLanguage } from '../utils/languageDetection';
import VoiceSettings from '../components/VoiceSettings';

let globalActiveVoiceId = null;

const AbstractView = ({ article, onSave, saving }) => {
  const abstractText = article?.abstract || 'No abstract available.';
  const title = article?.title || 'Untitled';
  const pubmedId = article?.pmid;
  const contentRef = useRef(null);

  // Initial state check from the backend article payload
  const [hasStructure, setHasStructure] = useState(!!article?.is3DViewerEligible);
  const [structureData, setStructureData] = useState(null);
  
  // Track whether the asynchronous rehydration is actively working
  const [isRehydrating, setIsRehydrating] = useState(true);

  useEffect(() => {
    let isMounted = true;

    if (pubmedId && hasStructure && !structureData) {
      setIsRehydrating(true);
      
      fetch(`/api/structure/${pubmedId}`)
        .then(res => res.json())
        .then(result => {
          if (!isMounted) return;
          
          if (result.data && (result.data.url || (Array.isArray(result.data) && result.data.length > 0))) {
            setStructureData(result.data);
            setHasStructure(true);
          } else {
            setHasStructure(false);
          }
        })
        .catch(() => {
          if (isMounted) setHasStructure(false);
        })
        .finally(() => {
          if (isMounted) setIsRehydrating(false);
        });
    } else {
      setIsRehydrating(false);
    }

    return () => {
      isMounted = false;
    };
  }, [pubmedId, hasStructure, structureData]);

  const targetLanguage = getActiveLanguage();
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
  const { speak, stop, isSpeaking } = useNativeSpeech(targetLanguage);

  useEffect(() => {
    if (!isSpeaking && globalActiveVoiceId === pubmedId) {
      globalActiveVoiceId = null;
      window.dispatchEvent(new Event('abstract-speech-sync'));
    }
    const handleSync = () => setLocalIsSpeaking(globalActiveVoiceId === pubmedId);
    window.addEventListener('abstract-speech-sync', handleSync);
    return () => window.removeEventListener('abstract-speech-sync', handleSync);
  }, [isSpeaking, pubmedId]);

  const handleSpeak = () => {
    const textToRead = contentRef.current ? contentRef.current.innerText : abstractText;
    globalActiveVoiceId = pubmedId;
    window.dispatchEvent(new Event('abstract-speech-sync'));
    speak(textToRead);
  };

  const handleStop = () => {
    globalActiveVoiceId = null;
    window.dispatchEvent(new Event('abstract-speech-sync'));
    stop();
  };

  const handleLaunchViewer = () => {
    // If clicking is allowed, structureData is fully locked and populated
    if (!structureData) return;
    
    sessionStorage.setItem(`structure_${pubmedId}`, JSON.stringify(structureData));
    window.open(`/viewer/${pubmedId}`, '_blank');
  };

  return (
    <section className="abstract-card">
      <div className="abstract-header notranslate">
        {title && <h2 className="abstract-title" key={`title-${targetLanguage}`}><span>{title}</span></h2>}
        <div className="speech-controls" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onSave && (
            <button className="speech-btn save" onClick={onSave} disabled={saving}>
              <span className="icon">💾</span> <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
          )}
          {!localIsSpeaking ? (
            <button className="speech-btn play" onClick={handleSpeak}>
              <span className="icon">▶</span> <span>Play ({targetLanguage.toUpperCase()})</span>
            </button>
          ) : (
            <button className="speech-btn stop" onClick={handleStop}>
              <span className="icon">■</span> <span>Stop</span>
            </button>
          )}
          
          {hasStructure && (
            <button 
              className={`speech-btn viewer ${isRehydrating ? 'loading' : 'ready'}`}
              onClick={handleLaunchViewer} 
              disabled={isRehydrating}
              style={{
                opacity: isRehydrating ? 0.7 : 1,
                cursor: isRehydrating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {isRehydrating ? (
                <>
                  <span className="icon">⏳</span> <span>...loading 3D info</span>
                </>
              ) : (
                <>
                  <span className="icon">🧬</span> <span>3D Viewer</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      <VoiceSettings initialOpen={false} />
      <div className="abstract-body" key={`body-${targetLanguage}`} ref={contentRef}>
        <p><span>{abstractText}</span></p>
      </div>
    </section>
  );
};

export default AbstractView;
