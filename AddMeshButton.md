# Adding a "Suggest MeSH Terms" Button and Spinner to your React UI

This guide outlines how to incorporate a button for suggesting MeSH terms based on the current search query, complete with a loading spinner to provide feedback during the potentially time-consuming fetch operation. We'll use React functional components and hooks.

### Implementation Steps

1.  <strong>State Management:</strong> Set up state variables to track the loading status, MeSH suggestions, and any potential errors.
2.  <strong>UI Components:</strong> Create the button, a conditional rendering block for the spinner, and sections to display suggestions or errors.
3.  <strong>Fetch Logic:</strong> Implement an asynchronous function triggered by the button click to fetch MeSH suggestions from your backend API.

### Example React Component (`MeshSuggester.js`)

Here's a sample component demonstrating the complete implementation:

```jsx
import React, { useState } from 'react';
import './MeshSuggester.css'; // Optional: for basic spinner styling

function MeshSuggester({ searchTerm, onSelectMesh }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  const handleLookupMesh = async () => {
    // 1. Reset state and start loading
    setLoading(true);
    setSuggestions([]);
    setError(null);

    // Ensure there's a search term before fetching
    if (!searchTerm || searchTerm.trim() === '') {
      setError('Please enter a search term first.');
      setLoading(false);
      return;
    }

    try {
      // 2. Fetch suggestions from your backend endpoint
      // Adjust the URL to your specific API route
      const response = await fetch('/api/pubmed/mesh-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: searchTerm.trim() }),
      });

      // 3. Handle response status
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 4. Parse the response data
      const data = await response.json();

      // 5. Update suggestions state
      // Assuming your API returns suggestions in an array under the 'suggestions' property, adjust as needed
      setSuggestions(data.suggestions || []);

    } catch (err) {
      // 6. Handle fetch errors
      console.error('Error fetching MeSH suggestions:', err);
      setError('Failed to fetch suggestions. Please try again later.');
    } finally {
      // 7. Ensure loading state is reset regardless of success or failure
      setLoading(false);
    }
  };

  return (
    <div className="mesh-suggester">
      {/* --- Button --- */}
      <button 
        onClick={handleLookupMesh} 
        disabled={loading} // Disable while loading to prevent multiple clicks
        className="mesh-lookup-btn"
      >
        Suggest MeSH Terms
      </button>

      {/* --- Loading Spinner (Conditionally Rendered) --- */}
      {loading && (
        <div className="spinner-container">
          {/* Simple CSS-based spinner or use a library/image */}
          <div className="loader"></div>
          <p>Looking up terms...</p>
        </div>
      )}

      {/* --- Suggestions Display --- */}
      {suggestions.length > 0 && (
        <div className="suggestions-list">
          <h4>Suggested MeSH Terms:</h4>
          <ul>
            {suggestions.map((term, index) => (
              <li key={index} onClick={() => onSelectMesh(term)} style={{ cursor: 'pointer' }}>
                {term}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* --- Error Message --- */}
      {error && (
        <p className="error-message" style={{ color: 'red' }}>{error}</p>
      )}

      {/* --- Optional: No Suggestions Found message --- */}
      {!loading && !error && suggestions.length === 0 && searchTerm && (
         <p>No MeSH terms suggested for this search.</p>
      )}
    </div>
  );
}

export default MeshSuggester;