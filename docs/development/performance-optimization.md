# ⚡ Like-Opt - Performance Optimization Plan

## 📋 개요

**목적**: Like-Opt 시스템의 최고 성능 달성을 위한 종합 최적화 전략

**목표**: 응답 속도 50% 향상, 메모리 사용량 30% 감소, 동시 사용자 수 10배 증가
**범위**: 백엔드 API, 프론트엔드 UI, 데이터베이스, 네트워크, 캐싱

---

## 🎯 성능 최적화 목표

### 1. 응답 속도 목표
- 🚀 **API 응답**: < 200ms (평균), < 500ms (95th percentile)
- ⚡ **페이지 로딩**: < 1초 (초기 로딩), < 500ms (SPA 네비게이션)
- 📡 **AI 응답**: < 2초 (스트리밍 시작), < 5초 (완전 응답)
- 🔄 **검색 성능**: < 100ms (RAG 검색)

### 2. 처리량 목표
- 📊 **동시 사용자**: 1000명 → 10000명
- 🔄 **요청 처리량**: 100 req/s → 1000 req/s
- 💾 **메모리 효율**: 50% 감소
- 📈 **CPU 효율**: 30% 개선

### 3. 확장성 목표
- 🔧 **수평 확장**: 무중단 스케일링
- 📦 **리소스 최적화**: 자동 리소스 관리
- 🌐 **CDN 활용**: 글로벌 콘텐츠 전송
- ⚡ **캐싱 전략**: 80% 캐시 히트율

---

## 🏗️ 성능 아키텍처

### 1. 전체 성능 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                    CDN (CloudFront)                        │
│                    Static Assets                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Load Balancer (Nginx)                       │
│                SSL Termination + Compression               │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Application Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Flask App │  │   Flask App │  │   Flask App │        │
│  │  (Gunicorn) │  │  (Gunicorn) │  │  (Gunicorn) │        │
│  │  4 Workers  │  │  4 Workers  │  │  4 Workers  │        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Cache Layer                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Redis     │  │   Memcached │  │   CDN       │        │
│  │  (Sessions) │  │  (Objects)  │  │  (Assets)   │        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Database Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   ChromaDB  │  │   Vector    │  │   File      │        │
│  │  (Vectors)  │  │  Index      │  │  (Storage)  │        │
└─────────────────────────────────────────────────────────────┘
```

### 2. 성능 모니터링 대시보드
```
┌─────────────────────────────────────────────────────────────┐
│                    Performance Dashboard                    │
│                                                             │
│  📊 Response Time    📈 Throughput    💾 Memory Usage     │
│  ┌─────────────┐    ┌─────────────┐   ┌─────────────┐     │
│  │   150ms     │    │  850 req/s  │   │   2.1 GB    │     │
│  │  (Average)  │    │  (Current)  │   │   (Peak)    │     │
│  └─────────────┘    └─────────────┘   └─────────────┘     │
│                                                             │
│  🔄 Cache Hit Rate  🚀 Page Load     ⚡ API Latency        │
│  ┌─────────────┐    ┌─────────────┐   ┌─────────────┐     │
│  │    87%      │    │   0.8s      │   │   180ms     │     │
│  │  (Hit Rate) │    │  (Average)  │   │  (P95)      │     │
│  └─────────────┘    └─────────────┘   └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 백엔드 성능 최적화

### 1. Flask 애플리케이션 최적화

#### 1.1 Gunicorn 설정 최적화
```python
# gunicorn_config.py
import multiprocessing
import os

# 서버 소켓
bind = "0.0.0.0:5000"
backlog = 2048

# Worker 프로세스
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gevent"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100

# 타임아웃 설정
timeout = 120
keepalive = 5
graceful_timeout = 30

# 로깅
accesslog = "/var/log/gunicorn/access.log"
errorlog = "/var/log/gunicorn/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# 성능 최적화
preload_app = True
worker_tmp_dir = "/dev/shm"

# 프로세스 이름
proc_name = "like-opt"

# 보안
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8192

# 환경 변수
raw_env = [
    'PYTHONPATH=/app',
    'FLASK_ENV=production'
]
```

