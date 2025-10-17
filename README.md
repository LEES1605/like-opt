# Like-Opt

## 🤖 AI-Powered English Learning Platform

**Like-Opt**는 Professor G를 활용한 최적화된 영어 학습 플랫폼입니다.

### ✨ 주요 기능

- 🎯 **AI 영어 선생님**: Professor G와의 실시간 대화
- 📚 **다양한 학습 모드**: 문법, 문장분석, 지문설명
- 🔍 **RAG 검색**: 지능형 검색으로 정확한 답변
- ⚙️ **관리자 대시보드**: 실시간 모니터링 및 설정
- 🎨 **현대적 UI**: 반응형 웹 디자인

### 🏗️ 프로젝트 구조

```
like-opt/
├── backend/                 # Flask API 서버
│   ├── app/
│   │   ├── api/            # API 엔드포인트
│   │   ├── models/         # 데이터 모델
│   │   ├── services/       # 비즈니스 로직
│   │   └── utils/          # 유틸리티 함수
│   ├── requirements.txt
│   └── run.py
├── frontend/               # 프론트엔드 (선택사항)
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   ├── pages/          # 페이지
│   │   └── services/       # API 서비스
│   └── package.json
├── shared/                 # 공통 타입 정의
├── docs/                   # 문서화
├── scripts/                # 배포/개발 스크립트
└── .github/                # GitHub Actions
```

### 🚀 빠른 시작

#### 백엔드 실행
```bash
cd backend
pip install -r requirements.txt
python run.py
```

#### 프론트엔드 실행 (선택사항)
```bash
cd frontend
npm install
npm start
```

### 🛠️ 기술 스택

- **Backend**: Python, Flask, SQLAlchemy
- **AI**: OpenAI GPT-4o-mini, Google Gemini
- **Search**: RAG (BM25 + Vector Search)
- **Database**: ChromaDB, SQLite
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)

### 📋 개발 로드맵

- [x] 프로젝트 구조 설정
- [ ] 백엔드 API 개발
- [ ] 프론트엔드 컴포넌트화
- [ ] AI 통합 및 최적화
- [ ] 관리자 대시보드
- [ ] 테스트 및 배포

### 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

### 📞 연락처

프로젝트 링크: [https://github.com/your-username/like-opt](https://github.com/your-username/like-opt)
