# Task: Refine PubmedSearch UI and Data Parsing

**Objective:** Update the `PubmedSearch.jsx` component to intelligently parse the JSON response from the Koa backend and render a clean list of results using the `CitationCard` component.

## File to Update
**Path:** `/Users/robsmith/biostack/src/client/PubmedSearch.jsx`

## Instructions for Agent
1. **Import Requirement:** Ensure `CitationCard` is imported from `./CitationCard`.
2. **Parsing Logic:** MCP tools return data inside a `content` array. We need to parse the `text` field within that content to get the actual PubMed JSON objects.
3. **State Management:** Ensure the `results` state is correctly populated with an array of article objects.
4. **UI Refinement:** Replace the `<pre>` tag with a mapped list of `CitationCard` components.

## Updated Component Code

```jsx
import React, { useState } from 'react';
import { z } from 'zod';
import CitationCard from './CitationCard';

const searchSchema = z.object({
  query: z.string().min(1, "Please enter a search term"),
});

export default function PubmedSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError(null);
    setResults([]);

    const validation = searchSchema.safeParse({ query: searchTerm });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/pubmed/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: validation.data.query,
          maxResults: 10 
        })
      });

      const json = await response.json();
      
      if (!response.ok) {
        throw new Error(json.message || 'Error fetching data');
      }

      /**
       * MCP Data Extraction Logic:
       * The Koa server returns { success: true, data: [ { type: 'text', text: '...' } ] }
       * We must parse the 'text' property which contains the stringified JSON from NCBI.
       */
      let articles = [];
      const mcpContent = json.data?.[0]?.text;

      if (mcpContent) {
        try {
          const parsedData = JSON.parse(mcpContent);
          // Handle both direct arrays or nested result objects
          articles = Array.isArray(parsedData) ? parsedData : (parsedData.results || []);
        } catch (parseError) {
          console.error("Failed to parse MCP text content:", parseError);
          setError("Received unexpected data format from the server.");
        }
      }

      setResults(articles);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#2d3748', marginBottom: '10px' }}>Bio-Research Search</h1>
        <p style={{ color: '#718096' }}>Query PubMed via NCBI MCP Server</p>
      </header>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="e.g., 'CRISPR gene editing' or 'COVID-19 vaccine'"
          style={{ 
            flexGrow: 1, 
            padding: '12px 16px', 
            borderRadius: '6px', 
            border: '1px solid #cbd5e0',
            fontSize: '1rem'
          }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '12px 24px', 
            borderRadius: '6px', 
            backgroundColor: '#3182ce', 
            color: 'white', 
            border: 'none',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div style={{ 
          padding: '16px', 
          backgroundColor: '#fff5f5', 
          color: '#c53030', 
          borderRadius: '6px', 
          marginBottom: '20px',
          border: '1px solid #feb2b2'
        }}>
          {error}
        </div>
      )}
      
      <div className="results-container">
        {results.length > 0 ? (
          <>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '20px', color: '#4a5568' }}>
              Results ({results.length})
            </h2>
            {results.map((article, index) => (
              <CitationCard key={article.pmid || index} article={article} />
            ))}
          </>
        ) : !loading && !error && searchTerm && (
          <p style={{ textAlign: 'center', color: '#a0aec0', marginTop: '40px' }}>
            No results found. Try a different search term.
          </p>
        )}
      </div>
    </div>
  );
}