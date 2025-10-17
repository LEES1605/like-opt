# 🔄 Cursor 재시작 가이드 - Like-Opt 프로젝트

## 🎯 **재시작 시 확인사항**

### **1. 작업 디렉토리**
- ✅ **새 작업 디렉토리**: `C:\like-opt`
- ❌ **이전 디렉토리**: `C:\maic-flask-opt` (더 이상 사용 안함)

### **2. 프로젝트 상태**
- ✅ **리포지토리 이름**: `like-opt`
- ✅ **포트**: 5001 (백엔드), 3000 (프론트엔드)
- ✅ **데이터베이스**: `like.db`
- ✅ **환경 설정**: `.env` 파일 준비됨

---

## 🚀 **Cursor 재시작 후 첫 작업**

### **1. 프로젝트 열기**
```
File → Open Folder → C:\like-opt
```

### **2. 터미널에서 확인**
```bash
# 현재 디렉토리 확인
pwd

# 프로젝트 구조 확인
ls -la

# 백엔드 테스트
cd backend
python -c "from app import create_app; app = create_app(); print('✅ App created successfully')"
```

### **3. 서버 실행**
```bash
cd backend
python run.py
```

### **4. 접속 확인**
- http://localhost:5001
- http://localhost:5001/medal-demo

---

## 📋 **현재 진행 상황**

### **✅ 완료된 작업**
- [x] 리포지토리 이름 변경 (`maic-flask-opt` → `like-opt`)
- [x] 모든 설정 파일 업데이트
- [x] 문서 업데이트
- [x] 코드 참조 변경
- [x] Flask 앱 테스트 완료

### **🔄 진행 중인 작업**
- [ ] 프론트엔드 UI 완성
- [ ] API 통합 테스트
- [ ] 전체 시스템 검증

### **⏳ 대기 중인 작업**
- [ ] 성능 최적화
- [ ] 사용자 가이드 작성
- [ ] 프로덕션 배포

---

## 🛠️ **개발 환경 설정**

### **백엔드**
```bash
cd C:\like-opt\backend
pip install -r requirements.txt
python run.py
```

### **프론트엔드**
```bash
cd C:\like-opt\frontend
npm install
npm run dev
```

---

## 📁 **주요 파일 위치**

| 파일 | 경로 | 설명 |
|------|------|------|
| **메인 앱** | `backend/run.py` | Flask 서버 진입점 |
| **설정** | `backend/app/config.py` | 환경별 설정 |
| **환경변수** | `.env` | API 키 및 설정 |
| **문서** | `docs/` | 프로젝트 문서 |
| **프론트엔드** | `frontend/src/` | UI 컴포넌트 |

---

## 🔧 **문제 해결**

### **서버 시작 안됨**
```bash
# Python 프로세스 종료
taskkill /F /IM python.exe

# 포트 확인
netstat -an | findstr 5001

# 의존성 재설치
pip install -r requirements.txt
```

### **환경변수 문제**
```bash
# .env 파일 확인
type .env

# 환경변수 로드 확인
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('OPENAI_API_KEY:', bool(os.getenv('OPENAI_API_KEY')))"
```

---

## 📞 **도움말**

- **상세 문서**: `WORK_SESSION_SUMMARY.md`
- **빠른 시작**: `docs/development/quick-start.md`
- **API 문서**: `docs/api/`
- **프론트엔드**: `docs/development/frontend-implementation.md`

---

## 🎯 **다음 작업 목표**

1. **프론트엔드 완성**: Medal 시스템 UI 완성
2. **API 통합**: 백엔드-프론트엔드 연결
3. **테스트**: 전체 시스템 검증
4. **성능 최적화**: 응답 속도 개선

---

*Cursor 재시작 후 이 가이드를 참조하여 작업을 계속하세요!*
*작업 디렉토리: `C:\like-opt`*
