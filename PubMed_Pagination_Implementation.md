# 📑 PubMed Pagination Implementation

This guide outlines the architecture and implementation for paginating PubMed search results in the client using the `pubmed_search_articles` and `pubmed_fetch_contents` MCP tools.

## 1. Architectural Overview

To efficiently paginate through potentially hundreds of thousands of biomedical records without overwhelming the client or the NCBI servers, we utilize **offset-based pagination** combined with the **Entrez History server**.

### The Flow
1. **Initial Search:** The client sends a query. The backend calls `pubmed_search_articles`.
2. **State Capture:** The backend returns the `count` (total results), `WebEnv`, and `queryKey`.
3. **Batch Fetching:** As the user clicks through pages, the client calculates the `offset` and requests specific batches using `pubmed_fetch_contents` via the backend, passing the stored `WebEnv` and `queryKey`.

---

## 2. Parameter Mapping

| Client Concept | NCBI / MCP Parameter | Description |
| :--- | :--- | :--- |
| **Page Size** | `maxResults` / `retmax` | Number of articles per page (Default: 10, Max: 1000). |
| **Starting Position**| `offset` / `retstart` | The sequential index of the first record (0-indexed). |
| **Total Results** | `count` | Total matching records returned by the initial search. |
| **History Tokens** | `WebEnv` & `queryKey` | Session identifiers for fetching subsequent batches. |

---

## 3. Client Implementation (React)

Below is the implementation of the citation list and the pagination control placed directly at the bottom.

### `CitationList.jsx`

```jsx
import { useState, useEffect } from 'react';

export default function CitationList({ initialQuery = "BRCA1" }) {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [maxResults] = useState(20); // Step 1: Define Page Size
  
  // History State (Step 4)
  const [webEnv, setWebEnv] = useState(null);
  const [queryKey, setQueryKey] = useState(null);
  
  // Data State
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Step 3: Determine Total Results and Page Count
  const totalPages = Math.ceil(totalCount / maxResults);

  // Initial Search
  useEffect(() => {
    const performInitialSearch = async () => {
      setIsLoading(true);
      try {
        // Calls your Koa backend which wraps 'pubmed_search_articles'
        const res = await fetch(`/api/pubmed/search?query=${initialQuery}`);
        const data = await res.json();
        
        setTotalCount(data.count);
        setWebEnv(data.webEnv);
        setQueryKey(data.queryKey);
        
        // Load first page immediately
        fetchPageContents(0, data.webEnv, data.queryKey);
      } catch (error) {
        console.error("Search failed", error);
      }
    };
    performInitialSearch();
  }, [initialQuery]);

  // Fetch specific page contents
  const fetchPageContents = async (offset, currentWebEnv, currentQueryKey) => {
    setIsLoading(true);
    try {
      // Calls your Koa backend which wraps 'pubmed_fetch_contents'
      // Step 2 & 4: Passing offset (retstart), retmax, and history tokens
      const res = await fetch(
        `/api/pubmed/fetch?webenv=${currentWebEnv}&querykey=${currentQueryKey}&retstart=${offset}&retmax=${maxResults}`
      );
      const data = await res.json();
      setArticles(data.articles);
    } catch (error) {
      console.error("Fetch failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    
    // Calculate the offset based on the requested page (0-indexed)
    const offset = (newPage - 1) * maxResults;
    fetchPageContents(offset, webEnv, queryKey);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-2xl font-bold">Search Results: {initialQuery}</h2>
        <span className="text-sm text-gray-500">{totalCount.toLocaleString()} found</span>
      </div>

      {/* Citation Card List */}
      <div className="space-y-4 min-h-[400px]">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Loading records...</div>
        ) : (
          articles.map((article, index) => (
            <div key={article.id || index} className="p-4 border rounded-lg shadow-sm bg-white">
              <h3 className="font-semibold text-lg text-blue-700">{article.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{article.authors?.join(', ')}</p>
              <p className="text-sm mt-2 text-gray-800 line-clamp-2">{article.abstract}</p>
            </div>
          ))
        )}
      </div>

      {/* Pagination Control (Placed at the bottom) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4 mt-6">
          <p className="text-sm text-gray-600">
            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages.toLocaleString()}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50 bg-blue-50 text-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}