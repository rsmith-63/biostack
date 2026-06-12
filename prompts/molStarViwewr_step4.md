# Step 4: Frontend Routing Update

To ensure the new tab successfully loads the 3D viewer when `window.open('/viewer/:pubmedId', '_blank')` is called, you must define this route in your frontend application's main routing file.

```jsx
// src/client/App.jsx (or your main routing file)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MolstarViewer from './components/MolstarViewer';
// ... import your other components (like your search results/AbstractView)

function App() {
  return (
    <Router>
      <Routes>
        {/* Your existing routes go here */}
        {/* <Route path="/search" element={<SearchResults />} /> */}
        
        {/* New route specifically for the MolstarViewer */}
        <Route path="/viewer/:pubmedId" element={<MolstarViewer />} />
      </Routes>
    </Router>
  );
}

export default App;