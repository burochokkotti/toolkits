#!/usr/bin/env node

/**
 * OpenMemory MCP Server
 * Provides memory capabilities to Claude via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:8080';
const PROJECT_ID = process.env.PROJECT_ID || 'pi-risk-mlops';
const MEMORY_DB_PATH = process.env.MEMORY_DB_PATH || '/data/mlops.sqlite';
const USER_ID = 'claude-user';

// SQLite database for local fallback
let db = null;

/**
 * Initialize SQLite database for local storage
 */
async function initDatabase() {
  try {
    // Ensure directory exists
    const dbDir = path.dirname(MEMORY_DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    db = new sqlite3.Database(MEMORY_DB_PATH);
    const dbRun = promisify(db.run.bind(db));
    
    // Create memories table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        user_id TEXT DEFAULT 'claude-user',
        project_id TEXT DEFAULT '${PROJECT_ID}',
        metadata TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('SQLite database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Check if API server is available
 */
async function checkApiHealth() {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Add memory via API or SQLite fallback
 */
async function addMemory(content, metadata = {}) {
  const isApiAvailable = await checkApiHealth();
  
  if (isApiAvailable) {
    try {
      const response = await axios.post(`${API_URL}/memories`, {
        content,
        user_id: USER_ID,
        metadata: {
          ...metadata,
          project: PROJECT_ID,
          source: 'claude-mcp'
        }
      });
      return { success: true, data: response.data, source: 'api' };
    } catch (error) {
      console.warn('API failed, falling back to SQLite:', error.message);
    }
  }
  
  // Fallback to SQLite
  if (db) {
    try {
      const dbRun = promisify(db.run.bind(db));
      const result = await dbRun(
        'INSERT INTO memories (content, user_id, project_id, metadata) VALUES (?, ?, ?, ?)',
        [content, USER_ID, PROJECT_ID, JSON.stringify(metadata)]
      );
      return {
        success: true,
        data: { memory_id: result.lastID, message: 'Memory added to local storage' },
        source: 'sqlite'
      };
    } catch (error) {
      throw new Error(`Failed to add memory to SQLite: ${error.message}`);
    }
  }
  
  throw new Error('No storage backend available');
}

/**
 * Search memories via API or SQLite fallback
 */
async function searchMemories(query, limit = 10) {
  const isApiAvailable = await checkApiHealth();
  
  if (isApiAvailable) {
    try {
      const response = await axios.post(`${API_URL}/memories/search`, {
        query,
        user_id: USER_ID,
        limit,
        filters: { project: PROJECT_ID }
      });
      return { success: true, data: response.data, source: 'api' };
    } catch (error) {
      console.warn('API search failed, falling back to SQLite:', error.message);
    }
  }
  
  // Fallback to SQLite with basic text search
  if (db) {
    try {
      const dbAll = promisify(db.all.bind(db));
      const results = await dbAll(
        `SELECT * FROM memories 
         WHERE project_id = ? AND (content LIKE ? OR metadata LIKE ?) 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [PROJECT_ID, `%${query}%`, `%${query}%`, limit]
      );
      
      const formatted = results.map(row => ({
        id: row.id.toString(),
        content: row.content,
        user_id: row.user_id,
        metadata: JSON.parse(row.metadata || '{}'),
        created_at: row.created_at,
        score: 0.8 // Mock score for SQLite results
      }));
      
      return { success: true, data: formatted, source: 'sqlite' };
    } catch (error) {
      throw new Error(`Failed to search SQLite: ${error.message}`);
    }
  }
  
  throw new Error('No storage backend available');
}

/**
 * List all memories via API or SQLite fallback
 */
async function listMemories(limit = 100) {
  const isApiAvailable = await checkApiHealth();
  
  if (isApiAvailable) {
    try {
      const response = await axios.get(`${API_URL}/memories`, {
        params: { user_id: USER_ID, limit }
      });
      return { success: true, data: response.data, source: 'api' };
    } catch (error) {
      console.warn('API list failed, falling back to SQLite:', error.message);
    }
  }
  
  // Fallback to SQLite
  if (db) {
    try {
      const dbAll = promisify(db.all.bind(db));
      const results = await dbAll(
        'SELECT * FROM memories WHERE project_id = ? ORDER BY created_at DESC LIMIT ?',
        [PROJECT_ID, limit]
      );
      
      const formatted = results.map(row => ({
        id: row.id.toString(),
        content: row.content,
        user_id: row.user_id,
        metadata: JSON.parse(row.metadata || '{}'),
        created_at: row.created_at
      }));
      
      return { success: true, data: formatted, source: 'sqlite' };
    } catch (error) {
      throw new Error(`Failed to list from SQLite: ${error.message}`);
    }
  }
  
  throw new Error('No storage backend available');
}

/**
 * Delete all memories via API or SQLite fallback
 */
async function deleteAllMemories() {
  const isApiAvailable = await checkApiHealth();
  
  if (isApiAvailable) {
    try {
      const response = await axios.delete(`${API_URL}/memories`, {
        params: { user_id: USER_ID }
      });
      return { success: true, data: response.data, source: 'api' };
    } catch (error) {
      console.warn('API delete failed, falling back to SQLite:', error.message);
    }
  }
  
  // Fallback to SQLite
  if (db) {
    try {
      const dbRun = promisify(db.run.bind(db));
      await dbRun('DELETE FROM memories WHERE project_id = ?', [PROJECT_ID]);
      return {
        success: true,
        data: { message: `All memories deleted from local storage for project ${PROJECT_ID}` },
        source: 'sqlite'
      };
    } catch (error) {
      throw new Error(`Failed to delete from SQLite: ${error.message}`);
    }
  }
  
  throw new Error('No storage backend available');
}

/**
 * Create and configure the MCP server
 */
async function createServer() {
  const server = new Server(
    {
      name: 'openmemory-mlops',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'add_memories',
          description: `Store new information or decisions in the MLOps platform memory. Use this when the user provides new requirements, makes decisions, or gives corrections that should be remembered for future tasks. Project: ${PROJECT_ID}`,
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'The information to store in memory (e.g., architectural decisions, requirements, user preferences)',
              },
              category: {
                type: 'string',
                description: 'Category of the memory (e.g., architecture, requirements, conventions, decisions)',
                enum: ['architecture', 'requirements', 'conventions', 'decisions', 'preferences', 'issues', 'solutions']
              }
            },
            required: ['content'],
          },
        },
        {
          name: 'search_memory',
          description: `Search for relevant information in the MLOps platform memory. Use this at the beginning of tasks to retrieve context about past decisions, requirements, or solutions. Project: ${PROJECT_ID}`,
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query to find relevant memories (e.g., "terraform configuration", "kubernetes setup", "sagemaker deployment")',
              },
              limit: {
                type: 'integer',
                description: 'Maximum number of results to return (default: 10)',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'list_memories',
          description: `List all stored memories for the MLOps platform. Use this to get an overview of all stored knowledge and decisions. Project: ${PROJECT_ID}`,
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'integer',
                description: 'Maximum number of memories to return (default: 50)',
                default: 50,
              },
            },
          },
        },
        {
          name: 'delete_all_memories',
          description: `Delete all stored memories for the MLOps platform. Use with caution - this will permanently remove all stored knowledge. Project: ${PROJECT_ID}`,
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'add_memories': {
          const result = await addMemory(args.content, {
            category: args.category || 'general',
            timestamp: new Date().toISOString()
          });
          
          return {
            content: [
              {
                type: 'text',
                text: `✅ Memory stored successfully (via ${result.source})\n\n**Content:** ${args.content}\n\n**Details:** ${JSON.stringify(result.data, null, 2)}`
              },
            ],
          };
        }

        case 'search_memory': {
          const result = await searchMemories(args.query, args.limit || 10);
          
          if (result.data.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `🔍 No memories found for query: "${args.query}" (searched via ${result.source})`
                },
              ],
            };
          }
          
          const memoriesText = result.data
            .map((memory, index) => 
              `**${index + 1}.** ${memory.content}\n   *Created: ${memory.created_at}${memory.score ? `, Score: ${memory.score.toFixed(2)}` : ''}*`
            )
            .join('\n\n');
          
          return {
            content: [
              {
                type: 'text',
                text: `🔍 Found ${result.data.length} memories for "${args.query}" (via ${result.source}):\n\n${memoriesText}`
              },
            ],
          };
        }

        case 'list_memories': {
          const result = await listMemories(args.limit || 50);
          
          if (result.data.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `📝 No memories stored yet (checked via ${result.source})`
                },
              ],
            };
          }
          
          const memoriesText = result.data
            .map((memory, index) => 
              `**${index + 1}.** ${memory.content}\n   *Created: ${memory.created_at}*`
            )
            .join('\n\n');
          
          return {
            content: [
              {
                type: 'text',
                text: `📝 All stored memories (${result.data.length} total, via ${result.source}):\n\n${memoriesText}`
              },
            ],
          };
        }

        case 'delete_all_memories': {
          const result = await deleteAllMemories();
          
          return {
            content: [
              {
                type: 'text',
                text: `🗑️ All memories deleted successfully (via ${result.source})\n\n${JSON.stringify(result.data, null, 2)}`
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to execute ${name}: ${error.message}`
      );
    }
  });

  return server;
}

/**
 * Main function
 */
async function main() {
  console.log('Starting OpenMemory MCP Server for MLOps Platform...');
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Memory DB: ${MEMORY_DB_PATH}`);
  
  try {
    // Initialize SQLite database
    await initDatabase();
    
    // Create MCP server
    const server = await createServer();
    
    // Create transport
    const transport = new StdioServerTransport();
    
    // Start server
    await server.connect(transport);
    
    console.log('OpenMemory MCP Server started successfully');
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  if (db) {
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  if (db) {
    db.close();
  }
  process.exit(0);
});

// Start the server
main().catch(console.error);