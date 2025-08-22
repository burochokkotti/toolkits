#!/bin/bash

# Start Universal Memory MCP Server with proper logging

echo "🧠 Starting Universal Memory MCP Server..."

# Check if already running
if pgrep -f "simple_mcp_server.js" > /dev/null; then
    echo "⚠️  MCP Server already running. Stopping existing process..."
    pkill -f "simple_mcp_server.js"
    sleep 2
fi

# Set environment variables
export MODE=mcp
export PYTHON_PATH=$(which python3)
export NODE_ENV=development

# Change to correct directory
cd "$(dirname "$0")"

echo "📍 Working directory: $(pwd)"
echo "🐍 Python path: $PYTHON_PATH"
echo "📁 Memory file: ~/.universal_memory/memories.json"

# Test Python integration first
echo "🧪 Testing Python integration..."
$PYTHON_PATH -c "
import sys
sys.path.append('$(pwd)')
from simple_memory import memory
print(f'✅ Memory system accessible: {len(memory.get_all())} memories')
" || {
    echo "❌ Python integration failed"
    exit 1
}

echo "🚀 Starting MCP server with logging..."

# Start server with output to both console and log file
mkdir -p logs
node simple_mcp_server.js 2>&1 | tee logs/mcp-server.log