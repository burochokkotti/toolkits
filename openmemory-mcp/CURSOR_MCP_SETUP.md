# 🎯 Cursor MCP Integration Setup

How to configure your Universal Memory as an MCP server in Cursor IDE

## 🚀 Quick Setup for Cursor

### Step 1: Install MCP Dependencies
```bash
cd /Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp
npm install
```

### Step 2: Create Cursor MCP Configuration

Create or edit your Cursor MCP configuration file. The location depends on your Cursor setup:

**Option A: Global Cursor Config** (most common)
Create/edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "universal-memory": {
      "command": "node",
      "args": ["/Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp/simple_mcp_server.js"],
      "env": {
        "MODE": "mcp",
        "PYTHON_PATH": "python3"
      }
    }
  }
}
```

**Option B: Project-Specific Config**
Create `mcp.json` in your project root:

```json
{
  "mcpServers": {
    "universal-memory": {
      "command": "node", 
      "args": ["/Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp/simple_mcp_server.js"]
    }
  }
}
```

**Option C: Using npx (if you publish later)**
```json
{
  "mcpServers": {
    "universal-memory": {
      "command": "npx",
      "args": ["-y", "universal-memory-mcp"]
    }
  }
}
```

### Step 3: Test the MCP Server
```bash
# Test that the server starts correctly
node simple_mcp_server.js --test

# Or install and test via npm
npm start
```

### Step 4: Restart Cursor
After adding the MCP configuration, restart Cursor for the changes to take effect.

## 🛠️ MCP Tools Available in Cursor

Once configured, these tools will be available in Cursor:

### **add_memory**
Store important information, decisions, or context
```
Input: content (required), tags (optional array)
Example: "We decided to use PostgreSQL for the main database"
```

### **search_memory** 
Search for relevant memories based on a query
```
Input: query (required), limit (optional, default 10)
Example: Query "authentication" finds JWT, OAuth decisions
```

### **get_context**
Get contextual information about a specific topic
```
Input: topic (required), limit (optional, default 5)
Example: Topic "database setup" returns relevant DB memories
```

### **list_memories**
List all stored memories with optional limit
```
Input: limit (optional, default 20)
Shows overview of all stored knowledge
```

### **clear_memories**
Clear all stored memories (use with caution)
```
No input required
Permanently deletes all stored knowledge
```

## 🎯 Usage in Cursor

### **Automatic Tool Detection**
Once configured, Cursor will automatically detect when to use memory tools:

1. **Starting a task**: Cursor may automatically call `get_context` or `search_memory`
2. **Making decisions**: You can ask Cursor to store decisions with `add_memory`
3. **Needing context**: Cursor can retrieve relevant past information

### **Manual Tool Usage**
You can explicitly request memory operations:

- **"Remember that we're using Redis for caching"**
  → Cursor calls `add_memory` tool

- **"What did we decide about authentication?"**
  → Cursor calls `search_memory` with "authentication"

- **"Get context for database setup"**
  → Cursor calls `get_context` with "database setup"

### **Example Cursor Conversation**
```
You: "I need to implement user authentication. What approach did we decide on?"

Cursor: [Uses search_memory tool with "authentication"]
"Based on your memories, you decided to use JWT tokens with 7-day expiry and refresh mechanism. You're also using bcrypt for password hashing."

You: "Great! I'll implement OAuth2 as well for social login."

Cursor: [Uses add_memory tool]
"I've stored this decision: 'Adding OAuth2 social login alongside JWT authentication'"
```

## 🔧 Configuration Locations

### **Find Your Cursor Config Directory**

**Method 1: Check common locations**
```bash
# Common Cursor config locations:
ls ~/.cursor/
ls ~/.config/cursor/
ls ~/Library/Application\ Support/Cursor/
```

**Method 2: Check Cursor Settings**
1. Open Cursor
2. Go to Settings (Cmd/Ctrl + ,)
3. Search for "MCP" or "Model Context Protocol"
4. Look for configuration file path

**Method 3: Create in project directory**
```bash
# Create mcp.json in your current project
cat > mcp.json << 'EOF'
{
  "mcpServers": {
    "universal-memory": {
      "command": "node",
      "args": ["/Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp/simple_mcp_server.js"]
    }
  }
}
EOF
```

## 🚀 Alternative: Using with Claude Code (This CLI)

Since you're using Claude Code CLI, I can use your memory system directly:

```python
# I can run this right now
from simple_memory import memory, remember, recall

# Store memories as we work
remember("Current session: Setting up Universal Memory MCP integration")

# Get context 
context = recall("memory system setup")
```

## 🔍 Troubleshooting

**MCP Server Not Starting**
```bash
# Check Node.js version
node --version  # Should be 18+

# Install dependencies
npm install

# Test manually
node simple_mcp_server.js
```

**Cursor Not Detecting MCP**
1. Check `mcp.json` is in the right location
2. Restart Cursor completely
3. Check Cursor version supports MCP
4. Try project-specific `mcp.json` first

**Path Issues**
Use absolute paths in the configuration:
```json
"args": ["/full/absolute/path/to/simple_mcp_server.js"]
```

Your Universal Memory is now ready to work as a proper MCP server in Cursor! 🎉