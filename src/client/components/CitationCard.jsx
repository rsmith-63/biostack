import React from 'react';
import Tooltip from './Tooltip';
import AbstractView from './AbstractView';
import { getActiveLanguage } from '../utils/languageDetection';

export default function CitationCard({ article }) {
  const {
    pmid,
    title,
    authors,
    journal,
    pubDate,
    abstract
  } = article;

  const targetLanguage = getActiveLanguage();
  const pubmedUrl = pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '#';

  // Function to handle the local "Save" action
  const handleSave = () => {
    const formattedAuthors = Array.isArray(authors) ? authors.join(', ') : (authors || 'N/A');
    const fileContent = `
TITLE: ${title || 'Untitled'}
AUTHORS: ${formattedAuthors}
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
    <div className="citation-card" key={`card-${pmid || title}-${targetLanguage}`}>
      <h3>
        <Tooltip text="view full article at NIH">
          <a href={pubmedUrl} target="_blank" rel="noopener noreferrer">
            <span key={`title-${targetLanguage}`}>{title || 'Untitled Publication'}</span>
          </a>
        </Tooltip>
      </h3>
      
      <p className="authors">
        <strong className="notranslate">Authors:</strong> <span key={`authors-${targetLanguage}`}>{Array.isArray(authors) ? authors.join(', ') : (authors || 'N/A')}</span>
      </p>
      
      <p className="meta">
        <em key={`journal-${targetLanguage}`}>{journal || 'Unknown Journal'}</em> | <span key={`date-${targetLanguage}`}>{pubDate || 'Unknown Date'}</span> | <strong className="notranslate">PMID:</strong> <span className="notranslate">{pmid || 'N/A'}</span>
      </p>

      <div className="action-row">
        <button onClick={handleSave} className="btn-save notranslate">
          <span>💾 Save to Research Folder</span>
        </button>
        
        {abstract && (
          <details>
            <summary className="notranslate">View Abstract</summary>
            <div className="abstract-container">
              <AbstractView title={title} text={abstract} />
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
