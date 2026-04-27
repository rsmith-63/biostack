# Fix PubMed Pagination Error (ZodError: webEnv/queryKey undefined)

## Error Summary

A 400 HTTP error occurs when calling `pubmed_fetch_contents`.

### Error Trace

- `Invalid input: expected string, received undefined`
- Missing fields:
  - `webEnv`
  - `queryKey`

---

## Root Cause

The application is attempting to use **Entrez History-based pagination** without providing required parameters.

`pubmed_fetch_contents` requires:

- `WebEnv` (session identifier)
- `queryKey` (query reference)

These are only returned by `pubmed_search_articles` when using history.

---

## Why This Happens

You are mixing two pagination strategies:

### Strategy 1: Direct Pagination (No History)
- Uses:
  - `maxResults`
  - `retstart`
- Does NOT require:
  - `WebEnv`
  - `queryKey`

### Strategy 2: History-Based Pagination
- Uses:
  - `WebEnv`
  - `queryKey`
  - `retstart`
  - `retmax`

❌ Current bug: Using Strategy 2 without required parameters

---

## Fix Option A (Recommended)

### Use Direct Pagination Only

Remove `pubmed_fetch_contents` and use:

```js
pubmed_search_articles({
  query,
  maxResults,
  retstart
});