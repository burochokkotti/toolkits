.PHONY: help build up down logs clean init test ui

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	@echo "Building OpenMemory MCP services..."
	docker-compose build --no-cache

up: ## Start all services
	@echo "Starting OpenMemory MCP services..."
	docker-compose up -d
	@echo "Services started. Qdrant: http://localhost:6333, API: http://localhost:8080"

down: ## Stop all services
	@echo "Stopping OpenMemory MCP services..."
	docker-compose down

logs: ## Show logs from all services
	docker-compose logs -f

logs-api: ## Show API logs
	docker-compose logs -f mem0-api

logs-mcp: ## Show MCP server logs
	docker-compose logs -f mcp-server

logs-qdrant: ## Show Qdrant logs
	docker-compose logs -f qdrant

clean: ## Clean up containers and volumes
	@echo "Cleaning up containers, networks, and volumes..."
	docker-compose down -v
	docker system prune -f

init: ## Initialize memory with MLOps knowledge
	@echo "Initializing memory with MLOps project knowledge..."
	python3 scripts/init_memory.py

test: ## Test memory operations
	@echo "Testing memory operations..."
	python3 scripts/test_memory.py

ui: ## Start the UI (if implemented)
	@echo "Starting UI development server..."
	cd ui && npm install && npm start

status: ## Check service status
	@echo "Checking service status..."
	docker-compose ps

restart: ## Restart all services
	@echo "Restarting all services..."
	docker-compose restart

backup: ## Backup memory data
	@echo "Creating backup of memory data..."
	tar -czf "backup-$(shell date +%Y%m%d-%H%M%S).tar.gz" data/

restore: ## Restore from backup (usage: make restore BACKUP=backup-file.tar.gz)
	@if [ -z "$(BACKUP)" ]; then echo "Usage: make restore BACKUP=backup-file.tar.gz"; exit 1; fi
	@echo "Restoring from $(BACKUP)..."
	tar -xzf $(BACKUP)