/* VoiceSettings.css - Biostack Aesthetic */

.voice-settings-panel {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 16px;
  margin-top: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.settings-header {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.voice-controls-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.voice-selector {
  width: 100%;
  padding: 8px 10px;
  font-size: 14px;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  color: #1e293b;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.voice-selector:focus {
  outline: none;
  border-color: #3b82f6;
  ring: 2px rgba(59, 130, 246, 0.1);
}

.btn-play-example {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  background-color: #ffffff;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-play-example:hover:not(:disabled) {
  background-color: #f1f5f9;
  border-color: #94a3b8;
  color: #0f172a;
}

.btn-play-example:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f8fafc;
}

.btn-play-example:active:not(:disabled) {
  background-color: #e2e8f0;
  transform: translateY(1px);
}