#### 1.2 Flask 애플리케이션 최적화
```python
# backend/app/__init__.py (최적화된 버전)
import os
from pathlib import Path
from flask import Flask, jsonify, request
from flask_session import Session
from flask_compress import Compress
from flask_caching import Cache
import redis

# 프로젝트 루트 경로 설정
project_root = Path(__file__).resolve().parents[3]

def create_app():
    """최적화된 Flask 애플리케이션 팩토리"""
    app = Flask(
        __name__,
        template_folder=str(project_root / 'frontend' / 'templates'),
        static_folder=str(project_root / 'frontend' / 'static')
    )

    # 성능 최적화 설정
    app.config.update(
        # 기본 설정
        SECRET_KEY=os.getenv('SECRET_KEY', 'like-opt-secret-key-2024'),
        
        # 세션 최적화
        SESSION_TYPE='redis',
        SESSION_REDIS=redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0')),
        SESSION_PERMANENT=True,
        SESSION_USE_SIGNER=True,
        SESSION_KEY_PREFIX='likeopt:session:',
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Lax',
        SESSION_COOKIE_SECURE=os.getenv('SESSION_COOKIE_SECURE', 'False').lower() == 'true',
        PERMANENT_SESSION_LIFETIME=int(os.getenv('PERMANENT_SESSION_LIFETIME', 86400)),
        
        # 압축 설정
        COMPRESS_MIMETYPES=[
            'text/html', 'text/css', 'text/xml', 'text/javascript',
            'application/json', 'application/javascript', 'application/xml+rss',
            'application/atom+xml', 'image/svg+xml'
        ],
        COMPRESS_LEVEL=6,
        COMPRESS_MIN_SIZE=500,
        
        # 캐싱 설정
        CACHE_TYPE='redis',
        CACHE_REDIS_URL=os.getenv('REDIS_URL', 'redis://localhost:6379/1'),
        CACHE_DEFAULT_TIMEOUT=300,
        CACHE_KEY_PREFIX='likeopt:cache:',
        
        # 파일 업로드 최적화
        MAX_CONTENT_LENGTH=int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)),
        
        # 기타 성능 설정
        JSON_SORT_KEYS=False,
        JSONIFY_PRETTYPRINT_REGULAR=False,
        WTF_CSRF_ENABLED=False,
    )

    # 확장 초기화
    Session(app)
    Compress(app)
    Cache(app)
    
    # 블루프린트 등록
    register_blueprints(app)
    
    # 에러 핸들러 등록
    register_error_handlers(app)
    
    # 성능 미들웨어 등록
    register_performance_middleware(app)
    
    return app

def register_performance_middleware(app):
    """성능 최적화 미들웨어 등록"""
    
    @app.before_request
    def before_request():
        """요청 전 처리"""
        # 요청 ID 생성 (로깅용)
        request.request_id = str(uuid.uuid4())
        
        # 요청 시작 시간 기록
        request.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        """응답 후 처리"""
        # 응답 시간 계산
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            response.headers['X-Response-Time'] = f"{duration:.3f}s"
        
        # 캐시 헤더 설정
        if request.endpoint in ['static', 'api.health']:
            response.headers['Cache-Control'] = 'public, max-age=31536000'  # 1년
        elif request.endpoint in ['api.chat']:
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        
        # CORS 헤더
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        
        return response
    
    @app.teardown_request
    def teardown_request(exception):
        """요청 정리"""
        # 리소스 정리 로직
        pass
```

