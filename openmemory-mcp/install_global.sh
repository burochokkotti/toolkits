#!/bin/bash

# Install Universal Memory MCP Server Globally
# This allows you to use it with: npx universal-memory-mcp

echo "🧠 Installing Universal Memory MCP Server globally..."

# Install dependencies locally first
echo "📦 Installing dependencies..."
npm install

# Create a global symlink (for development)
echo "🔗 Creating global npm link..."
npm link

echo "✅ Global installation complete!"
echo ""
echo "Now you can use in Cursor mcp.json:"
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "universal-memory": {'
echo '      "command": "npx",'
echo '      "args": ["-y", "universal-memory-mcp"]'
echo '    }'
echo '  }'
echo '}'
echo ""
echo "Or use the direct path method from CURSOR_MCP_SETUP.md"