"""
OpenMemory API Server for MLOps Platform
Provides RESTful API for memory operations using Mem0
"""

import os
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn
from mem0 import Memory
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global memory instance
memory_instance = None

# Pydantic models
class MemoryRequest(BaseModel):
    content: str = Field(..., description="Content to store in memory")
    user_id: str = Field(default="system", description="User ID for the memory")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")

class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    user_id: str = Field(default="system", description="User ID to search memories for")
    limit: int = Field(default=10, description="Maximum number of results")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Search filters")

class MemoryResponse(BaseModel):
    id: str
    content: str
    user_id: str
    metadata: Dict[str, Any]
    created_at: str
    score: Optional[float] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    services: Dict[str, str]
    timestamp: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup"""
    global memory_instance
    
    # Initialize Memory with configuration
    config = {
        "vector_store": {
            "provider": "qdrant",
            "config": {
                "host": os.getenv("QDRANT_HOST", "localhost"),
                "port": int(os.getenv("QDRANT_PORT", 6333)),
                "collection_name": os.getenv("MEMORY_COLLECTION", "mlops_memories")
            }
        },
        "llm": {
            "provider": "openai",
            "config": {
                "api_key": os.getenv("OPENAI_API_KEY"),
                "model": "gpt-4o-mini"
            }
        },
        "embedder": {
            "provider": "openai",
            "config": {
                "api_key": os.getenv("OPENAI_API_KEY"),
                "model": "text-embedding-3-small"
            }
        }
    }
    
    try:
        memory_instance = Memory.from_config(config)
        logger.info("Memory instance initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Memory: {e}")
        raise
    
    yield
    
    # Cleanup
    logger.info("Shutting down OpenMemory API")

# Create FastAPI app
app = FastAPI(
    title="OpenMemory API",
    description="Memory service for MLOps platform using Mem0",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        services={
            "qdrant": "connected" if memory_instance else "disconnected",
            "memory": "initialized" if memory_instance else "not initialized"
        },
        timestamp=datetime.utcnow().isoformat()
    )

@app.post("/memories", response_model=Dict[str, str])
async def add_memory(request: MemoryRequest, background_tasks: BackgroundTasks):
    """Add a new memory"""
    if not memory_instance:
        raise HTTPException(status_code=503, detail="Memory service not initialized")
    
    try:
        # Prepare metadata
        metadata = request.metadata or {}
        metadata.update({
            "project": os.getenv("PROJECT_ID", "pi-risk-mlops"),
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": request.user_id
        })
        
        # Add memory
        result = memory_instance.add(
            messages=request.content,
            user_id=request.user_id,
            metadata=metadata
        )
        
        logger.info(f"Added memory for user {request.user_id}: {request.content[:100]}...")
        
        return {
            "message": "Memory added successfully",
            "memory_id": str(result.get('id', 'unknown')),
            "user_id": request.user_id
        }
    
    except Exception as e:
        logger.error(f"Failed to add memory: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add memory: {str(e)}")

@app.post("/memories/search", response_model=List[MemoryResponse])
async def search_memories(request: SearchRequest):
    """Search memories"""
    if not memory_instance:
        raise HTTPException(status_code=503, detail="Memory service not initialized")
    
    try:
        # Search memories
        results = memory_instance.search(
            query=request.query,
            user_id=request.user_id,
            limit=request.limit,
            filters=request.filters
        )
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append(MemoryResponse(
                id=str(result.get('id', 'unknown')),
                content=result.get('memory', ''),
                user_id=request.user_id,
                metadata=result.get('metadata', {}),
                created_at=result.get('created_at', datetime.utcnow().isoformat()),
                score=result.get('score', 0.0)
            ))
        
        logger.info(f"Found {len(formatted_results)} memories for query: {request.query}")
        
        return formatted_results
    
    except Exception as e:
        logger.error(f"Failed to search memories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to search memories: {str(e)}")

@app.get("/memories", response_model=List[MemoryResponse])
async def list_memories(user_id: str = "system", limit: int = 100):
    """List all memories for a user"""
    if not memory_instance:
        raise HTTPException(status_code=503, detail="Memory service not initialized")
    
    try:
        # Get all memories
        results = memory_instance.get_all(user_id=user_id)
        
        # Format results
        formatted_results = []
        for result in results[:limit]:
            formatted_results.append(MemoryResponse(
                id=str(result.get('id', 'unknown')),
                content=result.get('memory', ''),
                user_id=user_id,
                metadata=result.get('metadata', {}),
                created_at=result.get('created_at', datetime.utcnow().isoformat())
            ))
        
        logger.info(f"Retrieved {len(formatted_results)} memories for user {user_id}")
        
        return formatted_results
    
    except Exception as e:
        logger.error(f"Failed to list memories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list memories: {str(e)}")

@app.delete("/memories")
async def delete_all_memories(user_id: str = "system"):
    """Delete all memories for a user"""
    if not memory_instance:
        raise HTTPException(status_code=503, detail="Memory service not initialized")
    
    try:
        # Delete all memories
        memory_instance.delete_all(user_id=user_id)
        
        logger.info(f"Deleted all memories for user {user_id}")
        
        return {
            "message": f"All memories deleted for user {user_id}",
            "user_id": user_id
        }
    
    except Exception as e:
        logger.error(f"Failed to delete memories: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete memories: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "OpenMemory API for MLOps Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 8080))
    host = os.getenv("API_HOST", "0.0.0.0")
    
    logger.info(f"Starting OpenMemory API on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=False,
        log_level="info"
    )