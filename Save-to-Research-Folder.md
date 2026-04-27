# Task: Add "Save to Research Folder" Functionality

**Objective:** Update the `CitationCard` component to include a button that generates and downloads a formatted text file of the research article's metadata and abstract.

## File to Update
**Path:** `/Users/robsmith/biostack/src/client/CitationCard.jsx`

## Instructions for Agent
1. **Add Download Logic:** Create a helper function `handleSave` that formats the article data into a readable string.
2. **Blob Generation:** Use a `Blob` and `URL.createObjectURL` to trigger a browser download.
3. **UI Update:** Add a "Save to Research Folder" button next to the "View Abstract" summary.

## Updated Component Code

```jsx
import React from 'react';

export default function CitationCard({ article }) {
  const {
    pmid,
    title,
    authors,
    journal,
    pubDate,
    abstract
  } = article;

  const pubmedUrl = pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '#';

  // Function to handle the local "Save" action
  const handleSave = () => {
    const fileContent = `
TITLE: ${title || 'Untitled'}
AUTHORS: ${authors?.join(', ') || 'N/A'}
JOURNAL: ${journal || 'N/A'}
DATE: ${pubDate || 'N/A'}
PMID: ${pmid || 'N/A'}
URL: ${pubmedUrl}

ABSTRACT:
${abstract || 'No abstract available.'}
    `.trim();

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Format filename: PMID_Title_Snippet.txt
    const safeTitle = (title || 'article').substring(0, 30).replace(/[^a-z0-9]/gi, '_');
    link.href = url;
    link.download = `PMID_${pmid || 'unknown'}_${safeTitle}.txt`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="citation-card" style={styles.card}>
      <h3 style={styles.title}>
        <a href={pubmedUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
          {title || 'Untitled Publication'}
        </a>
      </h3>
      
      <p style={styles.authors}>
        <strong>Authors:</strong> {authors && authors.length > 0 ? authors.join(', ') : 'N/A'}
      </p>
      
      <p style={styles.meta}>
        <em>{journal || 'Unknown Journal'}</em> | {pubDate || 'Unknown Date'} | <strong>PMID:</strong> {pmid || 'N/A'}
      </p>

      <div style={styles.actionRow}>
        <button onClick={handleSave} style={styles.saveButton}>
          💾 Save to Research Folder
        </button>
        
        {abstract && (
          <details style={styles.abstractDetails}>
            <summary style={styles.summary}>View Abstract</summary>
            <p style={styles.abstractText}>{abstract}</p>
          </details>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  title: { marginTop: 0, fontSize: '1.15rem', lineHeight: '1.4' },
  link: { color: '#2b6cb0', textDecoration: 'none' },
  authors: { fontSize: '0.9rem', color: '#4a5568', margin: '8px 0' },
  meta: { fontSize: '0.85rem', color: '#718096', marginBottom: '16px' },
  actionRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: '1px solid #edf2f7',
    paddingTop: '16px'
  },
  saveButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#38a169',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  abstractDetails: { width: '100%' },
  summary: { cursor: 'pointer', fontWeight: '600', color: '#4a5568', fontSize: '0.9rem' },
  abstractText: { fontSize: '0.9rem', lineHeight: '1.6', marginTop: '10px', color: '#2d3748' }
};