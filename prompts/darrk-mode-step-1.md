# Dark-Mode-Implementation.md

This document outlines the implementation of Dark Mode for the Biostack application. The most robust and scalable approach uses CSS Variables combined with a data attribute (`data-theme="dark"`) on the root element. This allows for seamless theme toggling across all components, including the previously built `VoiceSettings` and `CitationCard`.

## Step 1: Define Global Theme Variables
**File Path:** `src/App.css` (or `src/index.css`)

Define the core color palettes for both light and dark modes at the root level.

```css
/* Define base variables for Light Mode */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --accent-color: #3b82f6;
  --accent-hover: #2563eb;
}

/* Override variables when Dark Mode is active */
[data-theme='dark'] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border-color: #334155;
  --accent-color: #60a5fa;
  --accent-hover: #3b82f6;
}

/* Apply variables globally to the body */
body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  /* Smooth transition for theme switching */
  transition: background-color 0.3s ease, color 0.3s ease; 
}