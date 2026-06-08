# React 19 Mol* Rendering Fix for Biostack

This document outlines the specific React 19 concurrent rendering fix and the accompanying CSS constraints required to ensure the Mol* viewer renders correctly within the dashboard.

## The Root Cause

In React 19, concurrent rendering optimizations can occasionally cause a DOM element to mount *just* before the browser calculates its final layout. If the Mol* WebGL canvas initializes when its parent `<div>` is temporarily calculated at `0px` by `0px`, the 3D context will lock to that size. This results in a silent failure: the plain-text `.cif` data parses successfully in memory, but the viewport remains entirely blank.

To fix this, we must explicitly force the layout to recalculate after the structure is loaded, and ensure the CSS strictly enforces the container's physical dimensions.

## 1. Component Update (`MolstarViewer.jsx`)

Update the `loadStructure` function to dynamically check for binary formats, reset the camera, and manually trigger a layout update to sync the WebGL context with the React 19 DOM state.

```javascript
  // 2. Load Logic: AlphaFold -> SWISS-MODEL Fallback
  const loadStructure = async (accession) => {
    const plugin = pluginRef.current;
    if (!plugin) return;

    setLoading(true);
    setStatus(`Resolving structure for "${accession}"...`);
    
    try {
      await plugin.clear();

      const targetStructure = await resolveStructureUrl(accession);

      if (!targetStructure) {
        setStatus(`Error: Could not retrieve any 3D structures for Accession: ${accession}`);
        return;
      }

      setStatus(`Loading ${targetStructure.source} structure...`);

      // Dynamically determine if the incoming payload is BinaryCIF (.bcif)
      const isBinary = targetStructure.url.includes('.bcif');
      const format = isBinary ? 'cif' : 'mmcif'; 

      const data = await plugin.builders.data.download({ 
        url: targetStructure.url, 
        isBinary: isBinary 
      });
      
      const trajectory = await plugin.builders.structure.parseTrajectory(data, format);
      await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
      
      // Force the camera to look at the newly built structure
      plugin.managers.camera.reset();
      
      // REACT 19 FIX: Force WebGL to recalculate the canvas size against the CSS dimensions
      plugin.layout.events.updated.next(); 
      
      setStatus(`Success: Loaded ${targetStructure.source} [${accession}]`);
    } catch (error) {
      console.error('Error loading structure:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };