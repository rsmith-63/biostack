import React, { useEffect, useRef, useState } from 'react';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { resolveStructureUrl } from '../utils/structureResolver';
import './MolstarViewer.css';

/**
 * Headless Mol* Viewer
 * Custom UI built with pure CSS logic, targeting React 19.
 * Implements AlphaFold with SWISS-MODEL fallback logic.
 */
export default function MolstarViewer() {
  const containerRef = useRef(null);
  const pluginRef = useRef(null);
  const [searchId, setSearchId] = useState('O88844'); // Example UniProt ID
  const [status, setStatus] = useState('Ready');
  const [loading, setLoading] = useState(false);

  // 1. Initialize Mol* Headless Instance
  useEffect(() => {
    async function initPlugin() {
      if (!containerRef.current) return;

      try {
        const plugin = new PluginContext(DefaultPluginSpec());
        await plugin.init();

        // Bind the WebGL canvas to our custom div
        if (!plugin.canvas3dInitialized) {
          await plugin.initViewer(containerRef.current);
        }

        // Modern CSS handling: Manual background sync for 3D canvas
        // Check if dark mode is active (assuming useDarkMode hook or standard media query)
        const isDark = document.body.classList.contains('dark-theme') || 
                       window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        plugin.canvas3d?.setProps({
          renderer: { 
            backgroundColor: isDark 
              ? { r: 0.05, g: 0.05, b: 0.05 } 
              : { r: 1, g: 1, b: 1 } 
          }
        });

        pluginRef.current = plugin;
      } catch (err) {
        console.error('Failed to initialize Mol* plugin:', err);
        setStatus('Error: Failed to initialize viewer');
      }
    }

    initPlugin();

    return () => {
      if (pluginRef.current) {
        pluginRef.current.dispose();
      }
    };
  }, []);

  // 2. Load Logic: AlphaFold -> SWISS-MODEL Fallback
  const loadStructure = async (accession) => {
    const plugin = pluginRef.current;
    if (!plugin) return;

    setLoading(true);
    setStatus(`Resolving structure for "${accession}"...`);
    
    try {
      // Clear previous configurations from Mol* canvas
      await plugin.clear();

      const targetStructure = await resolveStructureUrl(accession);

      if (!targetStructure) {
        setStatus(`Error: Could not retrieve any 3D structures for Accession: ${accession}`);
        return;
      }

      setStatus(`Loading ${targetStructure.source} structure...`);

      // Download the coordinate payload resolved by the pipeline
      const data = await plugin.builders.data.download({ 
        url: targetStructure.url, 
        isBinary: false 
      });
      
      // Parse the structural trajectory using native mmcif specs
      const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif');
      await plugin.builders.structure.hierarchy.applyPreset(trajectory, 'default');
      
      setStatus(`Success: Loaded ${targetStructure.source} [${accession}]`);
      console.log(`Mol* successfully rendered structure sourced from: ${targetStructure.source}`);
    } catch (error) {
      console.error('Error loading structure:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
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
            placeholder="UniProt Accession (e.g., O88844)"
            aria-label="UniProt Accession"
          />
          <button 
            onClick={() => loadStructure(searchId)} 
            disabled={loading}
            className="fetch-btn"
          >
            {loading ? 'Fetching...' : 'Fetch Structure'}
          </button>
        </div>
        <p className={`status-text ${status.startsWith('Error') ? 'error' : ''}`}>{status}</p>
      </div>

      {/* Pure 3D Canvas Container */}
      <div ref={containerRef} className="headless-canvas" />
    </section>
  );
}
