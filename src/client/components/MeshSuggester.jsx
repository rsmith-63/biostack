import React, { useState } from 'react';
import './MeshSuggester.css';
import { appendDateRange } from '../utils/pubmedDateFormatter';

function MeshSuggester({ searchTerm, onSelectMesh, onDateFilterApply }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  // Date Filter State
  const [useDateFilter, setUseDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const handleApplyDateFilter = () => {
    if (!startDate && !endDate) {
      setError('Please provide at least one date for the filter.');
      return;
    }
    const updatedQuery = appendDateRange(searchTerm, startDate, endDate);
    if (onDateFilterApply) {
      onDateFilterApply(updatedQuery);
    }
  };

  return (
    <div className="mesh-suggester">
      <div className="control-panels" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* --- MeSH Suggestion Panel --- */}
        <div className="mesh-panel" style={{ flex: '1', minWidth: '250px' }}>
          <button 
            type="button"
            onClick={handleLookupMesh} 
            disabled={loading} 
            className="mesh-lookup-btn"
          >
            {loading ? '🔍 Looking up...' : '🪄 Suggest MeSH Terms'}
          </button>

          {/* --- Loading Spinner (Conditionally Rendered) --- */}
          {loading && (
            <div className="spinner-container">
              <div className="loader"></div>
              <p>Analyzing top results for MeSH terms...</p>
            </div>
          )}

          {/* --- Suggestions Display --- */}
          {suggestions.length > 0 && (
            <div className="suggestions-list">
              <h4>Suggested MeSH Terms:</h4>
              <div className="mesh-tags">
                {suggestions.map((term, index) => (
                  <span 
                    key={index} 
                    className="mesh-tag"
                    onClick={() => onSelectMesh(term)}
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- Date Filter Panel --- */}
        <div className="date-filter-panel" style={{ flex: '1', minWidth: '250px', paddingLeft: '20px' }}>
          <div className="date-filter-toggle" style={{ marginBottom: '10px' }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              <input 
                type="checkbox" 
                checked={useDateFilter} 
                onChange={(e) => setUseDateFilter(e.target.checked)} 
              />
              📅 Do you want to add a date filter?
            </label>
          </div>

          {useDateFilter && (
            <div className="date-filter-inputs" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="date-input-group">
                <input 
                  type="text" 
                  placeholder="Start Date (YYYY/MM/DD)" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="date-input"
                  title="Accepted formats: YYYY, YYYY/MM, YYYY/MM/DD"
                />
              </div>
              <div className="date-input-group">
                <input 
                  type="text" 
                  placeholder="End Date (YYYY/MM/DD)" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="date-input"
                  title="Accepted formats: YYYY, YYYY/MM, YYYY/MM/DD"
                />
              </div>
              <button 
                type="button" 
                onClick={handleApplyDateFilter} 
                className="date-apply-btn"
              >
                Apply Date Range
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Error Message --- */}
      {error && (
        <p className="error-message" style={{ color: 'red' }}>{error}</p>
      )}

      {/* --- Optional: No Suggestions Found message --- */}
      {!loading && !error && suggestions.length === 0 && searchTerm && !useDateFilter && (
         <p className="no-suggestions-msg">No MeSH terms suggested for this search.</p>
      )}
    </div>
  );
}

export default MeshSuggester;
