# 📅 Specification: PubMed Date Range Picker

## 1. Overview
This specification outlines the integration of a Date Picker component to filter PubMed search results by Publication Date (`[pdat]`). 

The control will be housed within `MeshSuggester.jsx` (or triggered alongside it) and will prompt the user if they wish to apply a date filter. Upon submission, the selected dates will be formatted into an NCBI-compliant range string and appended to the active search query.

---

## 2. UI/UX Requirements
**Location:** Inside `MeshSuggester.jsx` (or the parent search control panel).

1.  **Opt-In Toggle:** The component must first ask the user: *"Do you want to add a date filter?"* via a checkbox or toggle button.
2.  **Input Fields:** If toggled "Yes", display two inputs:
    * Start Date
    * End Date
3.  **Accepted Formats:** The UI must accept dates in the following granularities:
    * Year only: `YYYY`
    * Year and Month: `YYYY/MM`
    * Exact Date: `YYYY/MM/DD`

---

## 3. Formatting Specifications (NCBI Standard)

When the user executes a search, the Date Picker state must be converted into a specific string appended to the base query using the `AND` boolean operator and the `[pdat]` (Publication Date) tag.

**The Range Operator (`:`):**
To be explicit about the start and end periods, the string must use the colon operator to define the range.

* **Format Template:** `{Base Query} AND {StartDate}:{EndDate}[pdat]`
* **Example 1 (Exact Dates):** `"rhabdomyosarcoma AND 2020/01/01:2020/12/31[pdat]"`
* **Example 2 (Year Only):** `"rhabdomyosarcoma AND 2020:2023[pdat]"`
* **Example 3 (Year/Month):** `"rhabdomyosarcoma AND 2020/01:2023/06[pdat]"`

---

## 4. Implementation Steps (React)

### Step 1: Create the Date Formatting Utility
Create a helper function to reliably generate the PubMed date string based on the user's input.

```javascript
// utils/pubmedDateFormatter.js

/**
 * Appends a PubMed date range to an existing search query.
 * @param {string} baseQuery - The active search term (e.g., "rhabdomyosarcoma")
 * @param {string} startDate - Accepted formats: YYYY, YYYY/MM, YYYY/MM/DD
 * @param {string} endDate - Accepted formats: YYYY, YYYY/MM, YYYY/MM/DD
 * @returns {string} Formatted query string
 */
export const appendDateRange = (baseQuery, startDate, endDate) => {
  if (!startDate && !endDate) return baseQuery;
  
  // If only one date is provided, use it for both sides of the range
  const start = startDate || endDate;
  const end = endDate || startDate;

  return `${baseQuery} AND ${start}:${end}[pdat]`;
};