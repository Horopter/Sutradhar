# Multi-stage build for lean production image
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm globally
RUN npm i -g pnpm@latest

# Copy package files
COPY apps/worker/package*.json ./
COPY package*.json ./

# Install dependencies (with clean install)
RUN pnpm install --frozen-lockfile --prod=false || npm ci

# Copy source code
COPY apps/worker/tsconfig.json ./
COPY apps/worker/src ./src
COPY seed ../seed

# Build TypeScript
RUN pnpm run build || npm run build

# Production stage
FROM node:20-slim AS production

WORKDIR /app

# Install pnpm
RUN npm i -g pnpm@latest

# Copy package files
COPY apps/worker/package*.json ./

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod || npm ci --only=production

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/seed ../seed

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:2198/health/heartbeat', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose port
EXPOSE 2198

# Environment
ENV NODE_ENV=production
ENV PORT=2198

# Start application
CMD ["node", "dist/src/server.js"]
