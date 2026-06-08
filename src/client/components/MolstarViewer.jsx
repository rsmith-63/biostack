import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PluginContext } from 'molstar/lib/mol-plugin/context';
import { DefaultPluginSpec } from 'molstar/lib/mol-plugin/spec';
import { resolveStructureUrl } from '../utils/structureResolver';
import './MolstarViewer.css';

/**
 * Headless Mol* Viewer
 * Custom UI built with pure CSS logic, targeting React 19.
 * Implements AlphaFold with SWISS-MODEL fallback logic.
 * Updated to handle PubMed ID routing.
 */
export default function MolstarViewer() {
  const { pubmedId, pmid } = useParams();
  const activeId = pubmedId || pmid; // Uses whichever parameter the router provides
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const pluginRef = useRef(null);
  const [pluginReady, setPluginReady] = useState(false);
  const [searchId, setSearchId] = useState(''); 
  const [status, setStatus] = useState('Ready');
  const [loading, setLoading] = useState(false);

  // 1. Initialize Mol* Headless Instance
  useEffect(() => {
    let isMounted = true;
    async function initPlugin() {
      if (!containerRef.current || pluginRef.current) return;

      try {
        const plugin = new PluginContext(DefaultPluginSpec());
        await plugin.init();

        if (isMounted) {
          // In Molstar 5.x, use mountAsync()
          if (!plugin.canvas3d) {
            await plugin.mountAsync(containerRef.current);
          }

          // Ensure the plugin doesn't try to take over the whole screen
          plugin.layout.setProps({ isExpanded: false });
          
          // Basic background sync
          const isDark = document.body.classList.contains('dark-theme');
          plugin.canvas3d?.setProps({
            renderer: { 
              backgroundColor: isDark 
                ? { r: 0.05, g: 0.05, b: 0.05 } 
                : { r: 1, g: 1, b: 1 } 
            }
          });

          plugin.canvas3d?.handleResize();
          pluginRef.current = plugin;
          setPluginReady(true);
        }
      } catch (err) {
        console.error('Molstar init error:', err);
        if (isMounted) setStatus('Error: Failed to initialize viewer');
      }
    }

    initPlugin();

    return () => {
      isMounted = false;
      if (pluginRef.current) {
        pluginRef.current.dispose();
        pluginRef.current = null;
      }
    };
  }, []);

  // 2. Load Logic: Updated to accept either a raw ID or a pre-resolved object
  const loadStructure = async (input) => {
    const plugin = pluginRef.current;
    if (!plugin) return;

    // Guard against empty input
    if (!input || (typeof input === 'string' && !input.trim())) {
      setStatus('Ready');
      return;
    }

    setLoading(true);
    
    try {
      await plugin.clear();

      let targetStructure;
      
      // Trust the input: Check if we already have the resolved URL and source
      if (typeof input === 'object' && input.url) {
        targetStructure = input;
        setStatus(`Loading pre-resolved ${targetStructure.source} structure...`);
      } else {
        const cleanInput = String(input).trim();
        setStatus(`Resolving structure for "${cleanInput}"...`);
        targetStructure = await resolveStructureUrl(cleanInput);
      }

      if (!targetStructure || !targetStructure.url) {
        setStatus(`Error: Could not retrieve any 3D structures.`);
        return;
      }

      // --- DYNAMIC FORMAT DETECTION ---
      const urlLower = targetStructure.url.toLowerCase();
      let format = 'mmcif'; // Default to mmcif
      let isBinary = false;

      if (urlLower.includes('.bcif')) {
        format = 'cif';
        isBinary = true;
      } else if (urlLower.includes('.pdb')) {
        format = 'pdb';
      } else if (urlLower.includes('.cif')) {
        format = 'mmcif';
      } else if (targetStructure.source === 'SWISS-MODEL') {
        format = targetStructure.format || 'pdb';
      }

      const data = await plugin.builders.data.download({ 
        url: targetStructure.url, 
        isBinary: isBinary 
      });
      
      const trajectory = await plugin.builders.structure.parseTrajectory(data, format);
      const model = await plugin.builders.structure.createModel(trajectory);
      const structure = await plugin.builders.structure.createStructure(model);

      // Apply a robust preset (cartoon/ball-and-stick)
      await plugin.builders.structure.representation.applyPreset(structure, 'auto');
      
      // React 19 / WebGL sync constraints
      setTimeout(() => {
        plugin.managers.camera.reset();
        plugin.canvas3d?.handleResize();
        plugin.canvas3d?.requestFrames();
        plugin.layout.events.updated.next(); 
      }, 150);
      
      setStatus(`Success: Loaded ${targetStructure.source}`);
    } catch (error) {
      console.error('Error loading structure:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Automatic Load using 'activeId'
  useEffect(() => {
    if (activeId && pluginReady) {
      const fetchFromPmid = async () => {
        // 1. Check for pre-passed data in sessionStorage
        const cachedData = sessionStorage.getItem(`structure_${activeId}`);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            console.log("Loading pre-passed structure data from session storage:", parsed);
            await loadStructure(parsed);
            // Clean up to keep session storage lean
            sessionStorage.removeItem(`structure_${activeId}`);
            return;
          } catch (e) {
            console.error("Failed to parse cached structure data:", e);
          }
        }

        // 2. Fallback to network fetch
        setStatus(`Fetching structural data for PMID: ${activeId}...`);
        try {
          const response = await fetch(`/api/structure/${activeId}`);
          if (response.ok) {
            const result = await response.json();
            const data = result.data;
            
            // Route the FULL resolved object (URL and source) directly to Mol*
            if (data && data.url && data.source) {
               loadStructure(data);
            } else if (data && data.uniprot_id) {
               // Fallback if the backend only returned the ID
               loadStructure(data.uniprot_id);
            } else if (Array.isArray(data) && data.length > 0) {
               loadStructure(data[0]); 
            } else {
              setStatus(`No structural data available for PMID: ${activeId}`);
            }
          } else {
            setStatus(`No structural data available for PMID: ${activeId}`);
          }
        } catch (error) {
          console.error('Error fetching structure for PMID:', error);
          setStatus('Error: Failed to fetch structure data');
        }
      };
      fetchFromPmid();
    }
  }, [activeId, pluginReady]);

  const handleReturn = () => {
    // If opened in a new tab, window.close() is preferred, 
    // but if used in same tab, navigate("/") is safer.
    if (window.opener) {
      window.close();
    } else {
      navigate('/');
    }
  };

  return (
    <section className="molstar-app-container">
      {/* Custom UI Header */}
      <div className="ui-overlay">
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleReturn}
            className="return-btn"
            title="Return to Search"
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
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
              disabled={loading || !searchId.trim()}
              className="fetch-btn"
            >
              {loading ? 'Fetching...' : 'Fetch Structure'}
            </button>
          </div>
        </div>
        <p className={`status-text ${status.startsWith('Error') ? 'error' : ''}`}>{status}</p>
      </div>

      {/* Pure 3D Canvas Container */}
      <div ref={containerRef} className="headless-canvas" />
    </section>
  );
}
