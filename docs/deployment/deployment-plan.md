# 🚀 Like-Opt - Deployment Plan

## 📋 개요

**목적**: Like-Opt 시스템의 완전한 배포 및 운영 전략

**환경**: 개발 → 스테이징 → 프로덕션
**목표**: 안정적이고 확장 가능한 프로덕션 배포

---

## 🎯 배포 전략 목표

### 1. 안정성 보장
- 🔒 **무중단 배포**: 서비스 중단 없는 배포
- 🛡️ **롤백 지원**: 문제 발생 시 즉시 이전 버전 복원
- 📊 **모니터링**: 실시간 시스템 상태 모니터링
- 🔄 **자동 복구**: 장애 발생 시 자동 복구

### 2. 확장성 및 성능
- ⚡ **수평 확장**: 트래픽 증가에 따른 자동 스케일링
- 💾 **리소스 최적화**: 효율적인 메모리 및 CPU 사용
- 🌐 **CDN 활용**: 정적 파일 전송 최적화
- 📡 **로드 밸런싱**: 트래픽 분산 처리

### 3. 보안 및 규정 준수
- 🔐 **HTTPS 강제**: 모든 통신 암호화
- 🛡️ **방화벽**: 네트워크 보안 강화
- 📝 **로그 관리**: 보안 및 감사 로그
- 🔑 **비밀 관리**: 환경 변수 및 API 키 보안

---

## 🏗️ 배포 아키텍처

### 1. 전체 시스템 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (Nginx)                    │
│                        Port 80/443                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Application Servers                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Flask App │  │   Flask App │  │   Flask App │        │
│  │  (Worker 1) │  │  (Worker 2) │  │  (Worker N) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Database Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Redis     │  │   ChromaDB  │  │   File      │        │
│  │  (Sessions) │  │  (Vectors)  │  │  (Storage)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2. 컨테이너 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   Flask App     │  │     Nginx       │  │   Redis     │ │
│  │   Container     │  │   Container     │  │  Container  │ │
│  │                 │  │                 │  │             │ │
│  │   Port 5000     │  │   Port 80/443   │  │  Port 6379  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   ChromaDB      │  │   Monitoring    │  │   Logging   │ │
│  │   Container     │  │   Container     │  │  Container  │ │
│  │                 │  │                 │  │             │ │
│  │   Port 8000     │  │   Port 3000     │  │  Port 24224 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐳 Docker 컨테이너화

### 1. Flask 애플리케이션 Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 파일 복사 및 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 비루트 사용자 생성 및 권한 설정
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# 환경 변수 설정
ENV PYTHONPATH=/app
ENV FLASK_APP=run.py
ENV FLASK_ENV=production

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/v1/health || exit 1

# 포트 노출
EXPOSE 5000

# 애플리케이션 실행
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "120", "run:app"]
```

### 2. Nginx 리버스 프록시 Dockerfile
```dockerfile
# nginx/Dockerfile
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/nginx.conf
COPY ssl/ /etc/nginx/ssl/

# 정적 파일 복사 (프론트엔드 빌드 결과)
COPY ../frontend/dist/ /usr/share/nginx/html/

# 로그 디렉토리 생성
RUN mkdir -p /var/log/nginx

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Docker Compose 설정
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Flask 애플리케이션
  app:
    build: ./backend
    container_name: like-opt-app
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
      - REDIS_URL=redis://redis:6379/0
      - CHROMA_HOST=chromadb
      - CHROMA_PORT=8000
    env_file:
      - .env.production
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    depends_on:
      - redis
      - chromadb
    networks:
      - like-opt-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx 리버스 프록시
  nginx:
    build: ./nginx
    container_name: like-opt-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - app
    networks:
      - like-opt-network

  # Redis (세션 저장)
  redis:
    image: redis:7-alpine
    container_name: like-opt-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - like-opt-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ChromaDB (벡터 데이터베이스)
  chromadb:
    image: chromadb/chroma:latest
    container_name: like-opt-chromadb
    restart: unless-stopped
    environment:
      - CHROMA_SERVER_HOST=0.0.0.0
      - CHROMA_SERVER_PORT=8000
    volumes:
      - chroma-data:/chroma/chroma
    networks:
      - like-opt-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/heartbeat"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 모니터링 (Prometheus)
  prometheus:
    image: prom/prometheus:latest
    container_name: like-opt-prometheus
    restart: unless-stopped
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--web.enable-lifecycle'
    networks:
      - like-opt-network

  # 로깅 (Fluentd)
  fluentd:
    build: ./logging
    container_name: like-opt-fluentd
    restart: unless-stopped
    volumes:
      - ./logs:/var/log
      - ./logging/fluent.conf:/fluentd/etc/fluent.conf:ro
    networks:
      - like-opt-network

volumes:
  redis-data:
  chroma-data:
  prometheus-data:

