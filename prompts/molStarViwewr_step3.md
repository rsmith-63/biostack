# Step 3: MolstarViewer Component

This component handles the dedicated viewer tab. It extracts the `pubmedId` from the URL, queries your Koa backend for the structural data, and includes the arrow icon to return the user to their search results. Since the viewer was launched in a new tab, the "return" action simply closes the current tab.

```jsx
// src/client/components/MolstarViewer.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; 

const MolstarViewer = () => {
  const { pubmedId } = useParams();
  const [viewerData, setViewerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query the Koa backend using the PubMed ID
    const fetchViewerData = async () => {
      try {
        const response = await fetch(`/api/structure/${pubmedId}`);
        if (response.ok) {
          const result = await response.json();
          setViewerData(result.data);
        } else {
          console.error("Failed to fetch data for MolstarViewer");
        }
      } catch (error) {
        console.error("Error fetching structural data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (pubmedId) {
      fetchViewerData();
    }
  }, [pubmedId]);

  const handleReturn = () => {
    // Since this view was launched in a new tab, closing it reveals the search results tab underneath
    window.close();
  };

  return (
    <div className="molstar-viewer-layout">
      <header className="viewer-header">
        {/* Arrow Icon with Tooltip */}
        <button 
          onClick={handleReturn} 
          title="return to search results"
          className="return-arrow-btn"
          aria-label="Return to search results"
          style={{ cursor: 'pointer', background: 'none', border: 'none', padding: '8px' }}
        >
          <svg 
            xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1>Structure Viewer (PMID: {pubmedId})</h1>
      </header>

      <main className="viewer-canvas">
        {loading ? (
          <p>Loading structure data...</p>
        ) : viewerData ? (
          <div id="molstar-wrapper">
            {/* Initialize your Molstar instance here using viewerData */}
            <p>Molstar rendering data for {pubmedId} goes here.</p>
          </div>
        ) : (
          <p>No structural data available for this abstract.</p>
        )}
      </main>
    </div>
  );
};

export default MolstarViewer;