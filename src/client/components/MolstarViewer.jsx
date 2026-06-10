import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { DefaultPluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { Plugin } from 'molstar/lib/mol-plugin-ui/plugin';
import { resolveStructureUrl } from '../utils/structureResolver';
import 'molstar/build/viewer/molstar.css';
import './MolstarViewer.css';

/**
 * Full Mol* Viewer with UI Panels
 * Integrated as a native React component for React 19 compatibility.
 */
export default function MolstarViewer() {
  const { pubmedId, pmid } = useParams();
  const activeId = pubmedId || pmid; 
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState(null);
  const [status, setStatus] = useState('Ready');
  const [loading, setLoading] = useState(false);
  const [searchId, setSearchId] = useState('');

  // 1. Initialize Mol* UI Context
  useEffect(() => {
    let isMounted = true;
    const initPlugin = async () => {
      try {
        const spec = {
          ...DefaultPluginUISpec(),
          layout: {
            initial: {
              isExpanded: false,
              showControls: true,
              regionState: {
                bottom: 'full',
                left: 'full',
                right: 'full',
                top: 'full'
              }
            }
          },
          components: {
            remoteState: 'none'
          }
        };

        const ctx = new PluginUIContext(spec);
        await ctx.init();

        if (isMounted) {
          setPlugin(ctx);
          
          // Sync background with theme
          const isDark = document.body.classList.contains('dark-theme');
          ctx.canvas3d?.setProps({
            renderer: { 
              backgroundColor: isDark 
                ? { r: 0.05, g: 0.05, b: 0.05 } 
                : { r: 1, g: 1, b: 1 } 
            }
          });
        } else {
          ctx.dispose();
        }
      } catch (err) {
        console.error('Molstar UI context error:', err);
        if (isMounted) setStatus('Error: Failed to initialize viewer');
      }
    };

    initPlugin();

    return () => {
      isMounted = false;
      if (plugin) {
        plugin.dispose();
      }
    };
  }, []);

  // 2. Load Logic
  const loadStructure = async (input) => {
    if (!plugin) return;

    if (!input || (typeof input === 'string' && !input.trim())) {
      setStatus('Ready');
      return;
    }

    setLoading(true);
    try {
      await plugin.clear();

      let targetStructure;
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

      const urlLower = targetStructure.url.toLowerCase();
      let format = 'mmcif';
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

      await plugin.builders.structure.representation.applyPreset(structure, 'auto');
      
      setTimeout(() => {
        plugin.managers.camera.reset();
        plugin.canvas3d?.handleResize();
        plugin.canvas3d?.requestFrames();
      }, 150);
      
      setStatus(`Success: Loaded ${targetStructure.source}`);
    } catch (error) {
      console.error('Error loading structure:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Automatic Load
  useEffect(() => {
    if (activeId && plugin) {
      const fetchFromPmid = async () => {
        const cachedData = sessionStorage.getItem(`structure_${activeId}`);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            await loadStructure(parsed);
            sessionStorage.removeItem(`structure_${activeId}`);
            return;
          } catch (e) {
            console.error("Failed to parse cached structure data:", e);
          }
        }

        setStatus(`Fetching structural data for PMID: ${activeId}...`);
        try {
          const response = await fetch(`/api/structure/${activeId}`);
          if (response.ok) {
            const result = await response.json();
            const data = result.data;
            if (data && data.url) {
               loadStructure(data);
            } else if (data && data.uniprot_id) {
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
  }, [activeId, plugin]);

  const handleReturn = () => {
    if (window.opener) {
      window.close();
    } else {
      navigate('/');
    }
  };

  return (
    <section className="molstar-app-container">
      {/* Portal the UI controls up to the global header */}
      {createPortal(
        <div className="ui-overlay header-integrated">
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
        </div>,
        document.getElementById('header-portal') || document.body
      )}

      <div className="molstar-wrapper" style={{ flexGrow: 1, position: 'relative', width: '100%', height: '100%' }}>
        {plugin && <Plugin plugin={plugin} />}
      </div>
    </section>
  );
}
