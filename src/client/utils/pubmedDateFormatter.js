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
