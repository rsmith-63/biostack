# Language Detection Utility

This utility function is responsible for parsing the Google Translate `googtrans` cookie to determine the currently active language in the Biostack dashboard.

## Implementation

Save the following code in a utility file, for example `src/utils/languageDetection.js` (or `.ts` if you are using TypeScript).

```javascript
/**
 * Extracts the target language from the 'googtrans' cookie.
 * Google Translate sets this cookie in the format: /source_language/target_language (e.g., /en/fr).
 *
 * @returns {string} The active target language code (e.g., 'es', 'fr', 'de'). Defaults to 'en' if not found.
 */
export const getActiveLanguage = () => {
  // Ensure we are in a browser environment before accessing document.cookie
  if (typeof document === 'undefined') return 'en';

  // Use a regular expression to match the googtrans cookie and extract the target language
  const match = document.cookie.match(/googtrans=\\/([^/]+)\\/([^;]+)/);

  // match[2] corresponds to the second capture group (the target language)
  if (match && match[2]) {
    return match[2];
  }

  // Fallback to English
  return 'en';
};