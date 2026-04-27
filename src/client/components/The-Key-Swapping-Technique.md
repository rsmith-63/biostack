## Solution: The Key-Swapping Technique (React Synchronization)

When using the Web Speech API alongside Google Translate, React often loses track of the DOM because Google Translate mutates text nodes into `<font>` tags. If React tries to update a component (like changing a "Play" button to "Stop"), it crashes with a `removeChild` error because the original text node no longer exists.

To fix this, we use **Key-Swapping**. By changing the `key` prop of the text container whenever the language changes, we force React to unmount the corrupted DOM node and mount a brand new, clean version that React fully controls.

### Implementation

Update your component to use the `targetLanguage` as a `key` on the elements that contain translated text.

```jsx
const AbstractView = ({ title, text }) => {
  const abstractText = text;
  // Get the current active language (e.g., 'en', 'es', 'fr')
  const targetLanguage = getActiveLanguage(); 
  const { speak, stop, isSpeaking } = useNativeSpeech(targetLanguage);

  return (
    <section className="abstract-card">
      <div className="abstract-header notranslate">
        {/* The Key-Swap: Forces a fresh render of the title when language changes */}
        <h2 key={`title-${targetLanguage}`}>
          <span>{title}</span>
        </h2>
        
        <div className="speech-controls">
          <button 
            onClick={() => speak(abstractText)}
            disabled={isSpeaking}
          >
            <span>{isSpeaking ? 'Speaking...' : `Play (${targetLanguage})`}</span>
          </button>
        </div>
      </div>

      {/* The Key-Swap: Changing the key here is the secret. 
          When targetLanguage changes, React discards the old <p> 
          (and Google's <font> tags) and creates a brand new one.
      */}
      <div className="abstract-body" key={`body-${targetLanguage}`}>
        <p><span>{abstractText}</span></p>
      </div>
    </section>
  );
};