# MCP Server Optimization: Migrating from Dynamic `npx` to Local Dependency

## Overview
Executing `npx -y @iflow-mcp/pubmed-mcp-server` at runtime forces Node to query the npm registry and download the package on every container boot. On Render, this introduces dynamic network latency, high memory overhead, and causes connection timeouts (`McpError -32001`).

By installing `@iflow-mcp/pubmed-mcp-server` as a local project dependency, the package is downloaded and compiled during Render's build phase (`npm install`), enabling instant startup at runtime.

---

## Step 1: Update `package.json`

Run the following command in your server/root project terminal to add the MCP server package to your `dependencies`:

```bash
npm install @iflow-mcp/pubmed-mcp-server