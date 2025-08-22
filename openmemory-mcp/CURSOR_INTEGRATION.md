# 🎯 Cursor Integration Guide

How to integrate Universal Memory with Cursor (and other AI coding assistants)

## 🚀 Quick Setup

### Option 1: Direct Python Import (Simplest)
```python
# In any Python file Cursor is editing:
from simple_memory import memory, remember, recall

# Store decisions as you make them
remember("We decided to use FastAPI for the backend API")
remember("User authentication uses JWT with 7-day expiry")

# Get context when starting tasks
auth_context = recall("authentication")  
# Returns formatted context about auth decisions

# Search for specific information
api_results = memory.search("API design")
```

### Option 2: HTTP API Integration
```python
import requests

# Store memory
requests.post("http://localhost:3001/memory", json={
    "content": "We use PostgreSQL with connection pooling",
    "tags": ["database", "backend"]
})

# Search memories
response = requests.post("http://localhost:3001/search", json={
    "query": "database",
    "limit": 5
})
results = response.json()["results"]

# Get context
response = requests.post("http://localhost:3001/context", json={
    "topic": "user authentication"
})
context = response.json()["context"]
```

## 🔧 Setup Instructions

### 1. Start the HTTP API Server
```bash
# Terminal 1: Start the HTTP API for Cursor
cd /Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp
node simple_mcp_server.js --http
```

The server will start at `http://localhost:3001` with these endpoints:
- `GET /memories` - List all memories
- `POST /memory` - Add new memory
- `POST /search` - Search memories  
- `POST /context` - Get topic context
- `DELETE /memories` - Clear all memories

### 2. Option A: Python Path Method
```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc)
export PYTHONPATH="${PYTHONPATH}:/Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp"

# Or run the setup script (one-time)
cd /Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp
./setup.sh
```

### 2. Option B: Copy to Project Method
```bash
# Copy simple_memory.py to your current project
cp /Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp/simple_memory.py .

# Install requirements in your project
pip install mem0ai python-dotenv requests
```

## 💡 Cursor Usage Patterns

### Pattern 1: Context at Task Start
```python
# At the beginning of any coding session
from simple_memory import recall

def start_task(task_description):
    """Get relevant context before starting work"""
    context = recall(task_description)
    print(f"📋 Context for '{task_description}':")
    print(context)
    return context

# Example usage:
start_task("implementing user authentication")
start_task("setting up database connections")
start_task("creating API endpoints")
```

### Pattern 2: Store Decisions as You Code
```python
from simple_memory import remember

# As you make decisions while coding:
remember("API rate limit set to 100 requests/minute per user")
remember("Using bcrypt for password hashing with salt rounds=12")  
remember("JWT tokens expire after 7 days, refresh tokens after 30 days")
remember("Database uses PostgreSQL 15 with connection pooling (max 20)")
```

### Pattern 3: Project-Specific Memory Helper
```python
# Create a project-specific memory helper
from simple_memory import memory

class ProjectMemory:
    def __init__(self, project_name):
        self.project = project_name
    
    def store(self, content, category="general"):
        """Store memory with project context"""
        tagged_content = f"[{self.project}] {content}"
        return memory.add(tagged_content, {"tags": [self.project, category]})
    
    def get_context(self, topic):
        """Get project-specific context"""
        project_query = f"{self.project} {topic}"
        return memory.get_context(project_query)
    
    def search(self, query):
        """Search project memories"""
        project_query = f"{self.project} {query}"
        return memory.search(project_query)

# Usage in your project:
pm = ProjectMemory("ecommerce-app")
pm.store("Payment processing uses Stripe API", "payments")
context = pm.get_context("payment flow")
```