#### 1.3 데이터베이스 최적화
```python
# backend/app/services/optimized_rag_service.py
import asyncio
import aiohttp
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
import redis
import json

class OptimizedRAGService:
    """최적화된 RAG 서비스"""
    
    def __init__(self):
        self.redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/2'))
        self.cache_ttl = 3600  # 1시간
        self.thread_pool = ThreadPoolExecutor(max_workers=4)
        
        # 벡터 인덱스 캐시
        self._vector_index_cache = {}
        self._chunks_cache = {}
    
    @lru_cache(maxsize=1000)
    def _get_cached_chunks(self, query_hash):
        """캐시된 청크 조회"""
        cached = self.redis_client.get(f"chunks:{query_hash}")
        if cached:
            return json.loads(cached)
        return None
    
    def _cache_chunks(self, query_hash, chunks):
        """청크 캐시 저장"""
        self.redis_client.setex(
            f"chunks:{query_hash}",
            self.cache_ttl,
            json.dumps(chunks)
        )
    
    async def search_async(self, query: str, top_k: int = 5) -> List[RAGResult]:
        """비동기 검색"""
        query_hash = hashlib.md5(query.encode()).hexdigest()
        
        # 캐시 확인
        cached_results = self._get_cached_chunks(query_hash)
        if cached_results:
            return [RAGResult.from_dict(r) for r in cached_results]
        
        # 병렬 검색 실행
        tasks = [
            self._bm25_search(query, top_k),
            self._vector_search(query, top_k),
            self._hybrid_search(query, top_k)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 최적 결과 선택
        best_results = self._merge_results(results)
        
        # 결과 캐시
        self._cache_chunks(query_hash, [r.to_dict() for r in best_results])
        
        return best_results
    
    async def _bm25_search(self, query: str, top_k: int) -> List[RAGResult]:
        """BM25 비동기 검색"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.thread_pool,
            self._bm25_search_sync,
            query, top_k
        )
    
    async def _vector_search(self, query: str, top_k: int) -> List[RAGResult]:
        """벡터 비동기 검색"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            self.thread_pool,
            self._vector_search_sync,
            query, top_k
        )
    
    def _merge_results(self, results: List[List[RAGResult]]) -> List[RAGResult]:
        """검색 결과 병합 및 최적화"""
        merged = {}
        
        for result_list in results:
            if isinstance(result_list, Exception):
                continue
                
            for result in result_list:
                key = f"{result.doc_id}:{result.chunk_id}"
                if key in merged:
                    # 점수 평균 계산
                    merged[key].score = (merged[key].score + result.score) / 2
                else:
                    merged[key] = result
        
        # 점수 기준 정렬
        sorted_results = sorted(merged.values(), key=lambda x: x.score, reverse=True)
        return sorted_results[:top_k]
```

### 2. 캐싱 전략

#### 2.1 다층 캐싱 시스템
```python
# backend/app/cache/multi_layer_cache.py
import redis
import json
import pickle
from typing import Any, Optional, Union
from functools import wraps
import time

class MultiLayerCache:
    """다층 캐싱 시스템"""
    
    def __init__(self):
        # L1: 메모리 캐시 (LRU)
        self.memory_cache = {}
        self.memory_cache_order = []
        self.memory_cache_max_size = 1000
        
        # L2: Redis 캐시
        self.redis_client = redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/3'))
        
        # L3: 디스크 캐시 (큰 데이터용)
        self.disk_cache_dir = Path('/tmp/likeopt_cache')
        self.disk_cache_dir.mkdir(exist_ok=True)
    
    def get(self, key: str) -> Optional[Any]:
        """캐시에서 데이터 조회"""
        # L1: 메모리 캐시 확인
        if key in self.memory_cache:
            self._update_memory_cache_order(key)
            return self.memory_cache[key]
        
        # L2: Redis 캐시 확인
        redis_data = self.redis_client.get(f"cache:{key}")
        if redis_data:
            try:
                data = pickle.loads(redis_data)
                self._set_memory_cache(key, data)
                return data
            except Exception:
                pass
        
        # L3: 디스크 캐시 확인
        disk_path = self.disk_cache_dir / f"{hash(key)}.cache"
        if disk_path.exists():
            try:
                with open(disk_path, 'rb') as f:
                    data = pickle.load(f)
                self._set_memory_cache(key, data)
                return data
            except Exception:
                pass
        
        return None
    
    def set(self, key: str, value: Any, ttl: int = 3600, layer: str = 'auto') -> None:
        """캐시에 데이터 저장"""
        if layer in ['auto', 'memory']:
            self._set_memory_cache(key, value)
        
        if layer in ['auto', 'redis'] and not isinstance(value, (str, int, float, bool, list, dict)):
            # 복잡한 객체는 Redis에 저장
            try:
                self.redis_client.setex(f"cache:{key}", ttl, pickle.dumps(value))
            except Exception:
                pass
        
        if layer in ['auto', 'disk'] and len(str(value)) > 1024 * 1024:  # 1MB 이상
            # 큰 데이터는 디스크에 저장
            disk_path = self.disk_cache_dir / f"{hash(key)}.cache"
            try:
                with open(disk_path, 'wb') as f:
                    pickle.dump(value, f)
            except Exception:
                pass
    
    def _set_memory_cache(self, key: str, value: Any) -> None:
        """메모리 캐시에 저장"""
        if len(self.memory_cache) >= self.memory_cache_max_size:
            # LRU 제거
            oldest_key = self.memory_cache_order.pop(0)
            del self.memory_cache[oldest_key]
        
        self.memory_cache[key] = value
        self._update_memory_cache_order(key)
    
    def _update_memory_cache_order(self, key: str) -> None:
        """메모리 캐시 순서 업데이트"""
        if key in self.memory_cache_order:
            self.memory_cache_order.remove(key)
        self.memory_cache_order.append(key)

# 캐시 데코레이터
def cached(ttl: int = 3600, layer: str = 'auto'):
    """캐싱 데코레이터"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # 캐시 키 생성
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            
            # 캐시에서 조회
            cache = MultiLayerCache()
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # 함수 실행
            result = func(*args, **kwargs)
            
            # 결과 캐시
            cache.set(cache_key, result, ttl, layer)
            
            return result
        return wrapper
    return decorator

# 사용 예시
@cached(ttl=1800, layer='redis')
def get_ai_response(prompt: str, model: str) -> str:
    """AI 응답 캐싱"""
    # AI API 호출 로직
    pass

@cached(ttl=3600, layer='memory')
def get_rag_context(query: str) -> str:
    """RAG 컨텍스트 캐싱"""
    # RAG 검색 로직
    pass
```

