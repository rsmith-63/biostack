# Task: Integrate NCBI PubMed MCP Server into React-Koa Scaffold

**Objective:** Update the current project to support the Model Context Protocol (MCP) using the `@iflow-mcp/pubmed-mcp-server`. This requires updating dependencies, configuring environment variables in the project root, and writing the client/server integration code using Zod for validation.

## Step 1: Update Dependencies
Execute the following commands to install the required packages. Ensure you run the server commands in the Koa directory and the client commands in the React directory.

```bash
# Server-side installations
npm install @modelcontextprotocol/sdk zod dotenv

# Client-side installations
npm install zod