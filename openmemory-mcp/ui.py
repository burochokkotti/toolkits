#!/usr/bin/env python3
"""
Simple Web UI for Universal Memory
Provides a clean interface to view, search, and manage memories
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for
import os
import json
from simple_memory import memory, remember, recall, search_memory

app = Flask(__name__)

@app.route('/')
def index():
    """Main page showing all memories"""
    try:
        all_memories = memory.get_all()
        return render_template('index.html', memories=all_memories, total=len(all_memories))
    except Exception as e:
        return render_template('index.html', error=str(e), memories=[], total=0)

@app.route('/search')
def search_page():
    """Search page"""
    query = request.args.get('q', '')
    results = []
    
    if query:
        try:
            results = search_memory(query, limit=20)
        except Exception as e:
            return render_template('search.html', query=query, results=[], error=str(e))
    
    return render_template('search.html', query=query, results=results)

@app.route('/add', methods=['GET', 'POST'])
def add_memory():
    """Add new memory"""
    if request.method == 'POST':
        content = request.form.get('content', '').strip()
        tags_str = request.form.get('tags', '').strip()
        
        if not content:
            return render_template('add.html', error="Content is required")
        
        try:
            tags = [tag.strip() for tag in tags_str.split(',') if tag.strip()] if tags_str else []
            result = remember(content, tags)
            return redirect(url_for('index'))
        except Exception as e:
            return render_template('add.html', error=str(e), content=content, tags=tags_str)
    
    return render_template('add.html')

@app.route('/context')
def context_page():
    """Get context for a topic"""
    topic = request.args.get('topic', '')
    context = ""
    
    if topic:
        try:
            context = recall(topic)
        except Exception as e:
            return render_template('context.html', topic=topic, context="", error=str(e))
    
    return render_template('context.html', topic=topic, context=context)

# API endpoints for programmatic access
@app.route('/api/memories')
def api_memories():
    """API: Get all memories"""
    try:
        memories = memory.get_all()
        return jsonify({"memories": memories, "total": len(memories)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/search', methods=['POST'])
def api_search():
    """API: Search memories"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        limit = data.get('limit', 10)
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        results = search_memory(query, limit=limit)
        return jsonify({"results": results, "query": query, "total": len(results)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/add', methods=['POST'])
def api_add():
    """API: Add memory"""
    try:
        data = request.get_json()
        content = data.get('content', '').strip()
        tags = data.get('tags', [])
        
        if not content:
            return jsonify({"error": "Content is required"}), 400
        
        result = remember(content, tags)
        return jsonify({"success": True, "id": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/context', methods=['POST'])
def api_context():
    """API: Get context for topic"""
    try:
        data = request.get_json()
        topic = data.get('topic', '').strip()
        
        if not topic:
            return jsonify({"error": "Topic is required"}), 400
        
        context = recall(topic)
        return jsonify({"context": context, "topic": topic})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/clear', methods=['DELETE'])
def api_clear():
    """API: Clear all memories"""
    try:
        import os
        from pathlib import Path
        memory_file = Path.home() / '.universal_memory' / 'memories.json'
        
        if memory_file.exists():
            with open(memory_file, 'w') as f:
                json.dump([], f)
            return jsonify({"success": True, "message": "All memories cleared"})
        else:
            return jsonify({"success": True, "message": "No memories to clear"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/stats')
def stats():
    """Statistics page"""
    try:
        all_memories = memory.get_all()
        total_memories = len(all_memories)
        
        # Basic statistics
        word_counts = []
        tags = []
        
        for mem in all_memories:
            content = mem.get('content', '')
            word_counts.append(len(content.split()))
            
            mem_tags = mem.get('metadata', {}).get('tags', [])
            tags.extend(mem_tags)
        
        avg_words = sum(word_counts) / len(word_counts) if word_counts else 0
        
        # Tag frequency
        tag_freq = {}
        for tag in tags:
            tag_freq[tag] = tag_freq.get(tag, 0) + 1
        
        top_tags = sorted(tag_freq.items(), key=lambda x: x[1], reverse=True)[:10]
        
        stats_data = {
            'total_memories': total_memories,
            'avg_words_per_memory': round(avg_words, 1),
            'total_tags': len(set(tags)),
            'top_tags': top_tags
        }
        
        return render_template('stats.html', stats=stats_data)
    except Exception as e:
        return render_template('stats.html', error=str(e))

if __name__ == '__main__':
    import sys
    import socket
    
    # Create templates directory if it doesn't exist
    os.makedirs('templates', exist_ok=True)
    
    # Default port (changed from 5000 to avoid macOS AirPlay conflict)
    port = 5001
    
    # Check for custom port argument
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"⚠️  Invalid port: {sys.argv[1]}, using default {port}")
    
    # Try to find an available port if the chosen one is taken
    def find_available_port(start_port):
        for p in range(start_port, start_port + 10):
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('127.0.0.1', p))
            sock.close()
            if result != 0:  # Port is available
                return p
        return None
    
    # Check if port is available
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    
    if result == 0:  # Port is in use
        print(f"⚠️  Port {port} is already in use...")
        available_port = find_available_port(port + 1)
        if available_port:
            port = available_port
            print(f"✅ Found available port: {port}")
        else:
            print("❌ Could not find available port. Try specifying a custom port:")
            print(f"   python ui.py 8080")
            sys.exit(1)
    
    print("🧠 Universal Memory Web UI")
    print("=" * 30)
    print("Starting web interface...")
    print(f"✅ Access at: http://localhost:{port}")
    
    if port == 5001:
        print("📝 Note: Using port 5001 to avoid macOS AirPlay conflict")
        print("   To disable AirPlay: System Settings → General → AirDrop & Handoff")
    
    print()
    print("Features:")
    print("  - View all memories")
    print("  - Search memories") 
    print("  - Add new memories")
    print("  - Get topic context")
    print("  - Memory statistics")
    print("  - REST API endpoints")
    print()
    
    try:
        app.run(host='0.0.0.0', port=port, debug=True)
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {port} became unavailable. Try a different port:")
            print(f"   python ui.py {port + 1}")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)