#### 2.2 API 응답 캐싱
```python
# backend/app/api/cached_endpoints.py
from flask import request, jsonify
from flask_caching import Cache
from functools import wraps
import hashlib

cache = Cache()

def api_cache(timeout=300, key_prefix='api'):
    """API 응답 캐싱 데코레이터"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # 캐시 키 생성
            cache_key = f"{key_prefix}:{request.endpoint}:{hashlib.md5(str(request.args).encode()).hexdigest()}"
            
            # 캐시에서 조회
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return jsonify(cached_result)
            
            # API 실행
            result = f(*args, **kwargs)
            
            # 결과 캐시 (JSON 직렬화 가능한 경우만)
            if isinstance(result, (dict, list, str, int, float, bool)):
                cache.set(cache_key, result, timeout=timeout)
            
            return result
        return decorated_function
    return decorator

# 사용 예시
@api_bp.route('/conversation', methods=['GET'])
@api_cache(timeout=60)  # 1분 캐시
def get_conversation():
    """대화 기록 조회 (캐싱 적용)"""
    conversation = chat_service.get_conversation()
    return [msg.to_dict() for msg in conversation]

@api_bp.route('/indexing/status', methods=['GET'])
@api_cache(timeout=30)  # 30초 캐시
def get_indexing_status():
    """인덱싱 상태 조회 (캐싱 적용)"""
    return indexing_service.get_indexing_status()
```

---

## 🎨 프론트엔드 성능 최적화

### 1. 번들 최적화

#### 1.1 Webpack 설정 최적화
```javascript
// frontend/webpack.config.js
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/main.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash].js' : '[name].js',
      chunkFilename: isProduction ? '[name].[contenthash].chunk.js' : '[name].chunk.js',
      clean: true,
      publicPath: '/static/',
    },
    
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
            },
            mangle: true,
          },
          extractComments: false,
        }),
      ],
      
      // 코드 분할
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
      
      // 런타임 청크 분리
      runtimeChunk: 'single',
      
      // 모듈 ID 안정화
      moduleIds: 'deterministic',
    },
    
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                '@babel/plugin-transform-runtime',
                '@babel/plugin-syntax-dynamic-import',
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [
                    ['autoprefixer'],
                    ['cssnano', { preset: 'default' }],
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    
    plugins: [
      new MiniCssExtractPlugin({
        filename: isProduction ? '[name].[contenthash].css' : '[name].css',
        chunkFilename: isProduction ? '[name].[contenthash].chunk.css' : '[name].chunk.css',
      }),
      
      // Gzip 압축
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8,
      }),
      
      // 번들 분석 (개발 시에만)
      ...(isProduction ? [] : [new BundleAnalyzerPlugin()]),
    ],
    
    // 성능 힌트
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    
    // 개발 서버 설정
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      port: 3000,
      hot: true,
      historyApiFallback: true,
    },
  };
};
```

