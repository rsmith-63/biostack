import { spawn } from 'child_process';

// Initialize the NCBI server process
const mcpServer = spawn('npx', ['-y', '@iflow-mcp/pubmed-mcp-server'], {
  env: { 
    ...process.env, 
    NCBI_EMAIL: process.env.NCBI_EMAIL || 'robs00221@gmail.com' 
  }
});

console.log("Starting MCP server and requesting tool schemas...");

// Listen for the server's response
mcpServer.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    try {
      const parsed = JSON.parse(line);
      
      // Look for the response to our specific request (id: 1)
      if (parsed.id === 1 && parsed.result?.tools) {
        console.log('\n✅ MCP Server Tools Discovered:\n');
        
        parsed.result.tools.forEach(tool => {
          console.log(`Tool Name: \x1b[36m${tool.name}\x1b[0m`);
          console.log(`Description: ${tool.description}`);
          console.log('Expected Arguments:');
          console.log(JSON.stringify(tool.inputSchema.properties, null, 2));
          console.log('Required fields:', tool.inputSchema.required || 'None');
          console.log('-'.repeat(50));
        });
        
        // Clean up and exit
        mcpServer.kill();
        process.exit(0);
      }
    } catch (e) {
      // Ignore non-JSON logs (like standard initialization messages)
    }
  }
});

mcpServer.stderr.on('data', (data) => {
  // Only log actual errors, ignore standard npx warnings
  if (data.toString().toLowerCase().includes('error')) {
    console.error(`Log: ${data}`);
  }
});

// Send the JSON-RPC request to list the tools
const request = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {}
}) + '\n';

mcpServer.stdin.write(request);