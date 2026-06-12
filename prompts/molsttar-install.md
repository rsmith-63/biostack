# Headless Mol* Viewer in React 19 with AlphaFold Fallback

This guide provides a complete implementation of a headless Mol* viewer using React 19. It includes a custom data-fetching function that first attempts to load a structure from the PDB. If it fails to find a match (acting as the fallback for a missing BLAST/sequence match), it automatically queries the AlphaFold Protein Structure Database using a UniProt ID.

## 1. Installation

First, install the required Mol* package. Since you are building a headless viewer, you only need the core library.

```bash
npm install molstar