networks:
  like-opt-network:
    driver: bridge
```

### 4. Nginx 설정
```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 로그 형식 정의
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # 기본 설정
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 16M;

    # Gzip 압축
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # 업스트림 서버 정의
    upstream flask_app {
        server app:5000;
    }

    # HTTP에서 HTTPS로 리다이렉트
    server {
        listen 80;
        server_name like-opt.example.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS 서버
    server {
        listen 443 ssl http2;
        server_name like-opt.example.com;

        # SSL 인증서 설정
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # 보안 헤더
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # 정적 파일 서빙
        location /static/ {
            alias /usr/share/nginx/html/static/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location /favicon.ico {
            alias /usr/share/nginx/html/favicon.ico;
            expires 1y;
        }

        # API 프록시
        location /api/ {
            proxy_pass http://flask_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # WebSocket 프록시 (필요시)
        location /ws/ {
            proxy_pass http://flask_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 메인 애플리케이션
        location / {
            try_files $uri $uri/ /index.html;
            root /usr/share/nginx/html;
            index index.html;
        }

        # 헬스체크 엔드포인트
        location /health {
            proxy_pass http://flask_app/api/v1/health;
            access_log off;
        }
    }
}
```

---

## ☁️ 클라우드 배포 옵션

### 1. AWS 배포 (ECS + Fargate)
```yaml
# aws/ecs-task-definition.json
{
  "family": "like-opt-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "like-opt-app",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/like-opt:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "FLASK_ENV",
          "value": "production"
        },
        {
          "name": "REDIS_URL",
          "value": "redis://redis-cluster.cache.amazonaws.com:6379/0"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:like-opt/openai-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/like-opt",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/api/v1/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### 2. Google Cloud 배포 (Cloud Run)
```yaml
# gcp/cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: like-opt-service
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/ingress-status: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        autoscaling.knative.dev/minScale: "1"
        run.googleapis.com/cpu-throttling: "true"
        run.googleapis.com/execution-environment: gen2
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/PROJECT_ID/like-opt:latest
        ports:
        - containerPort: 5000
        env:
        - name: FLASK_ENV
          value: "production"
        - name: REDIS_URL
          value: "redis://redis-memorystore.googleapis.com:6379/0"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-api-key
              key: api-key
        resources:
          limits:
            cpu: "2"
            memory: "4Gi"
          requests:
            cpu: "1"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 3. Azure 배포 (Container Instances)
```yaml
# azure/container-instance.yaml
apiVersion: 2018-10-01
location: eastus
name: like-opt-container
properties:
  containers:
  - name: like-opt-app
    properties:
      image: myregistry.azurecr.io/like-opt:latest
      ports:
      - port: 5000
        protocol: TCP
      environmentVariables:
      - name: FLASK_ENV
        value: production
      - name: REDIS_URL
        secureValue: redis://redis-cache.redis.cache.windows.net:6380/0
      resources:
        requests:
          cpu: 2
          memoryInGb: 4
      livenessProbe:
        httpGet:
          path: /api/v1/health
          port: 5000
        initialDelaySeconds: 30
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /api/v1/health
          port: 5000
        initialDelaySeconds: 5
        periodSeconds: 5
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 80
    dnsNameLabel: like-opt-app
  imageRegistryCredentials:
  - server: myregistry.azurecr.io
    username: myregistry
    password: PASSWORD
```

---

## 🔄 CI/CD 파이프라인

### 1. GitHub Actions 워크플로우
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run Tests
      run: |
        cd backend
        pip install -r requirements.txt
        pytest tests/ -v
    
    - name: Run Frontend Tests
      run: |
        cd frontend
        npm install
        npm test

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
    - name: Deploy to Staging
      run: |
        echo "Deploying to staging environment..."
        # Docker Compose 배포
        docker-compose -f docker-compose.staging.yml up -d
    
    - name: Run E2E Tests
      run: |
        echo "Running E2E tests on staging..."
        cd frontend
        npx playwright test --config=playwright.staging.config.js

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    
    steps:
    - name: Deploy to Production
      run: |
        echo "Deploying to production environment..."
        # Blue-Green 배포 또는 Rolling 업데이트
        docker-compose -f docker-compose.production.yml up -d
    
    - name: Health Check
      run: |
        echo "Performing health check..."
        sleep 30
        curl -f https://like-opt.example.com/api/v1/health || exit 1
    
    - name: Notify Success
      if: success()
      run: |
        echo "Deployment successful!"
        # Slack, Discord 등으로 알림 전송
```

---

## 📊 모니터링 및 로깅

### 1. Prometheus 메트릭 설정
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'like-opt-flask'
    static_configs:
      - targets: ['app:5000']
    metrics_path: '/api/v1/metrics'
    scrape_interval: 5s

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'chromadb'
    static_configs:
      - targets: ['chromadb:8000']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 2. 로그 수집 설정
```ruby
# logging/fluent.conf
<source>
  @type tail
  path /var/log/nginx/access.log
  pos_file /var/log/fluentd/nginx.access.log.pos
  tag nginx.access
  format nginx
</source>

<source>
  @type tail
  path /var/log/app/application.log
  pos_file /var/log/fluentd/app.log.pos
  tag app.log
  format json
</source>

<match nginx.access>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name nginx-access
  type_name access
</match>

<match app.log>
  @type elasticsearch
  host elasticsearch
  port 9200
  index_name like-opt-app
  type_name log
</match>
```

---

## 🔒 보안 설정

### 1. 환경 변수 보안
```bash
# .env.production
# Flask 설정
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-here
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE=Strict

# 데이터베이스 설정
REDIS_PASSWORD=your-redis-password
CHROMA_AUTH_TOKEN=your-chroma-token

# API 키 (보안 저장소에서 로드)
OPENAI_API_KEY=your-openai-key
GOOGLE_API_KEY=your-google-key
GITHUB_TOKEN=your-github-token

# 관리자 설정
ADMIN_PASSWORD=your-admin-password
```

### 2. 방화벽 설정
```bash
# ufw 방화벽 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Docker 네트워크 보안
docker network create --driver bridge \
  --opt com.docker.network.bridge.enable_icc=false \
  --opt com.docker.network.bridge.enable_ip_masquerade=true \
  like-opt-secure-network
```

---

## 📅 배포 일정

### Phase 1: 인프라 준비 (Week 1)
- **Day 1**: Docker 컨테이너화 완성
- **Day 2**: Nginx 설정 및 SSL 인증서
- **Day 3**: 데이터베이스 설정 (Redis, ChromaDB)
- **Day 4**: 모니터링 시스템 구축
- **Day 5**: 로깅 시스템 구축

### Phase 2: 스테이징 환경 (Week 2)
- **Day 1**: 스테이징 환경 배포
- **Day 2**: CI/CD 파이프라인 구축
- **Day 3**: 테스트 자동화
- **Day 4**: 성능 테스트
- **Day 5**: 보안 테스트

### Phase 3: 프로덕션 배포 (Week 3)
- **Day 1**: 프로덕션 환경 준비
- **Day 2**: Blue-Green 배포 설정
- **Day 3**: 프로덕션 배포
- **Day 4**: 모니터링 및 알림 설정
- **Day 5**: 문서화 및 운영 가이드

---

## 🎯 성공 지표

### 안정성 지표
- ✅ **가동 시간**: > 99.9%
- 🔄 **배포 성공률**: > 95%
- 🛡️ **보안 취약점**: 0개
- 📊 **에러율**: < 0.1%

### 성능 지표
- 🚀 **응답 시간**: < 500ms (평균)
- ⚡ **처리량**: > 1000 req/s
- 💾 **리소스 사용률**: < 80%
- 📈 **확장성**: 자동 스케일링

### 운영 지표
- 🔧 **배포 시간**: < 10분
- 📝 **로그 수집**: 100%
- 🚨 **알림 응답**: < 5분
- 📊 **모니터링**: 실시간

---

## 🚨 장애 대응 계획

### 1. 자동 복구
```bash
#!/bin/bash
# scripts/auto-recovery.sh

# 헬스체크 실패 시 자동 재시작
check_health() {
  local max_attempts=3
  local attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:5000/api/v1/health; then
      echo "Health check passed"
      return 0
    fi
    
    echo "Health check failed (attempt $attempt/$max_attempts)"
    attempt=$((attempt + 1))
    sleep 10
  done
  
  return 1
}

# 메인 복구 로직
if ! check_health; then
  echo "Starting auto-recovery process..."
  
  # 컨테이너 재시작
  docker-compose restart app
  
  # 재시작 후 헬스체크
  sleep 30
  if check_health; then
    echo "Auto-recovery successful"
  else
    echo "Auto-recovery failed, escalating..."
    # 관리자 알림
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"Like-Opt auto-recovery failed!"}' \
      $SLACK_WEBHOOK_URL
  fi
fi
```

### 2. 롤백 절차
```bash
#!/bin/bash
# scripts/rollback.sh

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: $0 <previous_version>"
  exit 1
fi

echo "Rolling back to version: $PREVIOUS_VERSION"

# 이전 버전 이미지로 배포
docker-compose down
docker-compose up -d app:$PREVIOUS_VERSION

# 헬스체크
sleep 30
if curl -f http://localhost:5000/api/v1/health; then
  echo "Rollback successful"
else
  echo "Rollback failed"
  exit 1
fi
```

---

**마지막 업데이트**: 2025-10-17  
**버전**: 1.0.0  
**상태**: 📋 계획 완료, 🚀 구현 준비
