# Step 6: Update CitationCard

**File Path:** `src/components/CitationCard.jsx`

In this final step, we integrate the new `AbstractView` component into the existing `CitationCard` UI. This allows the Text-to-Speech functionality to be accessed directly within each search result, conditionally rendering only if an abstract is available for that specific citation.

```javascript
import React from 'react';
import AbstractView from './AbstractView';

/**
 * CitationCard displays individual bibliographic data for Biostack.
 * Integrates the AbstractView to enable native TTS for scientific abstracts.
 */
export default function CitationCard({ citation }) {
  // Graceful fallback if citation data isn't loaded yet
  if (!citation) {
    return (
      <div className="citation-card loading">
        <p>Loading citation data...</p>
      </div>
    );
  }

  return (
    <article className="citation-card">
      <header className="citation-header">
        <h3 className="citation-title">{citation.title}</h3>
        <div className="citation-metadata">
          <span className="citation-authors">
            {citation.authors?.join(', ') || 'Unknown Authors'}
          </span>
          <span className="citation-source">
            {citation.journal} • {citation.year}
          </span>
        </div>
      </header>

      {/* Conditionally render the TTS-enabled abstract view if the data exists */}
      {citation.abstract && (
        <section className="citation-body">
          <AbstractView text={citation.abstract} />
        </section>
      )}
      
      <footer className="citation-footer">
        {/* Out-links and identifiers (PMID/DOI) can be rendered here */}
        {citation.pmid && (
          <a 
            href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="pubmed-link"
          >
            View on PubMed
          </a>
        )}
      </footer>
    </article>
  );
}