#### 1.2 동적 임포트 및 지연 로딩
```javascript
// frontend/src/router/lazyLoader.js
export class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  async loadComponent(modulePath) {
    // 이미 로드된 모듈 확인
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    // 로딩 중인 모듈 확인
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    // 모듈 로딩 시작
    const loadingPromise = import(modulePath).then(module => {
      this.loadedModules.set(modulePath, module);
      this.loadingPromises.delete(modulePath);
      return module;
    }).catch(error => {
      this.loadingPromises.delete(modulePath);
      throw error;
    });

    this.loadingPromises.set(modulePath, loadingPromise);
    return loadingPromise;
  }

  // 컴포넌트 지연 로딩
  async loadPageComponent(pageName) {
    const modulePath = `../pages/${pageName}.js`;
    return this.loadComponent(modulePath);
  }

  // 서비스 지연 로딩
  async loadService(serviceName) {
    const modulePath = `../services/${serviceName}.js`;
    return this.loadComponent(modulePath);
  }
}

export const lazyLoader = new LazyLoader();

// 사용 예시
// frontend/src/router/router.js
export class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
  }

  async navigate(path) {
    // 라우트 매칭
    const route = this.matchRoute(path);
    if (!route) {
      throw new Error(`Route not found: ${path}`);
    }

    // 컴포넌트 지연 로딩
    const { default: Component } = await lazyLoader.loadPageComponent(route.component);
    
    // 컴포넌트 렌더링
    this.renderComponent(Component, route.props);
  }

  matchRoute(path) {
    for (const [pattern, route] of this.routes) {
      if (pattern.test(path)) {
        return route;
      }
    }
    return null;
  }

  renderComponent(Component, props = {}) {
    const container = document.getElementById('app');
    container.innerHTML = '';
    
    const component = new Component(props);
    container.appendChild(component.render());
  }
}
```

### 2. 이미지 및 리소스 최적화

#### 2.1 이미지 지연 로딩
```javascript
// frontend/src/utils/imageOptimizer.js
export class ImageOptimizer {
  constructor() {
    this.observer = null;
    this.initIntersectionObserver();
  }

  initIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;

    // 이미지 로딩
    const imageLoader = new Image();
    imageLoader.onload = () => {
      img.src = src;
      img.classList.add('loaded');
    };
    imageLoader.onerror = () => {
      img.classList.add('error');
    };
    imageLoader.src = src;
  }

  observeImage(img) {
    this.observer.observe(img);
  }

  // WebP 지원 확인
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // 최적화된 이미지 URL 생성
  getOptimizedImageUrl(originalUrl, options = {}) {
    const {
      width = null,
      height = null,
      quality = 80,
      format = 'auto'
    } = options;

    const params = new URLSearchParams();
    
    if (width) params.set('w', width);
    if (height) params.set('h', height);
    if (quality) params.set('q', quality);
    
    if (format === 'auto') {
      params.set('f', this.supportsWebP() ? 'webp' : 'jpg');
    } else {
      params.set('f', format);
    }

    return `${originalUrl}?${params.toString()}`;
  }
}

export const imageOptimizer = new ImageOptimizer();

// 사용 예시
document.addEventListener('DOMContentLoaded', () => {
  const images = document.querySelectorAll('img[data-src]');
  images.forEach(img => imageOptimizer.observeImage(img));
});
```

#### 2.2 리소스 프리로딩
```javascript
// frontend/src/utils/resourcePreloader.js
export class ResourcePreloader {
  constructor() {
    this.preloadedResources = new Set();
    this.preloadQueue = [];
    this.isPreloading = false;
  }

  // 리소스 프리로딩
  async preloadResource(url, type = 'script') {
    if (this.preloadedResources.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const element = this.createPreloadElement(url, type);
      
      element.onload = () => {
        this.preloadedResources.add(url);
        resolve();
      };
      
      element.onerror = () => {
        reject(new Error(`Failed to preload: ${url}`));
      };

      document.head.appendChild(element);
    });
  }

  createPreloadElement(url, type) {
    const element = document.createElement('link');
    element.rel = 'preload';
    element.href = url;

    switch (type) {
      case 'script':
        element.as = 'script';
        break;
      case 'style':
        element.as = 'style';
        break;
      case 'font':
        element.as = 'font';
        element.crossOrigin = 'anonymous';
        break;
      case 'image':
        element.as = 'image';
        break;
      default:
        element.as = type;
    }

    return element;
  }

  // 페이지 리소스 프리로딩
  async preloadPageResources(pageName) {
    const resources = this.getPageResources(pageName);
    
    const preloadPromises = resources.map(({ url, type }) =>
      this.preloadResource(url, type)
    );

    try {
      await Promise.all(preloadPromises);
      console.log(`Preloaded resources for page: ${pageName}`);
    } catch (error) {
      console.warn('Some resources failed to preload:', error);
    }
  }

  getPageResources(pageName) {
    const resourceMap = {
      'chat': [
        { url: '/static/js/chat.js', type: 'script' },
        { url: '/static/css/chat.css', type: 'style' },
      ],
      'admin': [
        { url: '/static/js/admin.js', type: 'script' },
        { url: '/static/css/admin.css', type: 'style' },
      ],
    };

    return resourceMap[pageName] || [];
  }

  // 중요 리소스 우선 프리로딩
  async preloadCriticalResources() {
    const criticalResources = [
      { url: '/static/css/critical.css', type: 'style' },
      { url: '/static/js/main.js', type: 'script' },
    ];

    await Promise.all(
      criticalResources.map(({ url, type }) =>
        this.preloadResource(url, type)
      )
    );
  }
}

export const resourcePreloader = new ResourcePreloader();
```

