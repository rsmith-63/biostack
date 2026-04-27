# Task: Implement Server-Side Bulk Saving

**Objective:** Add a Koa route to handle bulk file writing to the local `/research` directory and update the React frontend to trigger this operation.

## 1. Update Koa Server
**File:** `/Users/robsmith/biostack/server/src/api/pubmed.js`

**Action:** Add `fs` and `path` imports, and implement the `/api/pubmed/bulk-save` route.

```javascript
import fs from 'fs/promises';
import path from 'path';

// ... (existing imports and setup)

const RESEARCH_DIR = '/Users/robsmith/biostack/research';

router.post('/api/pubmed/bulk-save', async (ctx) => {
  try {
    const { articles } = ctx.request.body;

    if (!articles || !Array.isArray(articles)) {
      ctx.status = 400;
      ctx.body = { success: false, message: "No articles provided" };
      return;
    }

    // Ensure the research directory exists
    await fs.mkdir(RESEARCH_DIR, { recursive: true });

    const savePromises = articles.map(async (article) => {
      const { pmid, title, authors, journal, pubDate, abstract } = article;
      
      const fileName = `PMID_${pmid || 'unknown'}_${(title || 'article').substring(0, 30).replace(/[^a-z0-9]/gi, '_')}.txt`;
      const filePath = path.join(RESEARCH_DIR, fileName);

      const content = `
TITLE: ${title || 'Untitled'}
AUTHORS: ${authors?.join(', ') || 'N/A'}
JOURNAL: ${journal || 'N/A'}
DATE: ${pubDate || 'N/A'}
PMID: ${pmid || 'N/A'}

ABSTRACT:
${abstract || 'No abstract available.'}
      `.trim();

      return fs.writeFile(filePath, content, 'utf8');
    });

    await Promise.all(savePromises);

    ctx.body = { 
      success: true, 
      message: `Successfully saved ${articles.length} articles to ${RESEARCH_DIR}` 
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});