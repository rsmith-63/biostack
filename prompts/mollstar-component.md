# React 19 Headless Mol* Component with AlphaFold Fallback

To implement this, ensure you have the core library installed:
`npm install molstar`

### MolstarViewer.tsx

```tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';

/**
 * Headless Mol* Viewer
 * Custom UI built with pure CSS logic, targeting React 19.
 * Fallback logic: PDB Search -> AlphaFold Database.
 */
export default function MolstarViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pluginRef = useRef<PluginContext | null>(null);
  const [searchId, setSearchId] = useState('1cbs');
  const [status, setStatus] = useState('Ready');

  // 1. Initialize Mol* Headless Instance
  useEffect(() => {
    async function initPlugin() {
      if (!containerRef.current) return;

      const plugin = new PluginContext(DefaultPluginSpec());
      await plugin.init();

      // Bind the WebGL canvas to our custom div
      if (!plugin.canvas3dInitialized) {
        await plugin.initViewer(containerRef.current);
      }

      // Modern CSS handling: Manual background sync for 3D canvas
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      plugin.canvas3d?.setProps({
        renderer: { 
          backgroundColor: isDark 
            ? ({ r: 0.05, g: 0.05, b: 0.05 } as any) 
            : ({ r: 1, g: 1, b: 1 } as any) 
        }
      });

      pluginRef.current = plugin;
    }

    initPlugin();

    return () => {
      pluginRef.current?.dispose();
    };
  }, []);

  // 2. Load Logic: PDB -> AlphaFold Fallback
  const loadStructure = async (id: string) => {
    const plugin = pluginRef.current;
    if (!plugin) return;

    setStatus(`Searching PDB for "${id}"...`);
    plugin.clear(); 

    try {
      // Step A: Attempt RCSB PDB (Experimental Structures)
      const pdbUrl = `https://files.rcsb.org/download/${id.toLowerCase()}.cif`;
      const response = await fetch(pdbUrl, { method: 'HEAD' });

      if (!response.ok) throw new Error('Not in PDB');

      const data = await plugin.builders.data.download({ url: pdbUrl });
      const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif');
      await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
      setStatus(`Success: Loaded PDB [${id.toUpperCase()}]`);

    } catch (error) {
      // Step B: Fallback to AlphaFold DB (Predicted Structures)
      setStatus('PDB match not found. Attempting AlphaFold fallback...');
      
      try {
        const afUrl = `https://alphafold.ebi.ac.uk/files/AF-${id.toUpperCase()}-F1-model_v4.cif`;
        const afData = await plugin.builders.data.download({ url: afUrl });
        const trajectory = await plugin.builders.structure.parseTrajectory(afData, 'mmcif');
        await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
        setStatus(`Success: Loaded AlphaFold Model [${id.toUpperCase()}]`);
      } catch (afError) {
        setStatus(`Error: ID "${id}" not found in PDB or AlphaFold.`);
      }
    }
  };

  return (
    <section className="molstar-app-container">
      {/* Custom UI Header */}
      <div className="ui-overlay">
        <div className="search-bar">
          <input 
            type="text" 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="PDB ID or UniProt ID..."
          />
          <button onClick={() => loadStructure(searchId)}>Fetch Structure</button>
        </div>
        <p className="status-text">{status}</p>
      </div>

      {/* Pure 3D Canvas Container */}
      <div ref={containerRef} className="headless-canvas" />

      <style jsx>{`
        .molstar-app-container {
          position: relative;
          width: 100%;
          height: 600px;
          border-radius: 12px;
          overflow: hidden;
          background: var(--bg-color, #f0f0f0);
        }
        .headless-canvas {
          width: 100%;
          height: 100%;
        }
        .ui-overlay {
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 10;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 15px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .search-bar {
          display: flex;
          gap: 8px;
        }
        input {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid #555;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
        }
        button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        .status-text {
          font-size: 12px;
          margin-top: 8px;
          color: #ddd;
        }
        @media (prefers-color-scheme: dark) {
          .ui-overlay { background: rgba(0, 0, 0, 0.4); }
        }
      `}</style>
    </section>
  );
}