### 3. 상태 관리 최적화

#### 3.1 효율적인 상태 관리
```javascript
// frontend/src/store/optimizedState.js
export class OptimizedStateManager {
  constructor() {
    this.state = new Map();
    this.listeners = new Map();
    this.mutations = new Map();
    this.actions = new Map();
    this.cache = new Map();
    
    // 상태 변경 배치 처리
    this.batchQueue = [];
    this.batchTimeout = null;
  }

  // 상태 설정 (배치 처리)
  setState(key, value, immediate = false) {
    if (immediate) {
      this._setStateImmediate(key, value);
    } else {
      this._queueStateUpdate(key, value);
    }
  }

  _queueStateUpdate(key, value) {
    this.batchQueue.push({ key, value });
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this._processBatch();
    }, 0);
  }

  _processBatch() {
    const updates = new Map();
    
    // 배치 업데이트 병합
    this.batchQueue.forEach(({ key, value }) => {
      updates.set(key, value);
    });
    
    // 상태 업데이트
    updates.forEach((value, key) => {
      this._setStateImmediate(key, value);
    });
    
    // 배치 큐 초기화
    this.batchQueue = [];
    this.batchTimeout = null;
  }

  _setStateImmediate(key, value) {
    const oldValue = this.state.get(key);
    
    // 값 변경 확인
    if (this._isEqual(oldValue, value)) {
      return;
    }
    
    this.state.set(key, value);
    
    // 리스너 호출
    const listeners = this.listeners.get(key) || [];
    listeners.forEach(callback => {
      try {
        callback(value, oldValue, key);
      } catch (error) {
        console.error(`State listener error for key "${key}":`, error);
      }
    });
  }

  // 상태 구독
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key).push(callback);
    
    // 즉시 현재 값 호출
    const currentValue = this.state.get(key);
    if (currentValue !== undefined) {
      callback(currentValue, undefined, key);
    }
    
    // 구독 해제 함수 반환
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // 깊은 값 비교
  _isEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    
    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) return false;
      
      if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        return a.every((val, index) => this._isEqual(val, b[index]));
      }
      
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      return keysA.every(key => this._isEqual(a[key], b[key]));
    }
    
    return false;
  }

  // 계산된 값 (캐싱)
  computed(key, computeFn, dependencies) {
    const cacheKey = `computed:${key}`;
    
    const compute = () => {
      const result = computeFn();
      this.cache.set(cacheKey, result);
      return result;
    };
    
    // 의존성 구독
    const unsubscribers = dependencies.map(depKey =>
      this.subscribe(depKey, () => {
        // 의존성 변경 시 캐시 무효화
        this.cache.delete(cacheKey);
      })
    );
    
    // 초기 계산
    return compute();
  }
}

export const optimizedState = new OptimizedStateManager();
```

---

## 📊 성능 모니터링 및 분석

