#!/usr/bin/env node

/**
 * Simple Universal Memory MCP Server
 * Works with simple_memory.py backend
 * Provides both MCP interface (for Claude Desktop) and HTTP API (for Cursor)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import express from 'express';
import cors from 'cors';

// Configuration
const MEMORY_FILE = path.join(os.homedir(), '.universal_memory', 'memories.json');
const HTTP_PORT = process.env.HTTP_PORT || 3001;
const PYTHON_PATH = process.env.PYTHON_PATH || 'python3';

/**
 * Execute Python command using simple_memory.py
 */
function executePython(command) {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import sys
sys.path.append('${process.cwd()}')
from simple_memory import memory
${command}
`;
    
    const child = spawn(PYTHON_PATH, ['-c', pythonScript]);
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        try {
          // Try to parse as JSON, fallback to string
          const result = stdout.trim();
          if (result.startsWith('{') || result.startsWith('[')) {
            resolve(JSON.parse(result));
          } else {
            resolve(result);
          }
        } catch (e) {
          resolve(stdout.trim());
        }
      } else {
        reject(new Error(`Python execution failed: ${stderr || stdout}`));
      }
    });
  });
}

/**
 * Add memory using simple_memory.py
 */
async function addMemory(content, metadata = {}) {
  try {
    const command = `
result = memory.add("${content.replace(/"/g, '\\"')}", ${JSON.stringify(metadata)})
print(f'{{"success": True, "id": "{result}", "message": "Memory added successfully"}}')
`;
    return await executePython(command);
  } catch (error) {
    throw new Error(`Failed to add memory: ${error.message}`);
  }
}

/**
 * Search memories using simple_memory.py
 */
async function searchMemories(query, limit = 10) {
  try {
    const command = `
import json
results = memory.search("${query.replace(/"/g, '\\"')}", limit=${limit})
print(json.dumps(results))
`;
    const results = await executePython(command);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    throw new Error(`Failed to search memories: ${error.message}`);
  }
}

/**
 * List all memories using simple_memory.py
 */
async function listMemories(limit = 100) {
  try {
    const command = `
import json
results = memory.get_all()[:${limit}]
print(json.dumps(results))
`;
    const results = await executePython(command);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    throw new Error(`Failed to list memories: ${error.message}`);
  }
}

/**
 * Get context for a topic using simple_memory.py
 */
async function getContext(topic, limit = 5) {
  try {
    const command = `
