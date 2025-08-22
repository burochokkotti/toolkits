# 🔧 Cursor MCP Troubleshooting Guide

## ❌ Current Issue: MCP Server Not Working in Cursor

Based on the error you reported, here's how to fix the Universal Memory MCP integration:

## 🚀 Quick Fix Steps

### Step 1: Kill and Restart the MCP Server
```bash
# Stop any existing MCP servers
pkill -f simple_mcp_server.js

# Start with the new improved version
cd /Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp
./start_mcp.sh
```

### Step 2: Update Your Cursor mcp.json Configuration

**Find your Cursor config location:**
```bash
# Check these locations:
ls ~/.cursor/
ls ~/.config/cursor/
ls ~/Library/Application\ Support/Cursor/
```

**Use this EXACT configuration** in your `mcp.json`:
```json
{
  "mcpServers": {
    "universal-memory": {
      "command": "node",
      "args": ["/Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp/simple_mcp_server.js"],
      "cwd": "/Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp",
      "env": {
        "MODE": "mcp",
        "PYTHON_PATH": "/Users/somnathchakraborty/Paytm/openmemory/bin/python3",
        "MEMORY_FILE": "/Users/somnathchakraborty/.universal_memory/memories.json"
      }
    }
  }
}
```

### Step 3: Restart Cursor Completely
1. Quit Cursor completely (Cmd+Q)
2. Wait 5 seconds
3. Restart Cursor

### Step 4: Test MCP Integration

Ask Cursor to run one of these commands:

**Test 1: Add Memory**
```
"Remember that we're testing the Universal Memory MCP integration"
```

**Test 2: Search Memory**
```
"Search for any memories about testing"
```

**Test 3: List Memories**
```
"Show me all stored memories"
```

## 🔍 Diagnostic Commands

### Check if MCP Server is Running
```bash
ps aux | grep simple_mcp_server
```

### Test Python Integration Manually
```bash
cd /Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp
node test_mcp.js
```

### Check MCP Server Logs
```bash
tail -f logs/mcp-server.log
```

## ✅ What Should Work Now

### **Fixed Issues:**
1. **Better Error Handling**: Server now logs detailed errors
2. **Python Path Fixed**: Uses correct virtual environment Python
3. **Working Directory Set**: MCP server runs from correct directory
4. **Timeout Protection**: Commands won't hang forever
5. **Startup Testing**: Server tests Python integration before starting

### **Expected Behavior:**
- MCP server starts successfully with detailed logs
- Python integration test passes
- Cursor can call MCP tools without timeouts
- All memory operations work (add, search, context, list)

## 🚨 If Still Not Working

### Option 1: Use HTTP API Instead
```bash
# Start HTTP server for Cursor
node simple_mcp_server.js --http
```

Then use HTTP requests in Cursor:
```python
import requests

# Add memory
requests.post("http://localhost:3001/memory", json={
    "content": "Testing HTTP API integration",
    "tags": ["test", "api"]
})

# Search memories
response = requests.post("http://localhost:3001/search", json={
    "query": "test"
})
print(response.json())
```

### Option 2: Direct Python Integration
```python
# In any Cursor file
from simple_memory import memory, remember, recall

remember("Direct Python integration test")
context = recall("integration")
```

### Option 3: Check Cursor MCP Support
Some versions of Cursor may not support MCP fully. Check:
1. Cursor version (should be latest)
2. MCP feature availability in settings
3. Consider using Claude Desktop instead for MCP

## 📋 Test Checklist

When testing, verify:
- [ ] MCP server starts without errors
- [ ] Python integration test passes
- [ ] Cursor recognizes the MCP server
- [ ] Can add memories via Cursor
- [ ] Can search memories via Cursor
- [ ] Can list memories via Cursor
- [ ] Memories persist between sessions

## 🎯 Success Indicators

You'll know it's working when:
1. **MCP server logs show**: "MCP server started successfully"
2. **Python test shows**: "✅ Memory system accessible"
3. **Cursor shows**: MCP tools in available functions
4. **Memory operations**: Work without timeouts

Your Universal Memory should now work perfectly with Cursor! 🚀