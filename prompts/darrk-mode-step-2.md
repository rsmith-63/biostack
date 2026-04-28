# Step 2: Refactor Component Styles

**File Path:** `src/components/VoiceSettings.css` (and other component CSS files)

With the global CSS variables defined, the next step is to update your existing component stylesheets. You need to replace all hard-coded color hex values with the corresponding `var(--variable-name)` references. This ensures the components automatically adapt when the data-theme attribute changes on the root element.

Here is how to update the `VoiceSettings.css` file we created earlier:

```css
/* Updated VoiceSettings.css for Dark Mode Support */

.voice-settings-panel {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  margin-top: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.settings-header {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color 0.3s ease;
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
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

.voice-selector:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.btn-play-example {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-play-example:hover:not(:disabled) {
  background-color: var(--bg-secondary);
  border-color: var(--text-secondary);
  color: var(--text-primary);
}

.btn-play-example:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: var(--bg-secondary);
}

.btn-play-example:active:not(:disabled) {
  transform: translateY(1px);
}