### 1. 실시간 성능 모니터링
```javascript
// frontend/src/utils/performanceMonitor.js
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.reportQueue = [];
    this.reportInterval = 30000; // 30초마다 리포트
    
    this.initObservers();
    this.startReporting();
  }

  initObservers() {
    // Core Web Vitals 모니터링
    this.observeLCP(); // Largest Contentful Paint
    this.observeFID(); // First Input Delay
    this.observeCLS(); // Cumulative Layout Shift
    this.observeTTFB(); // Time to First Byte
  }

  observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      
      this.recordMetric('lcp', lastEntry.startTime);
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.set('lcp', observer);
  }

  observeFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.recordMetric('fid', entry.processingStart - entry.startTime);
      });
    });
    
    observer.observe({ entryTypes: ['first-input'] });
    this.observers.set('fid', observer);
  }

  observeCLS() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      this.recordMetric('cls', clsValue);
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('cls', observer);
  }

  observeTTFB() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.responseStart > 0) {
          this.recordMetric('ttfb', entry.responseStart - entry.requestStart);
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation'] });
    this.observers.set('ttfb', observer);
  }

  recordMetric(name, value) {
    const timestamp = Date.now();
    const metric = { name, value, timestamp };
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push(metric);
    
    // 큐에 추가
    this.reportQueue.push(metric);
  }

  // 커스텀 메트릭 기록
  measureCustom(name, startTime, endTime) {
    const duration = endTime - startTime;
    this.recordMetric(name, duration);
  }

  // API 응답 시간 측정
  measureApiCall(url, startTime, endTime) {
    const duration = endTime - startTime;
    this.recordMetric(`api:${url}`, duration);
  }

  // 페이지 로딩 시간 측정
  measurePageLoad(pageName, startTime, endTime) {
    const duration = endTime - startTime;
    this.recordMetric(`page:${pageName}`, duration);
  }

  startReporting() {
    setInterval(() => {
      this.reportMetrics();
    }, this.reportInterval);
  }

  async reportMetrics() {
    if (this.reportQueue.length === 0) return;

    const metrics = [...this.reportQueue];
    this.reportQueue = [];

    try {
      await fetch('/api/v1/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.warn('Failed to report metrics:', error);
      // 실패한 메트릭을 다시 큐에 추가
      this.reportQueue.unshift(...metrics);
    }
  }

  // 성능 리포트 생성
  generateReport() {
    const report = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: {},
      summary: {},
    };

    // 메트릭 집계
    this.metrics.forEach((values, name) => {
      const sorted = values.sort((a, b) => a.value - b.value);
      const count = sorted.length;
      
      report.metrics[name] = {
        count,
        min: sorted[0]?.value || 0,
        max: sorted[count - 1]?.value || 0,
        avg: values.reduce((sum, m) => sum + m.value, 0) / count,
        p50: this.percentile(sorted, 0.5),
        p95: this.percentile(sorted, 0.95),
        p99: this.percentile(sorted, 0.99),
      };
    });

    // 요약 생성
    report.summary = {
      lcp: report.metrics.lcp?.avg || 0,
      fid: report.metrics.fid?.avg || 0,
      cls: report.metrics.cls?.avg || 0,
      ttfb: report.metrics.ttfb?.avg || 0,
    };

    return report;
  }

  percentile(sorted, p) {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index]?.value || 0;
  }

  // 성능 힌트 제공
  getPerformanceHints() {
    const hints = [];
    const metrics = this.generateReport().metrics;

    if (metrics.lcp?.avg > 2500) {
      hints.push('LCP가 2.5초를 초과합니다. 이미지 최적화를 고려하세요.');
    }

    if (metrics.fid?.avg > 100) {
      hints.push('FID가 100ms를 초과합니다. JavaScript 최적화가 필요합니다.');
    }

    if (metrics.cls?.avg > 0.1) {
      hints.push('CLS가 0.1을 초과합니다. 레이아웃 시프트를 줄이세요.');
    }

    return hints;
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### 2. 백엔드 성능 모니터링
```python
# backend/app/monitoring/performance.py
import time
import psutil
import threading
from functools import wraps
from collections import defaultdict, deque
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Prometheus 메트릭
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('http_request_duration_seconds', 'HTTP request duration', ['method', 'endpoint'])
ACTIVE_CONNECTIONS = Gauge('http_active_connections', 'Active HTTP connections')
MEMORY_USAGE = Gauge('memory_usage_bytes', 'Memory usage in bytes')
CPU_USAGE = Gauge('cpu_usage_percent', 'CPU usage percentage')

class PerformanceMonitor:
    def __init__(self):
        self.request_times = deque(maxlen=1000)
        self.error_count = defaultdict(int)
        self.active_requests = 0
        self.monitoring_thread = None
        self.start_monitoring()
    
    def start_monitoring(self):
        """시스템 모니터링 시작"""
        self.monitoring_thread = threading.Thread(target=self._monitor_system, daemon=True)
        self.monitoring_thread.start()
    
    def _monitor_system(self):
        """시스템 리소스 모니터링"""
        while True:
            try:
                # 메모리 사용량
                memory = psutil.virtual_memory()
                MEMORY_USAGE.set(memory.used)
                
                # CPU 사용률
                cpu_percent = psutil.cpu_percent()
                CPU_USAGE.set(cpu_percent)
                
                time.sleep(10)  # 10초마다 업데이트
            except Exception as e:
                print(f"Monitoring error: {e}")
                time.sleep(30)
    
    def record_request(self, method, endpoint, status_code, duration):
        """요청 기록"""
        REQUEST_COUNT.labels(method=method, endpoint=endpoint, status=status_code).inc()
        REQUEST_DURATION.labels(method=method, endpoint=endpoint).observe(duration)
        
        self.request_times.append(duration)
        
        if status_code >= 400:
            self.error_count[f"{method} {endpoint}"] += 1
    
    def get_metrics(self):
        """성능 메트릭 반환"""
        recent_times = list(self.request_times)[-100:]  # 최근 100개 요청
        
        if not recent_times:
            return {}
        
        recent_times.sort()
        n = len(recent_times)
        
        return {
            'request_count': len(self.request_times),
            'active_requests': self.active_requests,
            'error_count': dict(self.error_count),
            'response_time': {
                'min': recent_times[0],
                'max': recent_times[-1],
                'avg': sum(recent_times) / n,
                'p50': recent_times[int(n * 0.5)],
                'p95': recent_times[int(n * 0.95)],
                'p99': recent_times[int(n * 0.99)],
            }
        }

