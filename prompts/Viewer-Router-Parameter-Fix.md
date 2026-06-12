# Biostack Mol* Viewer: Router Parameter Fix

## The Problem
`AbstractView.jsx` handles the URL parameter as `pmid`, but `MolstarViewer.jsx` was explicitly looking for `pubmedId` via `useParams()`. Because of this mismatch, the `useEffect` responsible for automatically fetching the Koa backend data was silently failing to execute. Consequently, interacting with the manual "Fetch Structure" button bypassed the backend entirely and triggered the default AlphaFold fallback script.

## The Solution
Update the `useParams` hook to capture both potential parameter names, ensuring the component dynamically adapts to the router. 

### Component Update (`src/client/components/MolstarViewer.jsx`)

Update the top of your component and the `useEffect` block to match the code below:

```javascript
  // 1. Update useParams to catch 'pmid'
  const { pubmedId, pmid } = useParams();
  const activeId = pubmedId || pmid; // Uses whichever parameter the router provides
  const navigate = useNavigate();
  // ... containerRef, pluginRef, states ...

  // ... (keep initPlugin and loadStructure the same as the previous fix) ...

  // 3. Automatic Load using 'activeId'
  useEffect(() => {
    if (activeId && pluginRef.current) {
      const fetchFromPmid = async () => {
        setStatus(`Fetching structural data for PMID: ${activeId}...`);
        try {
          const response = await fetch(`/api/structure/${activeId}`);
          if (response.ok) {
            const result = await response.json();
            const data = result.data;
            
            // Debugging: Verify the backend data reached the component
            console.log("Backend payload received in MolstarViewer:", data);
            
            const structData = data?.structure;
            
            if (structData && structData.url && structData.source) {
               console.log("Routing SWISS-MODEL data directly to Mol*:", structData);
               loadStructure(structData);
            } else if (structData && structData.uniprot_id) {
               loadStructure(structData.uniprot_id);
            } else {
              setStatus(`No structural data available for PMID: ${activeId}`);
            }
          } else {
            setStatus(`Error: Backend returned status ${response.status}`);
          }
        } catch (error) {
          console.error('Error fetching structure for PMID:', error);
          setStatus('Error: Failed to fetch structure data');
        }
      };
      fetchFromPmid();
    }
  }, [activeId]);