context = memory.get_context("${topic.replace(/"/g, '\\"')}", limit=${limit})
print(context)
`;
    return await executePython(command);
  } catch (error) {
    throw new Error(`Failed to get context: ${error.message}`);
  }
}

/**
 * Clear all memories (with confirmation)
 */
async function clearMemories() {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      fs.writeFileSync(MEMORY_FILE, JSON.stringify([]));
      return { success: true, message: "All memories cleared" };
    }
    return { success: true, message: "No memories to clear" };
  } catch (error) {
    throw new Error(`Failed to clear memories: ${error.message}`);
  }
}

/**
 * Create MCP Server
 */
function createMCPServer() {
  const server = new Server(
    {
      name: 'universal-memory',
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
          name: 'add_memory',
          description: 'Store new information, decisions, or context that should be remembered across sessions',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'The information to store (decisions, requirements, solutions, etc.)',
              },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional tags to categorize the memory',
              },
            },
            required: ['content'],
          },
        },
        {
          name: 'search_memory',
          description: 'Search for relevant memories based on a query. Use this to find past decisions, solutions, or context.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query to find relevant memories',
              },
              limit: {
                type: 'integer',
                description: 'Maximum number of results (default: 10)',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_context',
          description: 'Get contextual information about a specific topic or task',
          inputSchema: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'The topic or task to get context for',
              },
              limit: {
                type: 'integer',
                description: 'Maximum number of context items (default: 5)',
                default: 5,
              },
            },
            required: ['topic'],
          },
        },
        {
          name: 'list_memories',
          description: 'List all stored memories. Use this to get an overview of stored knowledge.',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'integer',
                description: 'Maximum number of memories to return (default: 20)',
                default: 20,
              },
            },
          },
        },
        {
          name: 'clear_memories',
          description: 'Clear all stored memories. Use with caution - this permanently deletes all stored knowledge.',
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
        case 'add_memory': {
          const result = await addMemory(args.content, { tags: args.tags || [] });
          return {
            content: [
              {
                type: 'text',
                text: `✅ Memory stored successfully!\n\n**Content:** ${args.content}\n\n**ID:** ${result.id || 'stored'}`,
              },
            ],
          };
        }

        case 'search_memory': {
          const results = await searchMemories(args.query, args.limit || 10);
          
          if (results.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: `🔍 No memories found for: "${args.query}"`,
                },
              ],
            };
          }
          
          const memoriesText = results
            .map((memory, index) => 
              `**${index + 1}.** ${memory.content || memory}\n   ${memory.score ? `*Relevance: ${(memory.score * 100).toFixed(1)}%*` : ''}`
            )
            .join('\n\n');
          
          return {
            content: [
              {
                type: 'text',
                text: `🔍 Found ${results.length} memories for "${args.query}":\n\n${memoriesText}`,
              },
            ],
          };
        }

        case 'get_context': {
          const context = await getContext(args.topic, args.limit || 5);
          
          return {
            content: [
              {
                type: 'text',
                text: `📋 Context for "${args.topic}":\n\n${context}`,
              },
            ],
          };
        }

        case 'list_memories': {
          const memories = await listMemories(args.limit || 20);
          
          if (memories.length === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: '📝 No memories stored yet.',
                },
              ],
            };
          }
          
          const memoriesText = memories
            .map((memory, index) => 
              `**${index + 1}.** ${memory.content}\n   *ID: ${memory.id}*`
            )
            .join('\n\n');
          
          return {
            content: [
              {
                type: 'text',
                text: `📝 All memories (${memories.length} total):\n\n${memoriesText}`,
              },
            ],
          };
        }

        case 'clear_memories': {
          const result = await clearMemories();
          
          return {
            content: [
              {
                type: 'text',
                text: `🗑️ ${result.message}`,
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
 * Create HTTP API Server (for Cursor integration)
 */
function createHTTPServer() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'universal-memory-api' });
  });
  
  // List all memories
  app.get('/memories', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const memories = await listMemories(limit);
      res.json({ memories, total: memories.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Add memory
  app.post('/memory', async (req, res) => {
    try {
      const { content, tags } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }
      
      const result = await addMemory(content, { tags: tags || [] });
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Search memories
  app.post('/search', async (req, res) => {
    try {
      const { query, limit = 10 } = req.body;
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const results = await searchMemories(query, limit);
      res.json({ results, total: results.length, query });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get context
  app.post('/context', async (req, res) => {
    try {
      const { topic, limit = 5 } = req.body;
      if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }
      
      const context = await getContext(topic, limit);
      res.json({ context, topic });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Clear memories
  app.delete('/memories', async (req, res) => {
    try {
      const result = await clearMemories();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  return app;
}

/**
 * Main function
 */
async function main() {
  const mode = process.env.MODE || 'mcp';
  
  if (mode === 'http' || mode === 'both') {
    console.log('Starting HTTP API server...');
    const httpApp = createHTTPServer();
    httpApp.listen(HTTP_PORT, () => {
      console.log(`HTTP API server running on http://localhost:${HTTP_PORT}`);
      console.log('Endpoints:');
      console.log('  GET  /memories     - List all memories');
      console.log('  POST /memory       - Add new memory');
      console.log('  POST /search       - Search memories');
      console.log('  POST /context      - Get topic context');
      console.log('  DELETE /memories   - Clear all memories');
    });
  }
  
  if (mode === 'mcp' || mode === 'both') {
    console.log('Starting MCP server...');
    console.log(`Memory file: ${MEMORY_FILE}`);
    
    try {
      const server = createMCPServer();
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.log('MCP server started successfully');
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Start based on how it's called
if (process.argv.includes('--http')) {
  process.env.MODE = 'http';
} else if (process.argv.includes('--both')) {
  process.env.MODE = 'both';
}

main().catch(console.error);