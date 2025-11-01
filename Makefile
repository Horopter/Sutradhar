.PHONY: help install build dev test clean docker-build docker-up docker-down

help:
	@echo "Sutradhar API - Makefile Commands"
	@echo ""
	@echo "Development:"
	@echo "  make install      - Install all dependencies"
	@echo "  make dev          - Start development server"
	@echo "  make dev-all      - Start all services (worker + convex)"
	@echo "  make build        - Build TypeScript"
	@echo "  make test         - Run all tests"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-up    - Start services with Docker Compose"
	@echo "  make docker-down  - Stop Docker Compose services"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make lint         - Run linting (if configured)"

install:
	@echo "Installing dependencies..."
	cd apps/worker && npm install
	cd apps/convex && npm install || echo "Skipping convex install"

build:
	@echo "Building TypeScript..."
	cd apps/worker && npm run build

dev:
	@echo "Starting development server..."
	cd apps/worker && npm run dev

dev-all:
	@echo "Starting all services..."
	@echo "Start Convex in one terminal: cd apps/convex && npm run dev"
	@echo "Start Worker in another: cd apps/worker && npm run dev"

test:
	@echo "Running tests..."
	cd apps/worker && npm run test

docker-build:
	@echo "Building Docker image..."
	docker build -t sutradhar-worker:latest -f apps/worker/Dockerfile .

docker-up:
	@echo "Starting Docker Compose services..."
	docker-compose up -d
	@echo "Services started. Check logs with: docker-compose logs -f"

docker-down:
	@echo "Stopping Docker Compose services..."
	docker-compose down

clean:
	@echo "Cleaning build artifacts..."
	rm -rf apps/worker/dist
	rm -rf apps/worker/node_modules/.cache
	find . -type d -name "node_modules" -prune -o -type f -name "*.tsbuildinfo" -print -delete
	@echo "Clean complete"

lint:
	@echo "Linting code..."
	cd apps/worker && npm run lint || echo "No lint script configured"

