# Refactoring `index.js` to use `e-link-search.mjs`

Depending on your project's module setup in `package.json` (`"type": "module"` vs CommonJS), you can refactor `index.js` using one of the approaches below.

## Option 1: If your project uses ES Modules (Recommended)
*Requires `"type": "module"` in your `package.json`.*

If your project natively supports ES modules, you can directly import the logic from `e-link-search.mjs` into `index.js` and execute it. 

### 1. Ensure `e-link-search.mjs` exports its main function:
```javascript
// e-link-search.mjs
export async function runSearch(query) {
  // ... your existing e-link search logic ...
  console.log(`Running search for: ${query}`);
}