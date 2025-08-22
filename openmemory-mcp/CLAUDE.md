# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Universal Memory Layer - A comprehensive memory management system for AI agents that provides intelligent context retrieval, automatic categorization, and cross-agent compatibility. Built with open-source components including Mem0, Qdrant, and sophisticated RAG capabilities.

**Key Goals:**
- **90% Token Reduction** through smart retrieval and summarization
- **Cross-Agent Compatibility** via standardized APIs 
- **Context Persistence** across sessions and agents
- **Open-Source Foundation** with enterprise-grade features
- **Offline Capability** with multiple fallback strategies

## Enhanced Architecture

The system now consists of multiple integrated layers:

### Core Services
1. **Enhanced API Server** (`api/enhanced_main.py`) - Advanced FastAPI server with smart categorization, conflict detection, and multi-level memory management
2. **Universal Gateway** (`api/universal_gateway.py`) - Standardized interface for all AI agents with caching and routing
3. **Smart RAG Engine** (`core/smart_rag.py`) - Hybrid retrieval system with semantic search, graph traversal, and temporal filtering
4. **Enhanced MCP Server** (`mcp-server/enhanced_index.js`) - Intelligent MCP server with automatic context retrieval and decision extraction

### SDK and Tools
5. **Python SDK** (`sdk/python/universal_memory/`) - Complete SDK with decorators, async support, and agent integrations
6. **CLI Tools** (`tools/cli.py`) - Command-line interface for memory management and monitoring
7. **Monitoring Dashboard** (`tools/monitoring_dashboard.py`) - Real-time web dashboard with WebSocket updates

### Key Features

- **Smart Categorization**: Auto-categorizes memories (architecture, decisions, requirements, etc.)
- **Conflict Detection**: Identifies contradictory or outdated information
- **Graph Relationships**: Builds memory relationship graphs for context traversal
- **Multi-Level Memory**: User, Session, Project, and Agent-scoped memories
- **Hybrid Search**: Combines semantic similarity, keyword matching, and graph traversal
- **Time Decay**: Applies relevance decay to older memories
- **Automatic Context**: Retrieves relevant context at task start
- **Decision Extraction**: Automatically captures important decisions from conversations

## Development Commands

### Enhanced System Startup
```bash
# Build all enhanced services
make build

# Start complete Universal Memory stack
make up

# Start individual enhanced services
docker-compose up enhanced-api    # Enhanced API with smart features
docker-compose up gateway        # Universal Gateway
docker-compose up enhanced-mcp   # Enhanced MCP server

# Stop services
make down

# Check enhanced service status
make status
```

### Development and Testing
```bash
# Run enhanced API server in development mode
cd api && python enhanced_main.py

# Run universal gateway
cd api && python universal_gateway.py

# Run enhanced MCP server in development mode
cd mcp-server && node enhanced_index.js

# Test memory operations with enhanced features
make test

# Initialize memory with MLOps sample data
make init

# Start monitoring dashboard
cd tools && python monitoring_dashboard.py
```

### CLI Tools
```bash
# Install Python SDK and CLI
cd sdk/python && pip install -e .

# Configure CLI
python tools/cli.py config --gateway-url http://localhost:9000

# Add memories via CLI
python tools/cli.py add "We decided to use React for frontend" --tags decision,architecture

# Search memories
python tools/cli.py search "frontend framework" --limit 5

# Get task context
python tools/cli.py context "implementing user authentication"

# Monitor real-time activity
python tools/cli.py monitor

# View memory statistics
python tools/cli.py stats
```

### Monitoring and Analytics
```bash
# Start web dashboard (http://localhost:8090)
cd tools && python monitoring_dashboard.py

# View enhanced logs
make logs-enhanced
make logs-gateway
make logs-smart-rag

# Check system health
python tools/cli.py health
```

### Data Management
```bash
# Export memories
python tools/cli.py export memories.json --format json

# Import memories
python tools/cli.py import-file memories.json

# Backup with enhanced metadata
make backup

# Restore from backup
make restore BACKUP=backup-file.tar.gz

# Clean up all data and containers
make clean
```

## Enhanced Environment Configuration

### Core Configuration
```bash
# AI/ML Configuration
OPENAI_API_KEY=your_openai_api_key_here
PROJECT_ID=your_project_name                 # Default: "universal-memory"
MEMORY_COLLECTION=enhanced_memories          # Qdrant collection

# Service URLs
GATEWAY_URL=http://localhost:9000           # Universal Gateway
ENHANCED_API_URL=http://localhost:8080      # Enhanced API
BASIC_API_URL=http://localhost:8081         # Basic API (fallback)

# Database Configuration
QDRANT_HOST=localhost                       # Vector database
QDRANT_PORT=6333
REDIS_URL=redis://localhost:6379            # Caching layer
SQLITE_DB_PATH=/data/enhanced_memory.db     # Local fallback
RAG_DB_PATH=/data/smart_rag.db             # RAG engine storage

# Smart Features
AUTO_MEMORY_ENABLED=true                   # Auto context retrieval
AUTO_CATEGORIZATION=true                   # Smart categorization
CONFLICT_DETECTION=true                    # Detect memory conflicts
TIME_DECAY_ENABLED=true                    # Apply time-based relevance

# Agent Configuration
MCP_USER_ID=claude-user                    # MCP server user
AGENT_TYPE=claude                          # Agent identifier
SESSION_TIMEOUT=3600                       # Session timeout (seconds)

# Performance Tuning
MAX_MEMORIES_PER_SEARCH=50                 # Search result limit
CACHE_TTL=3600                            # Cache timeout (seconds)
EMBEDDING_MODEL=all-MiniLM-L6-v2          # Sentence transformer model
CONTEXT_WINDOW_SIZE=10                     # Max context memories
```

