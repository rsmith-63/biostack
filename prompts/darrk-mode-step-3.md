# Step 3: Create the Theme Toggle Hook

**File Path:** `src/hooks/useDarkMode.js`

Create a custom React hook to manage the global theme state. This hook will initialize the theme based on the user's saved preference in `localStorage` or default to their operating system's system-level setting. It also automatically updates the root HTML element when the theme changes.

```javascript
import { useState, useEffect } from 'react';

/**
 * Custom hook to manage Dark Mode state across the Biostack application.
 */
export function useDarkMode() {
  // Initialize state based on localStorage or OS preference
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('biostack-theme');
    if (savedTheme) {
      return savedTheme;
    }
    // Check OS preference for an optimal first-paint experience
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    // Apply the active theme to the HTML root element via a data attribute
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Persist the user's choice to local storage
    localStorage.setItem('biostack-theme', theme);
  }, [theme]);

  // Provide a simple toggle function to be wired up to UI buttons
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}