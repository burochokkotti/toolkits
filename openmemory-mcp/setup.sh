#!/bin/bash

# Universal Memory - Quick Setup Script
# Run this once to set up memory across all your projects

echo "🧠 Setting up Universal Memory System..."
echo "======================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "simple_memory.py" ]; then
    echo "❌ Error: Please run this script from the openmemory-mcp directory"
    echo "Current directory: $(pwd)"
    echo "Expected files: simple_memory.py, requirements.txt"
    exit 1
fi

echo -e "${BLUE}Step 1: Installing Python dependencies...${NC}"
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo "❌ Failed to install dependencies. Please check your Python installation."
    exit 1
fi

echo -e "${BLUE}Step 2: Creating global Python path link...${NC}"
CURRENT_DIR=$(pwd)
PYTHON_SITE_PACKAGES=$(python -c "import site; print(site.getsitepackages()[0])")

# Create a .pth file to make simple_memory importable from anywhere
echo "$CURRENT_DIR" > "$PYTHON_SITE_PACKAGES/universal_memory.pth"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Universal Memory can now be imported from any Python project${NC}"
else
    echo -e "${YELLOW}⚠️  Could not create global import. You may need to copy simple_memory.py to each project.${NC}"
fi

echo -e "${BLUE}Step 3: Setting up environment variables...${NC}"
cat > ~/.universal_memory_env << EOF
# Universal Memory Configuration
# You can customize these settings:

export MEMORY_USER_ID="$(whoami)"
export MEMORY_USE_LOCAL="true"
export MEMORY_API_ENDPOINT="http://localhost:8080"
EOF

echo -e "${GREEN}✅ Configuration saved to ~/.universal_memory_env${NC}"

echo -e "${BLUE}Step 4: Testing the setup...${NC}"
python simple_memory.py

echo ""
echo -e "${GREEN}🎉 Universal Memory Setup Complete!${NC}"
echo "======================================="
echo ""
echo -e "${BLUE}How to use in ANY project:${NC}"
echo ""
echo "1. ${YELLOW}In any Python script:${NC}"
echo "   from simple_memory import memory"
echo "   memory.add('Important decision or context')"
echo "   results = memory.search('your query')"
echo ""
echo "2. ${YELLOW}Quick functions:${NC}"
echo "   from simple_memory import remember, recall"
echo "   remember('We use React for frontend')"
echo "   context = recall('frontend decisions')"
echo ""
echo "3. ${YELLOW}For Cursor/Claude AI integration:${NC}"
echo "   Just import and use the memory functions in your code"
echo "   The AI agents can access stored context across projects"
echo ""
echo -e "${BLUE}Memory files location:${NC} ~/.universal_memory/"
echo -e "${BLUE}Configuration:${NC} ~/.universal_memory_env"
echo ""
echo -e "${GREEN}Happy coding with persistent memory! 🚀${NC}"