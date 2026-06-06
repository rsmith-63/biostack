# MolstarViewer Feature Integration

This guide provides the code required to add the backend route in Koa, the conditional launch button, and the updated `MolstarViewer.jsx` component.

## 1. Koa Backend Route

Assuming you are using `koa-router`, this route will handle any API requests for structural data based on the PubMed ID.

```javascript
// src/server/routes/api.js
import Router from '@koa/router';

const router = new Router({ prefix: '/api' });

// Route to fetch data based on PubMed ID
router.get('/structure/:pubmedId', async (ctx) => {
  const { pubmedId } = ctx.params;
  
  try {
    // Replace with your actual data fetching logic (e.g., querying a database or external API)
    const structureData = await fetchStructureDataByPMID(pubmedId);
    
    if (!structureData) {
      ctx.status = 404;
      ctx.body = { error: 'No data found for this PubMed ID' };
      return;
    }

    ctx.status = 200;
    ctx.body = { data: structureData };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: 'Internal server error while fetching structure data' };
  }
});

export default router;