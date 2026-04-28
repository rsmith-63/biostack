# Task: Create and Integrate PubMed Citation Cards

**Objective:** Parse the raw JSON array returned from the `@iflow-mcp/pubmed-mcp-server` and render it into cleanly formatted React citation cards. This will replace the raw `<pre>` tag dump in the search UI.

## Step 1: Create the Citation Card Component
Create a new reusable component to display individual PubMed records. This component should safely extract typical NCBI fields and provide a collapsible abstract view.

**File:** `client/src/components/CitationCard.jsx`
**Action:** Create new file
```jsx
import React from 'react';

export default function CitationCard({ article }) {
  // Safely extract fields based on typical PubMed MCP output.
  // Fallbacks are provided in case certain metadata is missing from the API response.
  const {
    pmid,
    title,
    authors,
    journal,
    pubDate,
    abstract
  } = article;

  const pubmedUrl = pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '#';

  return (
    <div className="citation-card" style={styles.card}>
      <h3 style={styles.title}>
        <a href={pubmedUrl} target="_blank" rel="noopener noreferrer">
          {title || 'Untitled Publication'}
        </a>
      </h3>
      
      <p style={styles.authors}>
        <strong>Authors:</strong> {authors && authors.length > 0 ? authors.join(', ') : 'N/A'}
      </p>
      
      <p style={styles.meta}>
        <em>{journal || 'Unknown Journal'}</em> | {pubDate || 'Unknown Date'} | <strong>PMID:</strong> {pmid || 'N/A'}
      </p>
      
      {abstract && (
        <details style={styles.abstractDetails}>
          <summary style={styles.summary}>View Abstract</summary>
          <p style={styles.abstractText}>{abstract}</p>
        </details>
      )}
    </div>
  );
}

// Inline styles for quick scaffolding; migrate to CSS/Tailwind later if preferred.
const styles = {
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  title: { 
    marginTop: 0, 
    fontSize: '1.1rem', 
    color: '#2b6cb0',
    lineHeight: '1.4'
  },
  authors: { 
    fontSize: '0.9rem', 
    color: '#4a5568', 
    marginBottom: '6px',
    marginTop: '8px'
  },
  meta: { 
    fontSize: '0.85rem', 
    color: '#718096', 
    marginBottom: '12px' 
  },
  abstractDetails: { 
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #edf2f7'
  },
  summary: { 
    cursor: 'pointer', 
    fontWeight: '600', 
    color: '#2d3748', 
    fontSize: '0.9rem',
    userSelect: 'none'
  },
  abstractText: { 
    fontSize: '0.9rem', 
    lineHeight: '1.6', 
    marginTop: '10px', 
    color: '#2d3748' 
  }
};