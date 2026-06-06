# Step 2: Conditional Launch Button Component

This component displays your abstract and includes the conditional logic for the "Launch 3D Viewer" button. The button will only render if `hasData` is true and a valid `pubmedId` is provided. When clicked, it opens the viewer route in a new tab.

```jsx
// src/client/components/AbstractView.jsx
import React from 'react';

const AbstractView = ({ abstractText, pubmedId, hasData }) => {
  const handleLaunchViewer = () => {
    // Opens the frontend route mapped to MolstarViewer in a new tab
    window.open(`/viewer/${pubmedId}`, '_blank');
  };

  return (
    <div className="abstract-container">
      <p>{abstractText}</p>
      
      {/* Conditionally render the button only if there is data */}
      {hasData && pubmedId && (
        <button 
          onClick={handleLaunchViewer}
          className="btn-launch-viewer"
        >
          Launch 3D Viewer
        </button>
      )}
    </div>
  );
};

export default AbstractView;