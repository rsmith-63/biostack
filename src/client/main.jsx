import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './App.css';
import { NativeSpeechProvider } from './hooks/useNativeSpeech';
import { ThemeProvider } from './hooks/ThemeContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <NativeSpeechProvider>
        <App />
      </NativeSpeechProvider>
    </ThemeProvider>
  </StrictMode>,
);