### Pattern 4: AI Agent Memory Wrapper
```python
# Helper for AI agents to use memory automatically
from simple_memory import memory, recall

def memory_aware_task(task_description, implementation_func):
    """Wrapper that provides context and stores results"""
    
    # Get context before starting
    print("🧠 Retrieving relevant context...")
    context = recall(task_description)
    print(f"Context: {context}\n")
    
    # Execute the task
    result = implementation_func(context)
    
    # Store the outcome
    if result:
        memory.add(f"Completed: {task_description} - Result: {result}")
    
    return result

# Usage:
def implement_auth(context):
    # Your implementation here
    # The context parameter contains relevant past decisions
    return "JWT authentication implemented"

result = memory_aware_task(
    "implement user authentication", 
    implement_auth
)
```

## 🌐 HTTP API Reference

### Add Memory
```bash
curl -X POST http://localhost:3001/memory \
  -H "Content-Type: application/json" \
  -d '{
    "content": "We decided to use Redis for session storage",
    "tags": ["redis", "sessions", "caching"]
  }'
```

### Search Memories
```bash
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "authentication",
    "limit": 5
  }'
```

### Get Context
```bash
curl -X POST http://localhost:3001/context \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "database setup",
    "limit": 3
  }'
```

### List All Memories
```bash
curl http://localhost:3001/memories
```

## 🔧 Advanced Integration

### Custom Cursor Commands
Create a `.cursor-settings.json` in your project:

```json
{
  "memory.commands": {
    "Remember Decision": {
      "command": "python -c \"from simple_memory import remember; remember('${input}', ['decision'])\""
    },
    "Get Context": {
      "command": "python -c \"from simple_memory import recall; print(recall('${input}'))\""
    },
    "Search Memories": {
      "command": "python -c \"from simple_memory import memory; [print(f'- {r[\\\"content\\\"]}') for r in memory.search('${input}')]\""
    }
  }
}
```

### VS Code Tasks (if using Cursor based on VS Code)
Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Store Memory",
      "type": "shell",
      "command": "python",
      "args": ["-c", "from simple_memory import remember; remember('${input:memory}')"],
      "group": "build"
    },
    {
      "label": "Get Context", 
      "type": "shell",
      "command": "python",
      "args": ["-c", "from simple_memory import recall; print(recall('${input:topic}'))"],
      "group": "build"
    }
  ]
}
```

## 🎨 Web UI Integration

While coding in Cursor, you can also use the web interface:

1. **Start Web UI**: `python ui.py`
2. **Open**: http://localhost:5000
3. **Features**:
   - View all memories in a clean interface
   - Search with highlighting
   - Add memories via web form
   - Get topic context
   - View statistics

## 🔍 Troubleshooting

**Import Error**
```bash
# Add to Python path
export PYTHONPATH="${PYTHONPATH}:/Users/somnathchakraborty/Paytm/toolkits/openmemory-mcp"
```

**API Not Available**
```bash
# Check if server is running
curl http://localhost:3001/health

# If not, start it:
node simple_mcp_server.js --http
```

**Memory File Issues**
```bash
# Check memory file location
ls ~/.universal_memory/memories.json

# View contents
cat ~/.universal_memory/memories.json | python3 -m json.tool
```

## 🚀 Pro Tips

1. **Start Every Session**: Begin coding sessions by getting context
2. **Store Decisions**: Immediately store important decisions as you make them
3. **Use Tags**: Tag memories for better organization
4. **Project Prefixes**: Use project names in memories for multi-project setups
5. **Regular Cleanup**: Periodically review and organize your memories

## 🎯 Example Workflow

```python
# 1. Start coding session
from simple_memory import memory, remember, recall

# 2. Get context for current task
print("Getting context for authentication work...")
auth_context = recall("authentication JWT security")
print(auth_context)

# 3. Code your feature...
# (implement authentication)

# 4. Store important decisions made
remember("JWT secret key stored in environment variables")
remember("Token expiry set to 7 days with refresh mechanism") 
remember("Password reset tokens expire after 1 hour")

# 5. Store any issues encountered
remember("Fixed: CORS issue with JWT headers, needed 'Authorization' in allowed headers")

# 6. Get context for next task
print("\nGetting context for API design...")
api_context = recall("API endpoints REST design")
print(api_context)
```

Your memory system now works seamlessly with Cursor and any other coding environment! 🎉