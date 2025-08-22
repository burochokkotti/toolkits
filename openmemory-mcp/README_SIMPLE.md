# 🧠 Universal Memory - Simple Setup

**Cross-repo, cross-agent memory in 2 minutes!**

## Quick Start

```bash
# 1. Install (run once)
./setup.sh

# 2. Use anywhere
python -c "
from simple_memory import memory
memory.add('We decided to use React for frontend')
print(memory.search('frontend'))
"
```

## Usage in Any Project

### Basic Usage
```python
from simple_memory import memory

# Store important context
memory.add("We're using PostgreSQL as the main database")
memory.add("Authentication uses JWT with 7-day expiry")
memory.add("Frontend is React with TypeScript")

# Retrieve context
results = memory.search("database")
context = memory.get_context("authentication setup")
```

### Quick Functions
```python
from simple_memory import remember, recall

# Store
remember("API uses REST with versioning", tags=["api", "architecture"])

# Retrieve
context = recall("API design")  # Returns formatted context
```

## Works Across All Agents

### ✅ Cursor
```python
# In any file Cursor is editing:
from simple_memory import memory
context = memory.get_context("current task")
# Cursor can now access stored context!
```

### ✅ Claude Code (via MCP)
The included MCP server connects to the same memory store. Claude can:
- Automatically retrieve relevant context
- Store important decisions
- Access cross-project knowledge

### ✅ Any Python Script
```python
import sys
sys.path.append('/path/to/openmemory-mcp')
from simple_memory import memory
# Works everywhere!
```

## Features

- **🔄 Cross-Repository**: Access same memories from any project
- **🤖 Multi-Agent**: Works with Cursor, Claude, custom scripts  
- **💾 Persistent**: Memories saved locally (upgradeable to cloud)
- **🔍 Smart Search**: Finds relevant context automatically
- **⚡ Zero Config**: Works out of the box with sensible defaults
- **🔒 Local-First**: Your data stays on your machine

## File Locations

- **Memories**: `~/.universal_memory/memories.json`
- **Config**: `~/.universal_memory_env`
- **Python Path**: Added to site-packages for global import

## Upgrade Path

Start simple, upgrade when needed:

1. **Local File Storage** (default) → 
2. **Mem0 with Qdrant** → 
3. **Full Universal Memory Layer**

Just install additional dependencies and the system automatically uses better backends.

## Examples

### Store Project Decisions
```python
from simple_memory import remember

remember("Using microservices architecture with Docker")
remember("Database: PostgreSQL with Redis cache") 
remember("Auth: JWT tokens, 7-day expiry, refresh mechanism")
```

### Get Context for Tasks
```python
from simple_memory import recall

# When starting authentication work:
auth_context = recall("authentication")
# Returns: Relevant context about JWT, expiry, etc.

# When working on database:
db_context = recall("database")  
# Returns: PostgreSQL setup, Redis cache info
```

### Integration with AI Agents
```python
# This works in Cursor, Claude Code, or any Python environment
from simple_memory import memory

def get_project_context(task_description):
    """AI agents can call this to get relevant context"""
    context = memory.get_context(task_description)
    recent_decisions = memory.search("decision", limit=3)
    
    return {
        "context": context,
        "recent_decisions": recent_decisions,
        "suggestion": "Use this context to inform your next actions"
    }
```

## Troubleshooting

**Import Error?**
```bash
# Add to your Python path manually:
export PYTHONPATH="${PYTHONPATH}:/Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp"
```

**No Mem0?**
No problem! The system falls back to local file storage automatically.

**Want better search?**
```bash
pip install mem0ai  # Automatically enables better semantic search
```

---

**That's it!** You now have persistent memory across all your projects and AI agents. 🎉