# 전역 모니터 인스턴스
performance_monitor = PerformanceMonitor()

def monitor_performance(f):
    """성능 모니터링 데코레이터"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        performance_monitor.active_requests += 1
        
        try:
            result = f(*args, **kwargs)
            status_code = 200
            return result
        except Exception as e:
            status_code = 500
            raise
        finally:
            duration = time.time() - start_time
            performance_monitor.active_requests -= 1
            
            # Flask request 객체에서 정보 추출
            from flask import request
            method = request.method
            endpoint = request.endpoint or 'unknown'
            
            performance_monitor.record_request(method, endpoint, status_code, duration)
    
    return decorated_function

# 사용 예시
@api_bp.route('/metrics', methods=['GET'])
def get_prometheus_metrics():
    """Prometheus 메트릭 엔드포인트"""
    return generate_latest(), 200, {'Content-Type': 'text/plain'}

@api_bp.route('/performance', methods=['GET'])
@monitor_performance
def get_performance_metrics():
    """성능 메트릭 API"""
    return jsonify(performance_monitor.get_metrics())
```

---

## 📅 성능 최적화 구현 일정

### Week 1: 백엔드 최적화
- **Day 1**: Gunicorn 설정 최적화, 캐싱 시스템 구현
- **Day 2**: 데이터베이스 쿼리 최적화, 인덱싱 개선
- **Day 3**: API 응답 캐싱, Redis 통합
- **Day 4**: 비동기 처리 구현, 스레드 풀 최적화
- **Day 5**: 메모리 사용량 최적화, 가비지 컬렉션 튜닝

### Week 2: 프론트엔드 최적화
- **Day 1**: Webpack 번들 최적화, 코드 분할
- **Day 2**: 이미지 최적화, 지연 로딩 구현
- **Day 3**: 상태 관리 최적화, 불필요한 렌더링 방지
- **Day 4**: 리소스 프리로딩, 캐싱 전략
- **Day 5**: 성능 모니터링 구현, 실시간 메트릭

### Week 3: 통합 최적화 및 테스트
- **Day 1**: 전체 시스템 성능 테스트
- **Day 2**: 병목 지점 식별 및 해결
- **Day 3**: 로드 테스트 및 스케일링 테스트
- **Day 4**: 성능 모니터링 대시보드 구축
- **Day 5**: 최종 성능 검증 및 문서화

---

## 🎯 성공 지표

### 응답 속도 목표
- ✅ **API 응답**: < 200ms (평균), < 500ms (95th percentile)
- ✅ **페이지 로딩**: < 1초 (초기), < 500ms (SPA 네비게이션)
- ✅ **AI 응답**: < 2초 (스트리밍 시작), < 5초 (완전 응답)
- ✅ **검색 성능**: < 100ms (RAG 검색)

### 처리량 목표
- ✅ **동시 사용자**: 1000명 → 10000명
- ✅ **요청 처리량**: 100 req/s → 1000 req/s
- ✅ **메모리 효율**: 50% 감소
- ✅ **CPU 효율**: 30% 개선

### 사용자 경험 목표
- ✅ **Core Web Vitals**: 모든 지표 "Good" 등급
- ✅ **캐시 히트율**: > 80%
- ✅ **번들 크기**: < 500KB (초기 로딩)
- ✅ **이미지 최적화**: WebP 지원, 지연 로딩

---

**마지막 업데이트**: 2025-10-17  
**버전**: 1.0.0  
**상태**: 📋 계획 완료, 🚀 구현 준비