### Service-Specific Configuration

#### Enhanced MCP Server
```bash
MEMORY_DB_PATH=/data/enhanced_mcp.sqlite
CONVERSATION_MEMORY_LIMIT=20              # Track last N interactions
DECISION_EXTRACTION_ENABLED=true         # Auto-extract decisions
IMPORTANCE_THRESHOLD=0.7                  # Min importance for storage
```

#### Universal Gateway
```bash
GATEWAY_PORT=9000
RATE_LIMIT_PER_MINUTE=1000               # API rate limiting
CORS_ORIGINS=*                           # CORS configuration
WEBSOCKET_ENABLED=true                   # Real-time updates
```

#### Smart RAG Engine
```bash
SEMANTIC_SIMILARITY_THRESHOLD=0.7        # Semantic search cutoff
GRAPH_TRAVERSAL_DEPTH=2                  # Relationship traversal depth
TFIDF_MAX_FEATURES=10000                 # Keyword search features
DIVERSITY_FACTOR=0.3                     # Result diversity (0-1)
```

## Enhanced MCP Tools Available

### Intelligent Memory Tools
The enhanced MCP server provides these advanced tools to Claude:

#### Smart Memory Management
- `smart_memory_add` - Intelligently store with auto-categorization, importance scoring, and conflict detection
- `contextual_memory_search` - Advanced search with semantic similarity, time decay, and relationship traversal
- `get_task_context` - Retrieve comprehensive context for task initiation with recommendations
- `auto_extract_decisions` - Extract and store important decisions from conversation
- `memory_analytics` - Get detailed analytics and usage patterns

#### Advanced Features
- **Auto-Categorization**: Automatically detects if content is about architecture, decisions, requirements, code, issues, solutions, conventions, or preferences
- **Importance Scoring**: Calculates relevance score based on content analysis and context
- **Conflict Detection**: Identifies potentially outdated or contradictory information
- **Relationship Building**: Automatically creates connections between related memories
- **Session Tracking**: Maintains conversation context across interactions
- **Decision Extraction**: Identifies and preserves important decisions made during tasks

### Tool Usage Examples

```javascript
// Smart memory addition with auto-categorization
tools.smart_memory_add({
  content: "We decided to use PostgreSQL for the main database",
  importance: 0.8,  // Optional override
  context: { phase: "architecture_design" }
})

// Contextual search with advanced filtering
tools.contextual_memory_search({
  query: "database decisions",
  limit: 5,
  session_only: false,
  include_related: true
})

// Get comprehensive task context
tools.get_task_context({
  task_description: "Setting up user authentication system"
})

// Extract decisions from recent conversation
tools.auto_extract_decisions({
  force_extract: false
})
```

## Enhanced Resilience Design

The Universal Memory Layer implements a multi-tier resilience strategy:

### Primary Tier: Universal Gateway
1. **Universal Gateway** routes requests to optimal backend
2. **Load balancing** across multiple API instances
3. **Request caching** with Redis for frequently accessed data
4. **Circuit breaker** pattern for service health management

### Secondary Tier: Enhanced API Stack
1. **Enhanced API** with Mem0 + Qdrant vector search
2. **Smart RAG Engine** with hybrid retrieval strategies
3. **Graph-based relationships** for context traversal
4. **Automatic conflict resolution** and memory deduplication

### Tertiary Tier: Fallback Systems
1. **SQLite with FTS5** for full-text search when vector DB unavailable
2. **Local embedding cache** for offline semantic similarity
3. **File-based memory export/import** for data portability
4. **Graceful degradation** with reduced functionality but continued operation

### Cross-Cutting Resilience Features
- **Automatic retry logic** with exponential backoff
- **Health monitoring** and automatic failover
- **Data synchronization** when services come back online
- **Memory conflict resolution** when merging offline changes
- **Backup and restore** capabilities with metadata preservation

## Integration Examples

### Claude Code Integration
```javascript
// Auto-retrieve context at task start
const context = await getTaskContext("implementing user authentication");
if (context.relevant_memories.length > 0) {
  console.log(`Found ${context.relevant_memories.length} relevant memories`);
  // Use context.recommendations for guidance
}

// Auto-store important decisions
await smartMemoryAdd("We decided to use JWT tokens for authentication", {
  context: { task: "user_auth", phase: "implementation" }
});
```

### Python SDK Integration
```python
from universal_memory import UniversalMemoryClient, memory_aware

# Initialize client
client = UniversalMemoryClient(
    agent_type="cursor",
    workspace="my_project"
)

# Use decorators for automatic memory management
@memory_aware(auto_context=True, store_result=True)
def implement_feature(feature_name, _memory_context=None):
    if _memory_context and _memory_context.has_relevant_context:
        print(f"Using context: {_memory_context.context_summary}")
    
    # Implementation with memory-aware context
    return f"Implemented {feature_name}"
```

### Generic Agent Integration
```python
# Any agent can use the universal interface
import requests

# Add memory
response = requests.post("http://localhost:9000/universal/memory", json={
    "content": "User prefers dark mode UI",
    "agent_type": "custom_agent",
    "tags": ["preference", "ui"],
    "priority": 6
})

# Search memories
response = requests.post("http://localhost:9000/universal/search", json={
    "query": "UI preferences",
    "agent_type": "custom_agent",
    "limit": 5
})
```