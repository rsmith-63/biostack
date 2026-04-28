# 🎧 MCP Transport Listener Implementation

This document provides the implementation details for attaching a message listener to the MCP transport layer. This allows you to monitor the raw JSON-RPC requests and responses between the Node.js client and the NCBI MCP server.

## 1. Concept

The `@modelcontextprotocol/sdk` uses a transport layer (typically `stdio` for local binaries) to handle communication. By attaching a listener to `transport.onmessage` *before* the client connects, you can intercept every payload sent to or received from the server.

## 2. Implementation (`src/services/mcpClient.js`)

Update the file where you initialize your MCP client to include the transport listener logic.

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// 1. Configure the transport targeting your local executable
const transport = new StdioClientTransport({
  command: "ncbi-mcp-server", // Or the absolute path if not in your Zsh $PATH
  args: [] 
});

// 2. Attach the Listener
// This intercepts all incoming and outgoing JSON-RPC messages
transport.onmessage = (message) => {
  // Log outgoing tool execution requests
  if (message.method === "tools/call") {
    console.log(`\n[📡 MCP OUT] Request ID: ${message.id}`);
    console.log(`▶ Tool: ${message.params.name}`);
    console.log(`▶ Args:`, JSON.stringify(message.params.arguments, null, 2));
  }

  // Log incoming successful responses
  if (message.result) {
    console.log(`\n[📥 MCP IN] Response for ID: ${message.id}`);
    // Truncate long results (like GenBank files) to keep the console clean
    const summary = JSON.stringify(message.result).substring(0, 200);
    console.log(`◀ Result: ${summary}...`);
  }

  // Log incoming errors
  if (message.error) {
    console.error(`\n[🚨 MCP ERROR] Response for ID: ${message.id}`);
    console.error(`◀ Error Code: ${message.error.code}`);
    console.error(`◀ Message: ${message.error.message}`);
  }
};

// 3. Initialize the Client
const mcpClient = new Client(
  {
    name: "bio-research-koa-backend",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}
    },
  }
);

// 4. Connect the Client to the Transport
export const connectMcp = async () => {
  try {
    await mcpClient.connect(transport);
    console.log("[MCP] Successfully connected to NCBI Server with listener attached.");
  } catch (err) {
    console.error("[MCP] Failed to connect to transport:", err);
  }
};

export default mcpClient;