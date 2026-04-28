# generate Pagination control

This document outlines the implementation specifications for the pagination control within the Bio-Research dashboard. Pagination allows users to navigate through split content (e.g., search results, product listings) using buttons for next, previous, specific page numbers, or ellipses for skipped pages. 

**Best Practices Included:**
* Indicating the active page visually.
* Using semantic `<nav>` tags for ARIA accessibility.
* Disabling "previous/next" buttons when inappropriate (e.g., on the first or last page).

---

## 📍 Layout Placement
The pagination control components must be inserted at the **bottom of the `citation-grid`** layout to ensure users can navigate after reviewing the current batch of articles.

---

## ⚙️ 1. Define the Page Size
Use the `maxResults` argument in the `pubmed_search_articles` tool to specify how many records to retrieve for the current "page".

* **Default:** 20 articles.
* **Maximum:** 1,000 articles per request.
* **API Mapping:** This corresponds to the `retmax` parameter in the underlying NCBI ESearch utility.

## 🧮 2. Set the Starting Position (Offset)
The tool summary explicitly states that it supports pagination via offset for paging through large result sets. 

While not explicitly listed in the tool's detailed argument snippet, this "offset" functions like the `retstart` parameter in E-utilities. It defines the sequential index of the first record to be retrieved, where `0` is the very first record.

## 📊 3. Determine Total Results and Page Count
The search tool returns a JSON object that includes result counts. You must use the `count` (or `total`) field—representing the total number of records matching the query—to calculate the total number of pages needed for your UI control.

* **Formula:** `Math.ceil(totalCount / maxResults)`
* **Example Calculation:** If the total count is 255,147 and your `maxResults` is 20, you would have approximately **12,758 pages**.

## 🧬 4. Batch Retrieval using History
If you need to paginate through a very large set of results to retrieve detailed metadata (beyond the brief summaries optionally provided by the search tool), you should leverage the Entrez History server.

1.  **Execute the search:** Calling `pubmed_search_articles` returns the search parameters and E-utility URLs (which contain the `WebEnv` and `queryKey`).
2.  **Fetch in batches:** Pass the `WebEnv` and `queryKey` to the `pubmed_fetch_contents` tool.
3.  **Apply Pagination:** This fetch tool explicitly supports `retstart` (index of the first record) and `retmax` (number of records) to download specific subsets of the search history.

---

## 🛑 Usage Limitations
When implementing your pagination logic, keep in mind that the underlying NCBI ESearch utility is limited to retrieving the **first 10,000 records** matching a query for PubMed and PubMed Central. 

To access records beyond this limit, you must:
1.  Use Entrez Direct (EDirect), which includes automated logic to batch PubMed search results.
2.  Segment your query (e.g., by date ranges) to keep the total result sets under 10,000.

---

## 💻 Implementation Steps (React integration)

To implement this in your frontend, structure your DOM as follows:

```jsx
<div className="research-dashboard">
  {/* Citation Grid Component */}
  <div className="citation-grid">
    {articles.map(article => (
      <CitationCard key={article.pmid} data={article} />
    ))}
  </div>

  {/* Pagination Control - Placed immediately below the grid */}
  <nav className="pagination-control" aria-label="Pagination Navigation">
    <button disabled={currentPage === 1} className="prev-button">
      Previous
    </button>
    
    <span className="page-indicator">
      Page {currentPage} of {Math.ceil(totalCount / 20)}
    </span>
    
    <button disabled={currentPage === totalPages} className="next-button">
      Next
    </button>
  </nav>
</div>