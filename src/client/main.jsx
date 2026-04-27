import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './App.css';
import { NativeSpeechProvider } from './hooks/useNativeSpeech';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NativeSpeechProvider>
      <App />
    </NativeSpeechProvider>
  </StrictMode>,
);
