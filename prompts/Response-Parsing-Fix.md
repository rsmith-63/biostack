# Biostack Mol* Viewer: API Response Parsing Fix

## The Problem
The Koa backend was correctly routing the request to SWISS-MODEL and returning the resolved `.pdb` URL, but it nested this data inside a `structure` object in the JSON response. The React frontend's `useEffect` hook was looking for the `url` and `source` properties at the top level of the `data` object. Because they were undefined at that level, the frontend ignored the backend's data and attempted to manually resolve a non-existent AlphaFold URL.

## The Solution
Update the `fetchFromPmid` logic inside the `useEffect` hook to extract the nested `data.structure` object before passing it to the `loadStructure` function.

### Component Update (`src/client/components/MolstarViewer.jsx`)

Locate the `useEffect` block that handles the automatic load (around section 3 of your component) and replace it with the updated code below:

```javascript
  // 3. Automatic Load if pubmedId is provided in URL
  useEffect(() => {
    if (pubmedId && pluginRef.current) {
      const fetchFromPmid = async () => {
        setStatus(`Fetching structural data for PMID: ${pubmedId}...`);
        try {
          const response = await fetch(`/api/structure/${pubmedId}`);
          if (response.ok) {
            const result = await response.json();
            const data = result.data;
            
            // --- THE FIX: Extract the nested structure object ---
            const structData = data.structure;
            
            // Route the FULL resolved object (URL and source) directly to Mol*
            if (structData && structData.url && structData.source) {
               loadStructure(structData);
            } else if (structData && structData.uniprot_id) {
               // Fallback if the backend only returned the ID
               loadStructure(structData.uniprot_id);
            } else if (Array.isArray(data) && data.length > 0) {
               // Fallback for array-based responses
               loadStructure(data[0]); 
            } else {
              setStatus(`No structural data available for PMID: ${pubmedId}`);
            }
          } else {
            setStatus(`No structural data available for PMID: ${pubmedId}`);
          }
        } catch (error) {
          console.error('Error fetching structure for PMID:', error);
          setStatus('Error: Failed to fetch structure data');
        }
      };
      fetchFromPmid();
    }
  }, [pubmedId]); // Removed pluginRef.current to prevent StrictMode double-firing