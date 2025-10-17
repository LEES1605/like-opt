# 🚀 Like-Opt 빠른 시작 가이드

## 📋 **프로젝트 개요**

**Like-Opt**는 Professor G를 활용한 최적화된 영어 학습 플랫폼입니다.
기존 MAIC-Flask를 완전히 새로 구현한 최적화된 버전입니다.

## 🛠️ **개발 환경 설정**

### **1. 백엔드 실행**
```bash
cd C:\like-opt\backend
pip install -r requirements.txt
python run.py
```

### **2. 프론트엔드 실행** (선택사항)
```bash
cd C:\like-opt\frontend
npm install
npm run dev
```

## 🌐 **서버 접속**

- **백엔드**: http://localhost:5001
- **프론트엔드**: http://localhost:3000
- **테스트 페이지**: http://localhost:5001/medal-demo

## ⚙️ **환경 설정**

### **.env 파일 설정**
```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=like-opt-secret-key-2024

# Server Configuration
HOST=127.0.0.1
PORT=5001

# AI API Keys
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key

# Admin Configuration
ADMIN_PASSWORD=1234
```

## 🎯 **주요 기능**

- ✅ **AI 채팅**: OpenAI GPT-4o-mini 통합
- ✅ **RAG 검색**: 하이브리드 검색 (BM25 + Vector)
- ✅ **관리자 패널**: 실시간 모니터링
- ✅ **메달 시스템**: 게임화 요소
- ✅ **반응형 UI**: Neumorphism 디자인

## 📁 **프로젝트 구조**

```
like-opt/
├── backend/                 # Flask API 서버
├── frontend/               # React/Vue 프론트엔드
├── shared/                 # 공통 타입 정의
├── docs/                   # 문서화
└── scripts/                # 배포/개발 스크립트
```

## 🔧 **문제 해결**

### **서버가 시작되지 않는 경우**
1. Python 프로세스 종료: `taskkill /F /IM python.exe`
2. 포트 확인: `netstat -an | findstr 5001`
3. 의존성 재설치: `pip install -r requirements.txt`

### **프론트엔드 문제**
1. Node.js 버전 확인: `node --version` (18+ 필요)
2. 캐시 삭제: `npm cache clean --force`
3. 의존성 재설치: `rm -rf node_modules && npm install`

## 📞 **도움말**

- **문서**: `docs/` 폴더 참조
- **설정**: `.env` 파일 확인
- **로그**: `logs/like.log` 파일 확인

---

*Like-Opt 개발팀 | 2024*
