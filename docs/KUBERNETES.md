# Kubernetes Deployment Guide

## Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3.x (optional)

## Deployment Files

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sutradhar-worker
  labels:
    app: sutradhar-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sutradhar-worker
  template:
    metadata:
      labels:
        app: sutradhar-worker
    spec:
      containers:
      - name: worker
        image: sutradhar-worker:latest
        ports:
        - containerPort: 2198
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "2198"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: sutradhar-secrets
              key: redis-url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: sutradhar-secrets
              key: openai-api-key
        # Add other env vars from secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/heartbeat
            port: 2198
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/heartbeat
            port: 2198
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: seed-docs
          mountPath: /app/seed
          readOnly: true
      volumes:
      - name: seed-docs
        configMap:
          name: sutradhar-seed-docs
```

### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: sutradhar-worker
spec:
  selector:
    app: sutradhar-worker
  ports:
  - port: 80
    targetPort: 2198
  type: ClusterIP
```

### HorizontalPodAutoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sutradhar-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sutradhar-worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sutradhar-api
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: sutradhar-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sutradhar-worker
            port:
              number: 80
```

## Deployment Commands

```bash
# Create secrets
kubectl create secret generic sutradhar-secrets \
  --from-literal=redis-url=redis://redis-service:6379 \
  --from-literal=openai-api-key=your-key \
  --from-literal=convex-url=your-url

# Apply configurations
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml
kubectl apply -f k8s/ingress.yaml

# Check status
kubectl get pods -l app=sutradhar-worker
kubectl logs -f deployment/sutradhar-worker

# Scale
kubectl scale deployment sutradhar-worker --replicas=5
```

