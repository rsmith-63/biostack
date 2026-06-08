# Dynamic Format Parsing for MolStar

This feature enables the Mol* viewer to dynamically identify and parse various structural file formats based on their file extensions and data types. It also adds support for direct PDB ID resolution via RCSB.

## Enhancements

### 1. PDB ID Detection (`structureResolver.js`)
The `resolveStructureUrl` utility now detects 4-character alphanumeric strings as PDB IDs and automatically routes them to the RCSB PDB download service using the mmCIF format.

### 2. Multi-Format Support (`MolstarViewer.jsx`)
The viewer's loading logic has been upgraded to inspect the resolved URL and determine the appropriate Mol* parser:
- **mmCIF**: `.cif`, `.mmcif`
- **BinaryCIF**: `.bcif` (automatically sets `isBinary: true`)
- **PDB**: `.pdb`, `.ent`
- **SDF**: `.sdf`
- **MOL/MOL2**: `.mol`, `.mol2`

## Implementation Details

### URL-Based Format Detection
```javascript
const url = targetStructure.url.toLowerCase();
let format = 'mmcif'; 
let isBinary = false;

if (url.endsWith('.bcif')) {
  format = 'mmcif';
  isBinary = true;
} else if (url.endsWith('.cif') || url.endsWith('.mmcif')) {
  format = 'mmcif';
} else if (url.endsWith('.pdb') || url.endsWith('.ent')) {
  format = 'pdb';
} else if (url.endsWith('.sdf')) {
  format = 'sdf';
} else if (url.endsWith('.mol')) {
  format = 'mol';
} else if (url.endsWith('.mol2')) {
  format = 'mol2';
}
```

### Data Download and Parsing
```javascript
const data = await plugin.builders.data.download({ 
  url: targetStructure.url, 
  isBinary: isBinary 
});

const trajectory = await plugin.builders.structure.parseTrajectory(data, format);
```
