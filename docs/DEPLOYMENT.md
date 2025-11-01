# Deployment Guide

## Production Deployment

### Prerequisites

- Docker & Docker Compose
- Redis (for distributed caching)
- Environment variables configured

### Quick Deploy

```bash
# Production deployment with Redis
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f worker

# Check health
curl http://localhost:2198/health
```

## Environment Setup

### Required Variables

```bash
# Core
NODE_ENV=production
PORT=2198

# Database
CONVEX_URL=your-convex-url

# LLM (at least one required)
OPENAI_API_KEY=your-key
# OR
PERPLEXITY_API_KEY=your-key

# Retrieval
HYPERSPELL_API_KEY=your-key
MOCK_RETRIEVAL=false

# Caching (recommended for production)
REDIS_URL=redis://redis:6379

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

### Optional Variables

```bash
# Actions
COMPOSIO_API_KEY=your-key
MOCK_ACTIONS=false

# Voice
LIVEKIT_URL=wss://your-livekit-url
LIVEKIT_API_KEY=your-key
LIVEKIT_API_SECRET=your-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_JSON=true
```

## Scaling

### Horizontal Scaling

1. **Load Balancer Setup**
   - Use health check endpoint: `/health/heartbeat`
   - Configure sticky sessions if needed (optional, service is stateless)
   - Set up SSL termination

2. **Enable Redis Cache**
   ```bash
   REDIS_URL=redis://your-redis-instance:6379
   ```

3. **Deploy Multiple Instances**
   ```bash
   # Kubernetes example
   kubectl scale deployment sutradhar-worker --replicas=3
   
   # Docker Compose (already configured)
   docker-compose -f docker-compose.prod.yml up -d --scale worker=3
   ```

### Vertical Scaling

1. **Resource Limits**
   ```yaml
   # In docker-compose.prod.yml
   deploy:
     resources:
       limits:
         cpus: '2'
         memory: 1G
   ```

2. **Node.js Memory**
   ```bash
   NODE_OPTIONS="--max-old-space-size=2048"
   ```

## Monitoring

### Health Checks

- `/health/heartbeat` - For load balancer (fast, lightweight)
- `/health` - Basic health check
- `/health/full` - Comprehensive health status

### Metrics

- `/metrics` - Prometheus metrics endpoint

### Logging

Structured JSON logs with `LOG_JSON=true`:
- Use log aggregation service (Datadog, ELK, etc.)
- Parse JSON logs for better searchability
- Set up alerts on error patterns

## Security

### Production Checklist

- [ ] HTTPS/TLS configured (load balancer or reverse proxy)
- [ ] CORS origins restricted (`ALLOWED_ORIGINS`)
- [ ] API keys stored securely (secrets management)
- [ ] Non-root containers enabled
- [ ] Rate limiting configured appropriately
- [ ] Security headers configured
- [ ] Regular security updates
- [ ] Monitoring and alerting set up

### Secrets Management

Use your platform's secrets management:
- **Kubernetes**: Secrets
- **Docker Swarm**: Docker secrets
- **AWS**: Secrets Manager
- **GCP**: Secret Manager
- **Azure**: Key Vault

## High Availability

### Multi-Region Deployment

1. Deploy instances in multiple regions
2. Use global load balancer
3. Redis cluster or regional Redis instances
4. Shared session store (Convex)

### Failover

- Health checks automatically remove unhealthy instances
- Circuit breakers prevent cascade failures
- Graceful degradation to mock services

## Performance Tuning

### Cache Configuration

```bash
# Tune cache TTL based on your needs
CACHE_DEFAULT_TTL=3600  # 1 hour default

# Redis connection pool (if using custom Redis)
REDIS_MAX_CONNECTIONS=50
```

### Timeouts

Adjust timeouts based on your external service SLAs:
```bash
RETRIEVAL_TIMEOUT_MS=2500
GRACEFUL_SHUTDOWN_TIMEOUT=30000
```

## Backup & Recovery

### Data

- **Convex**: Managed by Convex (automatic backups)
- **Redis**: Configure Redis persistence (AOF/RDB)
- **Seed Documents**: Version controlled in git

### Configuration

- Store `.env` in secrets management
- Version control `docker-compose.yml`
- Document deployment procedures

## Troubleshooting

### Common Issues

**High Memory Usage**
- Check for memory leaks (use Node.js memory profiler)
- Reduce cache TTL
- Limit concurrent requests

**Slow Responses**
- Check external API latencies
- Verify Redis is connected
- Review timeout settings

**Connection Errors**
- Verify all API keys are set
- Check network connectivity
- Review circuit breaker status

### Debugging

```bash
# View logs
docker-compose logs -f worker

# Check health
curl http://localhost:2198/health/full | jq

# Check metrics
curl http://localhost:2198/metrics

# Test endpoints
curl -X POST http://localhost:2198/api/v1/answer \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'
```

