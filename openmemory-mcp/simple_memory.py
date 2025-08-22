"""
Simple Universal Memory Client
Use this across any repo, any agent (Cursor, Claude Code, etc.)

Usage:
    from simple_memory import memory
    
    # Store memories
    memory.add("We decided to use React for the frontend")
    memory.add("Database schema uses PostgreSQL with user table")
    
    # Search memories  
    results = memory.search("frontend decisions")
    context = memory.get_context("user authentication")
"""

import os
import json
from typing import List, Dict, Any, Optional
from pathlib import Path

try:
    from mem0 import Memory
    HAS_MEM0 = True
except ImportError:
    HAS_MEM0 = False
    
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False


class SimpleMemory:
    """Simple memory interface that works everywhere"""
    
    def __init__(self):
        self.config = self._load_config()
        self.client = self._init_client()
        
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from environment or defaults"""
        # Try to load from .env file
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
            
        return {
            'user_id': os.getenv('MEMORY_USER_ID', 'default-user'),
            'api_endpoint': os.getenv('MEMORY_API_ENDPOINT', 'http://localhost:8080'),
            'use_local_fallback': os.getenv('MEMORY_USE_LOCAL', 'true').lower() == 'true',
            'data_dir': Path.home() / '.universal_memory'
        }
    
    def _init_client(self):
        """Initialize the best available memory client"""
        if HAS_MEM0:
            try:
                # Try to initialize Mem0
                return Memory(user_id=self.config['user_id'])
            except Exception:
                pass
                
        # Fallback to local file storage
        return LocalMemoryFallback(self.config)
    
    def add(self, content: str, metadata: Optional[Dict] = None) -> str:
        """Add a memory - works with any backend"""
        try:
            if hasattr(self.client, 'add'):
                result = self.client.add(content, user_id=self.config['user_id'], metadata=metadata or {})
                return str(result.get('id', 'stored'))
            else:
                return self.client.store(content, metadata or {})
        except Exception as e:
            print(f"Memory add failed: {e}")
            return "error"
    
    def search(self, query: str, limit: int = 5) -> List[Dict]:
        """Search memories - works with any backend"""
        try:
            if hasattr(self.client, 'search'):
                results = self.client.search(query, user_id=self.config['user_id'], limit=limit)
                return [{'content': r.get('memory', ''), 'score': r.get('score', 0.0)} for r in results]
            else:
                return self.client.search_local(query, limit)
        except Exception as e:
            print(f"Memory search failed: {e}")
            return []
    
    def get_context(self, topic: str, limit: int = 3) -> str:
        """Get contextual information for a topic"""
        results = self.search(topic, limit)
        if not results:
            return f"No memory found for: {topic}"
            
        context_parts = []
        for i, result in enumerate(results[:limit], 1):
            content = result.get('content', '')
            if content:
                context_parts.append(f"{i}. {content}")
        
        if context_parts:
            return f"Relevant context for '{topic}':\n" + "\n".join(context_parts)
        return f"No relevant context found for: {topic}"
    
    def get_all(self) -> List[Dict]:
        """Get all memories"""
        try:
            if hasattr(self.client, 'get_all'):
                results = self.client.get_all(user_id=self.config['user_id'])
                return [{'content': r.get('memory', ''), 'id': r.get('id')} for r in results]
            else:
                return self.client.get_all_local()
        except Exception as e:
            print(f"Failed to get all memories: {e}")
            return []


class LocalMemoryFallback:
    """Local file-based memory fallback when Mem0 not available"""
    
    def __init__(self, config: Dict):
        self.data_dir = config['data_dir']
        self.data_dir.mkdir(exist_ok=True)
        self.memory_file = self.data_dir / 'memories.json'
        
    def _load_memories(self) -> List[Dict]:
        """Load memories from local file"""
        if self.memory_file.exists():
            try:
                with open(self.memory_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                pass
        return []
    
    def _save_memories(self, memories: List[Dict]):
        """Save memories to local file"""
        try:
            with open(self.memory_file, 'w', encoding='utf-8') as f:
                json.dump(memories, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Failed to save memories: {e}")
    
    def store(self, content: str, metadata: Dict) -> str:
        """Store memory locally"""
        memories = self._load_memories()
        memory_id = f"local_{len(memories) + 1}"
        
        new_memory = {
            'id': memory_id,
            'content': content,
            'metadata': metadata,
            'timestamp': str(Path.ctime(Path.now()) if hasattr(Path, 'ctime') else 'unknown')
        }
        
        memories.append(new_memory)
        self._save_memories(memories)
        return memory_id
    
    def search_local(self, query: str, limit: int = 5) -> List[Dict]:
        """Simple text-based search in local memories"""
        memories = self._load_memories()
        query_lower = query.lower()
        
        # Simple keyword matching
        matches = []
        for memory in memories:
            content = memory.get('content', '').lower()
            if query_lower in content:
                # Simple scoring based on query word frequency
                score = content.count(query_lower) / len(content.split()) if content else 0
                matches.append({
                    'content': memory['content'],
                    'score': score,
                    'id': memory['id']
                })
        
        # Sort by score and return top results
        matches.sort(key=lambda x: x['score'], reverse=True)
        return matches[:limit]
    
    def get_all_local(self) -> List[Dict]:
        """Get all local memories"""
        return self._load_memories()


# Global memory instance - import this anywhere
memory = SimpleMemory()


# Convenience functions for even easier usage
def remember(text: str, tags: Optional[List[str]] = None):
    """Quick function to remember something"""
    metadata = {'tags': tags} if tags else {}
    return memory.add(text, metadata)


def recall(topic: str, limit: int = 3) -> str:
    """Quick function to recall context about a topic"""
    return memory.get_context(topic, limit)


def search_memory(query: str, limit: int = 5) -> List[Dict]:
    """Quick function to search memories"""
    return memory.search(query, limit)


# Example usage for testing
if __name__ == "__main__":
    print("🧠 Universal Memory - Simple Setup")
    print("=" * 40)
    
    # Test adding memories
    print("Adding test memories...")
    memory.add("We decided to use React for the frontend framework")
    memory.add("Database will use PostgreSQL with proper indexing")
    memory.add("Authentication uses JWT tokens with refresh mechanism")
    
    # Test searching
    print("\nSearching for 'frontend':")
    results = memory.search("frontend")
    for result in results:
        print(f"  - {result.get('content', '')}")
    
    # Test context retrieval
    print(f"\nContext for 'authentication':")
    context = memory.get_context("authentication")
    print(context)
    
    print("\n✅ Memory system working! You can now use it in any project.")
    print("\nUsage:")
    print("  from simple_memory import memory")
    print("  memory.add('Your memory here')")
    print("  results = memory.search('your query')")