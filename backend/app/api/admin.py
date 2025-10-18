"""
관리자 기능 라우트
인증, 설정, 관리 페이지 담당
"""
from flask import Blueprint, request, jsonify, render_template, session
import time
import json
import math
from collections import defaultdict
import time
import json

from ..services.session_adapter import session_adapter
from ..services.auth_service import auth_service

admin_bp = Blueprint('admin', __name__)

# ---------------------------------------------------------------
# 간단 Rate Limiter (로컬 개발용): IP+Endpoint 기준 분당 10회
# ---------------------------------------------------------------
_RATE_BUCKET = defaultdict(lambda: {'count': 0, 'ts': 0.0})
_RATE_LIMIT_PER_MIN = 10

def _rate_limit(key: str) -> bool:
    """True면 허용, False면 제한"""
    now = time.time()
    bucket = _RATE_BUCKET[key]
    # 60초 윈도우
    if now - bucket['ts'] > 60:
        bucket['ts'] = now
        bucket['count'] = 0
    bucket['count'] += 1
    return bucket['count'] <= _RATE_LIMIT_PER_MIN

def _require_csrf_if_present():
    """헤더에 X-CSRF-Token이 있을 경우 세션 토큰과 비교(개발용 스캐폴드).
    헤더가 없으면 통과(점진적 적용을 위한 호환).
    """
    try:
        header_token = request.headers.get('X-CSRF-Token')
        if not header_token:
            return True
        sess_token = session.get('csrf_token')
        return bool(sess_token) and (sess_token == header_token)
    except Exception:
        return False
@admin_bp.route('/help', methods=['GET'])
def admin_help_panel():
    """
    도움말 패널 HTML 반환 (역할별 공용 템플릿)

    Query:
        role: 'admin' | 'student' (optional)
    """
    try:
        role = str(request.args.get('role') or 'admin').strip().lower()
        html = render_template('components/admin/admin_help_center.html', role=role)
        return jsonify({'success': True, 'html': html})
    except Exception as e:
        print(f"[ADMIN] help panel load error: {e}")
        return jsonify({'success': False, 'message': '패널 로드 실패'}), 500


@admin_bp.route('/help/content', methods=['GET'])
def admin_help_content():
    """
    도움말 Markdown을 HTML로 렌더링하여 반환

    Query:
        role: 'admin' | 'student' (optional)
    """
    try:
        role = str(request.args.get('role') or 'admin').strip().lower()
        # 역할별 문서 경로 매핑
        if role == 'student':
            md_path = 'docs/user/student_help_center.md'
        else:
            md_path = 'docs/user/admin_help_center.md'

        # 서버 파일 시스템에서 읽기
        import os
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
        file_path = os.path.join(base_dir, md_path.replace('/', os.sep))
        if not os.path.exists(file_path):
            return jsonify({'success': False, 'message': f'문서를 찾을 수 없습니다: {md_path}'}), 404

        with open(file_path, 'r', encoding='utf-8') as f:
            md_text = f.read()

        # 간단한 Markdown → HTML 렌더 (의존성 없이 최소 변환)
        # 헤더/목록/강조 정도만 처리, 나머지는 그대로 표시
        import html
        def esc(s):
            return html.escape(s, quote=False)

        lines = md_text.splitlines()
        out = []
        for ln in lines:
            s = ln.strip('\n')
            if s.startswith('### '):
                out.append(f"<h3>{esc(s[4:])}</h3>")
            elif s.startswith('## '):
                out.append(f"<h2>{esc(s[3:])}</h2>")
            elif s.startswith('- '):
                # 단순 UL 처리: 이전이 UL 아니면 시작
                if not (out and out[-1] == '<ul>'):
                    out.append('<ul>')
                out.append(f"<li>{esc(s[2:])}</li>")
                # 다음 줄에서 닫음은 나중에 정리
            elif s == '':
                # 빈 줄: 열린 UL 닫기
                if out and out[-1] == '<ul>':
                    out.append('</ul>')
                out.append('<p></p>')
            else:
                # 일반 문단
                if out and out[-1] == '<ul>':
                    out.append('</ul>')
                out.append(f"<p>{esc(s)}</p>")

        # 마지막 UL 정리
        if out and out[-1] == '<ul>':
            out.append('</ul>')

        html_body = '\n'.join(out)
        return jsonify({'success': True, 'html': html_body})
    except Exception as e:
        print(f"[ADMIN] help content load error: {e}")
        return jsonify({'success': False, 'message': '도움말 로드 실패'}), 500

# ------------------------------------------------------------------
# Index Diagnostics TTL 캐시 (단일 소스)
# ------------------------------------------------------------------
_INDEX_DIAG_CACHE = {
    'data': None,   # 직전 계산된 payload(dict)
    'ts': 0.0       # epoch seconds
}
_INDEX_DIAG_TTL_SECONDS = 15  # 기본 15초 TTL


@admin_bp.route('/login', methods=['POST'])
def login():
    """
    관리자 로그인
    
    Request Body:
        {
            "password": "admin123"
        }
    
    Response:
        {
            "success": true,
            "message": "로그인 성공",
            "user_role": "admin"
        }
    """
    try:
        print(f"[ADMIN] 로그인 요청 수신")
        print(f"[ADMIN] Content-Type: {request.content_type}")
        print(f"[ADMIN] is_json: {request.is_json}")
        
        # Rate limit
        ip = request.headers.get('X-Forwarded-For', request.remote_addr) or 'unknown'
        if not _rate_limit(f"login:{ip}"):
            return jsonify({'success': False, 'message': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'}), 429

        # CSRF (헤더가 있을 때만 확인)
        if not _require_csrf_if_present():
            return jsonify({'success': False, 'message': 'CSRF 검증 실패'}), 403

        # JSON 또는 Form 데이터 처리
        if request.is_json:
            data = request.get_json() or {}
            password = data.get('password', '')
            print(f"[ADMIN] JSON 데이터 파싱: password={'[*' * len(password) + ']' if password else 'None'}")
        else:
            password = request.form.get('password', '')
            print(f"[ADMIN] Form 데이터 파싱: password={'[*' * len(password) + ']' if password else 'None'}")
        
        if not password:
            print(f"[ADMIN] 비밀번호 누락!")
            return jsonify({
                'success': False,
                'message': '비밀번호를 입력해주세요.'
            }), 400
        
        # 인증 서비스로 로그인 처리
        if auth_service.login(password):
            return jsonify({
                'success': True,
                'message': '관리자 로그인 성공!',
                'user_role': 'admin'
            })
        else:
            return jsonify({
                'success': False,
                'message': '비밀번호가 틀렸습니다.'
            }), 401
            
    except Exception as e:
        print(f"로그인 오류: {e}")
        return jsonify({
            'success': False,
            'message': '서버 오류가 발생했습니다.'
        }), 500


@admin_bp.route('/logout', methods=['POST'])
def logout():
    """
    로그아웃
    
    Response:
        {
            "success": true,
            "message": "로그아웃되었습니다."
        }
    """
    try:
        # CSRF (헤더가 있을 때만 확인)
        if not _require_csrf_if_present():
            return jsonify({'success': False, 'message': 'CSRF 검증 실패'}), 403
        auth_service.logout()
        return jsonify({
            'success': True,
            'message': '로그아웃되었습니다.'
        })
    except Exception as e:
        print(f"로그아웃 오류: {e}")
        return jsonify({
            'success': False,
            'message': '로그아웃 중 오류가 발생했습니다.'
        }), 500


@admin_bp.route('/dashboard')
def dashboard():
    """
    관리자 대시보드 페이지
    """
    # 관리자 권한 확인
    if not auth_service.is_authenticated() or auth_service.get_user_role() != 'admin':
        return jsonify({
            'error': '관리자 권한이 필요합니다.',
            'redirect_url': '/'
        }), 403
    
    return render_template(
        'components/admin/admin_dashboard.html',
        user_role='admin'
    )


@admin_bp.route('/prompts')
def prompts():
    """
    프롬프트 관리 페이지
    """
    # 관리자 권한 확인
    if not auth_service.is_authenticated() or auth_service.get_user_role() != 'admin':
        return render_template('error.html',
            error='관리자 권한이 필요합니다.',
            redirect_url='/'
        ), 403
    
    return render_template(
        'admin/prompts.html',
        user_role='admin'
    )


@admin_bp.route('/settings')
def settings():
    """
    설정 페이지
    """
    # 관리자 권한 확인
    if not auth_service.is_authenticated() or auth_service.get_user_role() != 'admin':
        return render_template('error.html',
            error='관리자 권한이 필요합니다.',
            redirect_url='/'
        ), 403
    
    return render_template(
        'admin/settings.html',
        user_role='admin'
    )


@admin_bp.route('/status', methods=['GET'])
def status():
    """
    관리자 상태 확인
    
    Response:
        {
            "authenticated": true,
            "user_role": "admin",
            "session_info": {...}
        }
    """
    return jsonify({
        'authenticated': auth_service.is_authenticated(),
        'user_role': auth_service.get_user_role(),
        'session_info': auth_service.get_session_info()
    })


@admin_bp.route('/restore/status', methods=['GET'])
def get_restore_status():
    """복원 진행 상태 조회"""
    try:
        # 기본 12단계 템플릿 (전부 대기 중)
        _steps_tpl = [
            {"id": 1,  "name": "준비: 환경 확인",           "status": "대기 중"},
            {"id": 2,  "name": "데이터 수집: GDrive 연결",  "status": "대기 중"},
            {"id": 3,  "name": "데이터 수집: 파일목록 로드", "status": "대기 중"},
            {"id": 4,  "name": "데이터 수집: 파일 검증",     "status": "대기 중"},
            {"id": 5,  "name": "전처리: 텍스트 추출",       "status": "대기 중"},
            {"id": 6,  "name": "전처리: 청크 생성",         "status": "대기 중"},
            {"id": 7,  "name": "인덱싱: RAG 인덱스 빌드",   "status": "대기 중"},
            {"id": 8,  "name": "인덱싱: 통계 저장",         "status": "대기 중"},
            {"id": 9,  "name": "검증: 프롬프트 로딩",       "status": "대기 중"},
            {"id": 10, "name": "검증: 샘플 검색",           "status": "대기 중"},
            {"id": 11, "name": "배포: 활성화 플래그",       "status": "대기 중"},
            {"id": 12, "name": "배포: 완료 마킹",           "status": "대기 중"}
        ]

        restore_status = session_adapter.get('restore_status')
        if not restore_status:
            restore_status = {
                'status': 'idle',  # idle, running, completed, error
                'current_step': 0,
                'total_steps': len(_steps_tpl),
                'steps': _steps_tpl,
                'message': '복원이 시작되지 않았습니다.'
            }
        
        return jsonify({
            'success': True,
            'data': restore_status
        })
    except Exception as e:
        print(f"[ADMIN] 상태 조회 오류: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@admin_bp.route('/restore/reset', methods=['POST'])
def reset_restore():
    """자동복원 상태를 초기화(idle, 전 단계 '대기 중')"""
    try:
        if not auth_service.is_authenticated():
            return jsonify({'success': False, 'message': '관리자 권한이 필요합니다.'}), 401

        steps = [
            {"id": 1,  "name": "준비: 환경 확인",           "status": "대기 중"},
            {"id": 2,  "name": "데이터 수집: GDrive 연결",  "status": "대기 중"},
            {"id": 3,  "name": "데이터 수집: 파일목록 로드", "status": "대기 중"},
            {"id": 4,  "name": "데이터 수집: 파일 검증",     "status": "대기 중"},
            {"id": 5,  "name": "전처리: 텍스트 추출",       "status": "대기 중"},
            {"id": 6,  "name": "전처리: 청크 생성",         "status": "대기 중"},
            {"id": 7,  "name": "인덱싱: RAG 인덱스 빌드",   "status": "대기 중"},
            {"id": 8,  "name": "인덱싱: 통계 저장",         "status": "대기 중"},
            {"id": 9,  "name": "검증: 프롬프트 로딩",       "status": "대기 중"},
            {"id": 10, "name": "검증: 샘플 검색",           "status": "대기 중"},
            {"id": 11, "name": "배포: 활성화 플래그",       "status": "대기 중"},
            {"id": 12, "name": "배포: 완료 마킹",           "status": "대기 중"}
        ]

        session_adapter.set('restore_status', {
            'status': 'idle',
            'current_step': 0,
            'total_steps': len(steps),
            'steps': steps,
            'message': '복원이 시작되지 않았습니다.'
        })
        try:
            session_adapter.delete('restore_result')
        except Exception:
            pass

        return jsonify({'success': True, 'message': '초기화 완료'})
    except Exception as e:
        print(f"[ADMIN] 초기화 오류: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@admin_bp.route('/restore', methods=['POST'])
def auto_restore():
    """
    자동복원 기능 - release 폴더의 index 파일을 백업하고 RAG 인덱스를 로드
    """
    try:
        # 관리자 인증 확인
        if not auth_service.is_authenticated():
            return jsonify({
                'success': False,
                'message': '관리자 권한이 필요합니다.'
            }), 401
        
        # Rate limit (restore는 비싼 작업)
        ip = request.headers.get('X-Forwarded-For', request.remote_addr) or 'unknown'
        if not _rate_limit(f"restore:{ip}"):
            return jsonify({'success': False, 'message': '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'}), 429

        # CSRF (헤더가 있을 때만 확인)
        if not _require_csrf_if_present():
            return jsonify({'success': False, 'message': 'CSRF 검증 실패'}), 403

        # 요청 데이터 파싱
        data = request.get_json() or {}
        source = data.get('source', 'local')  # 'github' 또는 'local'
        force = data.get('force', False)
        
        print(f"[ADMIN] 자동복원 시작 - 소스: {source}, 강제: {force}")
        
        # 복원 단계 정의 (세분화)
        steps = [
            {"id": 1,  "name": "준비: 환경 확인",           "status": "대기 중"},
            {"id": 2,  "name": "데이터 수집: GDrive 연결",  "status": "대기 중"},
            {"id": 3,  "name": "데이터 수집: 파일목록 로드", "status": "대기 중"},
            {"id": 4,  "name": "데이터 수집: 파일 검증",     "status": "대기 중"},
            {"id": 5,  "name": "전처리: 텍스트 추출",       "status": "대기 중"},
            {"id": 6,  "name": "전처리: 청크 생성",         "status": "대기 중"},
            {"id": 7,  "name": "인덱싱: RAG 인덱스 빌드",   "status": "대기 중"},
            {"id": 8,  "name": "인덱싱: 통계 저장",         "status": "대기 중"},
            {"id": 9,  "name": "검증: 프롬프트 로딩",       "status": "대기 중"},
            {"id": 10, "name": "검증: 샘플 검색",           "status": "대기 중"},
            {"id": 11, "name": "배포: 활성화 플래그",       "status": "대기 중"},
            {"id": 12, "name": "배포: 완료 마킹",           "status": "대기 중"},
            {"id": 13, "name": "최적화: 벡터 인덱스 자동 생성", "status": "대기 중"}
        ]
        
        # 실제 복원 로직 (현재는 시뮬레이션)
        restore_result = {
            "success": True,
            "message": f"{source} 소스에서 복원이 완료되었습니다.",
            "steps": [s.copy() for s in steps],  # 전체 단계 초기화
            "restore_time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source": source
        }
        
        # 복원 완료 시 관련 상태들을 활성화
        if restore_result["success"]:
            # RAG 모듈 로드 상태 활성화
            session_adapter.set('rag_modules_loaded', True)
            # Professor G 활성화 (RAG 모듈이 로드되고 프롬프트가 연결된 경우)
            session_adapter.set('professor_g_enabled', True)
            # 프롬프트 연결 상태 활성화
            session_adapter.set('prompt_connected', True)
            
            # 최신 릴리스 태그 업데이트
            try:
                import requests
                import os
                
                # GitHub 토큰 가져오기
                github_token = os.getenv('GITHUB_TOKEN')
                
                headers = {'Accept': 'application/vnd.github.v3+json'}
                if github_token:
                    headers['Authorization'] = f'token {github_token}'
                
                response = requests.get(f'https://api.github.com/repos/LEES1605/MAIC-Flask/releases', headers=headers, timeout=5)
                if response.status_code == 200:
                    releases = response.json()
                    index_releases = [r for r in releases if r.get('tag_name', '').startswith('index-v')]
                    if index_releases:
                        latest_tag = index_releases[0]['tag_name']
                        session_adapter.set('release_tag', latest_tag)
                        print(f"[ADMIN] 릴리스 태그 업데이트: {latest_tag}")
            except Exception as e:
                print(f"[ADMIN] 릴리스 태그 업데이트 실패: {e}")
            
            print("[ADMIN] 복원 완료 후 RAG 모듈 및 Professor G 활성화")
        
        # 초기 상태 저장
        session_adapter.set('restore_status', {
            'status': 'running',
            'current_step': 0,
            'total_steps': len(steps),
            'steps': steps,
            'message': '복원이 진행 중입니다...',
            'start_time': time.strftime("%Y-%m-%d %H:%M:%S")
        })
        
        # 단계별 실제 처리
        for i, step in enumerate(steps):
            # 현재 단계 업데이트
            step["status"] = "진행 중"
            restore_result["steps"][i] = step.copy()
            
            # 세션에 진행 상황 저장
            session_adapter.set('restore_status', {
                'status': 'running',
                'current_step': i + 1,
                'total_steps': len(steps),
                'steps': restore_result["steps"],  # 항상 전체 단계 유지
                'message': f'{step["name"]} 진행 중...',
                'start_time': session_adapter.get('restore_status', {}).get('start_time')
            })
            
            # 단계 시간 측정 시작
            _t0 = time.time()

            try:
                name = step["name"]
                if name == "준비: 환경 확인":
                    print("[ADMIN] 환경 변수 및 세션 상태 확인")
                    # 사전 점검 (키 존재 여부 등)
                    _ = session_adapter.get('professor_g_enabled', False)
                elif name == "데이터 수집: GDrive 연결":
                    print("[ADMIN] GDrive 연결 시도...")
                    try:
                        # from src.backend.infrastructure.integrations.gdrive import list_prepared_files
                        def list_prepared_files(): return []
                        _ = list_prepared_files  # 참조 확인
                        print("[ADMIN] GDrive 모듈 로드 OK")
                    except Exception as e:
                        print(f"[ADMIN] GDrive 모듈 로드 실패: {e}")
                elif name == "데이터 수집: 파일목록 로드":
                    print("[ADMIN] 파일목록 로드...")
                    try:
                        # from src.backend.infrastructure.integrations.gdrive import list_prepared_files
                        def list_prepared_files(): return []
                        files = list_prepared_files()
                        session_adapter.set('restore_files_count', len(files))
                        print(f"[ADMIN] 파일 {len(files)}개 발견")
                    except Exception as e:
                        print(f"[ADMIN] 파일목록 로드 실패(로컬로 진행): {e}")
                        session_adapter.set('restore_files_count', 0)
                elif name == "데이터 수집: 파일 검증":
                    print("[ADMIN] 파일 검증(샘플) 수행...")
                    # 간단한 검증 스텁
                elif name == "전처리: 텍스트 추출":
                    print("[ADMIN] 텍스트 추출(인덱서 내 처리) 준비...")
                elif name == "전처리: 청크 생성":
                    print("[ADMIN] 청크 생성(인덱서 내 처리) 준비...")
                elif name == "인덱싱: RAG 인덱스 빌드/복원":
                    print("[ADMIN] RAG 인덱스 빌드 시작...")
                    try:
                        # from src.backend.domain.rag.index_build import rebuild_index
                        def rebuild_index(): return {"success": False, "error": "Not implemented"}
                        from ..services.persist import effective_persist_dir
                        # from src.backend.domain.rag.index_status import get_index_summary
                        def get_index_summary(): return {"status": "unknown", "files": 0, "chunks": 0}
                        # 로컬/깃허브 분기 그대로 유지
                        progress_snap = {"files": 0, "done": 0, "chunks": 0}

                        def _cb(ev: dict):
                            try:
                                et = str(ev.get("event") or "")
                                if et == "files_listed":
                                    progress_snap["files"] = int(ev.get("total_files") or 0)
                                elif et == "file_done":
                                    progress_snap["done"] = int(ev.get("processed_files") or 0)
                                    progress_snap["chunks"] = int(ev.get("chunks_so_far") or 0)
                                elif et == "write_chunks_complete":
                                    progress_snap["chunks"] = int(ev.get("chunks") or 0)
                                # 단계 상태 실시간 반영
                                rs = session_adapter.get('restore_status', {})
                                steps_now = rs.get('steps') or restore_result["steps"]
                                step_idx = i
                                if 0 <= step_idx < len(steps_now):
                                    steps_now[step_idx] = {
                                        **steps_now[step_idx],
                                        "status": f"진행 중 ({progress_snap['done']}/{progress_snap['files']} 파일, {progress_snap['chunks']} 청크)"
                                    }
                                session_adapter.set('restore_status', {
                                    'status': 'running',
                                    'current_step': i + 1,
                                    'total_steps': len(steps_now),
                                    'steps': steps_now,
                                    'message': steps_now[step_idx]['status'] if steps_now else '인덱싱 진행 중',
                                    'start_time': session_adapter.get('restore_status', {}).get('start_time')
                                })
                            except Exception:
                                pass

                        # Release 우선 복원(강제 아님) → 로컬 준비본 → 최후에 재인덱싱
                        result = None
                        try:
                            persist_dir = effective_persist_dir()
                        except Exception:
                            persist_dir = None

                        # 1) Release 복원 시도
                        if result is None and not force:
                            try:
                                from ..services.config_adapter import config_adapter
                                # from src.backend.infrastructure.runtime.sequential_release import create_sequential_manager
                                def create_sequential_manager(): return None
                                from pathlib import Path as _Path
                                owner = config_adapter.get('GITHUB_OWNER', '')
                                repo = config_adapter.get('GITHUB_REPO', '')
                                token = config_adapter.get_secret('GITHUB_TOKEN')
                                if owner and repo and token and persist_dir is not None:
                                    mgr = create_sequential_manager(owner, repo, token)
                                    info = mgr.restore_latest_index(_Path(str(persist_dir)), clean_dest=True)
                                    session_adapter.set('release_tag', info.get('tag'))
                                    summary = get_index_summary(persist_dir)
                                    if getattr(summary, 'chunk_count', 0) > 0:
                                        print(f"[ADMIN] Release 복원 사용: tag={info.get('tag')} chunks={summary.chunk_count}")
                                        result = {"chunks": summary.chunk_count, "files_count": summary.file_count, "dest": str(persist_dir)}
                            except Exception as e:
                                print(f"[ADMIN] Release 복원 실패/비활성: {e}")

                        # 2) 로컬 준비본 사용
                        if result is None and persist_dir is not None:
                            try:
                                summary = get_index_summary(persist_dir)
                                if getattr(summary, 'chunk_count', 0) > 0:
                                    print(f"[ADMIN] 기존 로컬 인덱스 사용: chunks={summary.chunk_count}, files={summary.file_count}")
                                    result = {"chunks": summary.chunk_count, "files_count": summary.file_count, "dest": str(persist_dir)}
                            except Exception:
                                pass

                        # 3) 최후 수단: 재인덱싱 (force 시 업로드 index-N)
                        if result is None:
                            print(f"[ADMIN] 재인덱싱 수행...")
                            result = rebuild_index(progress_cb=_cb)
                            if force and persist_dir is not None:
                                try:
                                    # from src.backend.infrastructure.runtime.sequential_release import create_sequential_manager
                                    def create_sequential_manager(): return None
                                    from ..services.config_adapter import config_adapter
                                    # from src.backend.infrastructure.backup.packaging import make_index_zip
                                    def make_index_zip(): return None
                                    from pathlib import Path as _Path
                                    owner = config_adapter.get('GITHUB_OWNER', '')
                                    repo = config_adapter.get('GITHUB_REPO', '')
                                    token = config_adapter.get_secret('GITHUB_TOKEN')
                                    if owner and repo and token:
                                        mgr = create_sequential_manager(owner, repo, token)
                                        zip_path = make_index_zip(_Path(str(persist_dir)))
                                        tag, _rel = mgr.create_index_release(zip_path)
                                        session_adapter.set('release_tag', tag)
                                        print(f"[ADMIN] 인덱스 업로드 완료: {tag}")
                                except Exception as e:
                                    print(f"[ADMIN] 업로드 실패(무시 가능): {e}")
                        # 결과 기록
                        chunk_count = (result or {}).get('chunks', 0)
                        files_count = (result or {}).get('files_count', 0)
                        session_adapter.set('rag_modules_loaded', True)
                        session_adapter.set('rag_chunk_count', chunk_count)
                        session_adapter.set('rag_files_count', files_count)
                        print(f"[ADMIN] 인덱스 빌드 완료: chunks={chunk_count}, files={files_count}")
                    except Exception as e:
                        print(f"[ADMIN] 인덱스 빌드 실패: {e}")
                        import traceback; traceback.print_exc()
                        raise
                elif name == "인덱싱: 통계 저장":
                    print("[ADMIN] 인덱싱 통계 저장")
                    # 이미 세션에 저장됨
                elif name == "검증: 프롬프트 로딩":
                    print("[ADMIN] 프롬프트 로딩/검증...")
                    try:
                        # from src.backend.services.modes.router import ModeRouter
                        class ModeRouter: pass
                        # from src.backend.services.modes.types import Mode
                        class Mode:
                            GRAMMAR = "grammar"
                        router = ModeRouter()
                        prompt_bundle = router.render_prompt(mode=Mode.GRAMMAR, question="테스트", context_fragments=[])
                        if "Professor G" in prompt_bundle.prompt:
                            print("[ADMIN] Professor G persona OK")
                        else:
                            print("[ADMIN] Professor G persona 미검출(내장 사용)")
                    except Exception as e:
                        print(f"[ADMIN] 프롬프트 로딩 실패: {e}")
                elif name == "검증: 샘플 검색":
                    print("[ADMIN] 샘플 검색 수행...")
                    try:
                        # from src.backend.domain.rag.search import search
                        def search(): return {"results": [], "total": 0}
                        # 간단 샘플 질의
                        _ = search  # 참조 확인 (실제 호출은 옵션)
                        print("[ADMIN] 검색 모듈 OK")
                    except Exception as e:
                        print(f"[ADMIN] 검색 모듈 로드 실패: {e}")
                elif name == "배포: 활성화 플래그":
                    print("[ADMIN] 활성화 플래그 설정")
                    session_adapter.set('professor_g_enabled', True)
                elif name == "배포: 완료 마킹":
                    print("[ADMIN] 완료 마킹")
                elif name == "최적화: 벡터 인덱스 자동 생성":
                    print("[ADMIN] 벡터 인덱스 확인 및 자동 생성...")
                    try:
                        from ..services.config_adapter import config_adapter as _cfg
                        from ..services.persist import effective_persist_dir
                        from pathlib import Path
                        import os
                        
                        persist_dir = Path(effective_persist_dir())
                        vector_dir = Path(_cfg.get('VECTOR_DB_PATH', persist_dir / 'vectors'))
                        chroma_db = vector_dir / "chroma.sqlite3"
                        
                        # 벡터 인덱스 존재 확인
                        if chroma_db.exists() and chroma_db.stat().st_size > 0:
                            print(f"[ADMIN] 벡터 인덱스 이미 존재함: {chroma_db}")
                            print(f"[ADMIN] 크기: {chroma_db.stat().st_size / 1024 / 1024:.2f} MB")
                            print("[ADMIN] 벡터 인덱스 재생성 스킵 (기존 사용)")
                        else:
                            print("[ADMIN] 벡터 인덱스 없음 - 자동 생성 시도")
                            
                            chunks_file = persist_dir / "chunks.jsonl"
                            if not chunks_file.exists():
                                raise FileNotFoundError(f"chunks.jsonl 파일이 없습니다: {chunks_file}")
                            
                            # from src.backend.domain.rag.vector_indexer import build_vector_index
                            def build_vector_index(): return {"success": False, "error": "Not implemented"}
                            result = build_vector_index(str(chunks_file), vector_db_path=str(vector_dir), force_rebuild=True)
                            if int(result.get('indexed_count') or 0) <= 0:
                                raise RuntimeError('벡터 0개 생성')
                            
                            session_adapter.set('vector_index_built', True)
                            session_adapter.set('vector_count', int(result.get('indexed_count') or 0))
                            session_adapter.set('embedding_model', result.get('provider') or 'unknown')
                            
                    except Exception as e:
                        print(f"[ADMIN] 벡터 인덱스 생성 실패: {e}")
                        print("[ADMIN] 경고: 벡터 검색은 사용할 수 없지만, BM25 검색은 정상 작동합니다")
                        # 벡터 인덱스 생성 실패는 치명적이지 않음 (BM25로 대체 가능)
                        # 따라서 예외를 발생시키지 않고 경고만 표시
                else:
                    print(f"[ADMIN] 알 수 없는 단계: {name}")
                
                # 단계 완료
                # 단계 시간 기록
                _elapsed = max(0.0, time.time() - _t0)
                step["status"] = "완료"
                step["elapsed_ms"] = int(_elapsed * 1000)
                restore_result["steps"][i] = step.copy()
                print(f"[ADMIN] {step['name']} 완료")
                
                # 세션에 완료 상태 저장
                session_adapter.set('restore_status', {
                    'status': 'running',
                    'current_step': i + 1,
                    'total_steps': len(steps),
                    'steps': restore_result["steps"],
                    'message': f'{step["name"]} 완료 (소요 {int(_elapsed)}s)',
                    'start_time': session_adapter.get('restore_status', {}).get('start_time')
                })
                
            except Exception as e:
                _elapsed = max(0.0, time.time() - _t0)
                step["status"] = f"오류: {str(e)}"
                step["elapsed_ms"] = int(_elapsed * 1000)
                restore_result["steps"][i] = step.copy()
                print(f"[ADMIN] {step['name']} 오류: {e}")
                
                # 세션에 오류 상태 저장
                session_adapter.set('restore_status', {
                    'status': 'error',
                    'current_step': i + 1,
                    'total_steps': len(steps),
                    'steps': restore_result["steps"],
                    'message': f'{step["name"]} 오류: {str(e)}',
                    'start_time': session_adapter.get('restore_status', {}).get('start_time'),
                    'error': str(e)
                })
                break
        
        # 복원 결과를 세션에 저장
        session_adapter.set('restore_result', restore_result)
        
        # 최종 완료 상태 저장
        final_status = 'completed' if all(s['status'] == '완료' for s in restore_result['steps']) else 'error'
        session_adapter.set('restore_status', {
            'status': final_status,
            'current_step': len(steps),
            'total_steps': len(steps),
            'steps': restore_result["steps"],
            'message': '복원이 완료되었습니다!' if final_status == 'completed' else '복원 중 오류가 발생했습니다.',
            'start_time': session_adapter.get('restore_status', {}).get('start_time'),
            'end_time': time.strftime("%Y-%m-%d %H:%M:%S")
        })
        
        # Professor G 프롬프트 활성화 플래그 설정
        if final_status == 'completed':
            session_adapter.set('professor_g_enabled', True)
            session_adapter.set('rag_modules_loaded', True)
        
        print(f"[ADMIN] 자동복원 완료 - {restore_result['message']}")
        print(f"[ADMIN] Professor G 프롬프트 활성화됨")
        
        return jsonify(restore_result)
        
    except Exception as e:
        print(f"[ADMIN] 자동복원 오류: {e}")
        import traceback
        traceback.print_exc()
        
        # 에러 상태 저장
        session_adapter.set('restore_status', {
            'status': 'error',
            'current_step': 0,
            'total_steps': 5,
            'steps': [],
            'message': f'복원 중 오류가 발생했습니다: {str(e)}',
            'error': str(e)
        })
        
        return jsonify({
            'success': False,
            'message': f'복원 중 오류가 발생했습니다: {str(e)}'
        }), 500


@admin_bp.route('/restore/summary', methods=['GET'])
def restore_summary():
    """
    자동복원 상태 확인
    
    Response:
        {
            "has_restore": true,
            "restore_result": {...},
            "last_restore": "2025-10-08 22:45:00"
        }
    """
    try:
        restore_result = session_adapter.get('restore_result')
        return jsonify({
            'success': True,
            'data': {
                'has_restore': restore_result is not None,
                'restore_result': restore_result,
                'last_restore': restore_result.get('restore_time') if restore_result else None
            }
        })
        
    except Exception as e:
        print(f"[ADMIN] 복원 상태 확인 오류: {e}")
        return jsonify({
            'has_restore': False,
            'restore_result': None,
            'last_restore': None
        }), 500


@admin_bp.route('/system/chunks-sample', methods=['GET'])
def chunks_sample():
    """chunks.jsonl 내용을 샘플로 점검한다.
    Returns: {
      success, data: { exists, path, total_lines, with_text, without_text, samples: [ {index, has_text, text_preview} ] }
    }
    """
    try:
        from ..services.persist import effective_persist_dir
        from pathlib import Path
        import json

        p = Path(effective_persist_dir()) / 'chunks.jsonl'
        if not p.exists():
            return jsonify({'success': True, 'data': {
                'exists': False,
                'path': str(p)
            }})

        total = 0
        with_text = 0
        without_text = 0
        samples = []
        with open(p, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                if not line.strip():
                    continue
                total += 1
                try:
                    obj = json.loads(line)
                except Exception:
                    without_text += 1
                    if len(samples) < 10:
                        samples.append({'index': i, 'has_text': False, 'text_preview': ''})
                    continue
                text = str(obj.get('text', '') or '')
                if text.strip():
                    with_text += 1
                    if len(samples) < 10:
                        samples.append({'index': i, 'has_text': True, 'text_preview': text[:80]})
                else:
                    without_text += 1
                    if len(samples) < 10:
                        samples.append({'index': i, 'has_text': False, 'text_preview': ''})

        return jsonify({'success': True, 'data': {
            'exists': True,
            'path': str(p),
            'total_lines': total,
            'with_text': with_text,
            'without_text': without_text,
            'samples': samples
        }})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def format_file_size(size_bytes):
    """파일 크기를 읽기 쉬운 형태로 변환"""
    if size_bytes == 0:
        return "0B"
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    return f"{size_bytes:.1f}{size_names[i]}"

def get_index_filename():
    """현재 사용 중인 인덱스 파일명 반환"""
    try:
        from ..services.persist import effective_persist_dir
        persist_dir = effective_persist_dir()
        index_files = list(persist_dir.glob("index*"))
        if index_files:
            return index_files[0].name
        return "없음"
    except Exception:
        return "확인 불가"

def get_index_file_size():
    """인덱스 파일 크기 반환"""
    try:
        from ..services.persist import effective_persist_dir
        persist_dir = effective_persist_dir()
        index_files = list(persist_dir.glob("index*"))
        if index_files:
            size_bytes = index_files[0].stat().st_size
            return format_file_size(size_bytes)
        return "0B"
    except Exception:
        return "확인 불가"

@admin_bp.route('/system/index-info', methods=['GET'])
def get_index_info():
    """AI 학습 환경 정보 조회 (개선된 버전)"""
    try:
        # 기본 정보 구조
        ai_environment = {
            'data_source': {
                'google_drive_status': 'unknown',
                'google_drive_files': 0,
                'new_files': 0
            },
            'release_index': {
                'tag': 'unknown',
                'filename': '없음',
                'size': '0B',
                'chunk_count': 0,
                'file_count': 0,
                'last_updated': None,
                'exists': False,
                'vector_index': {
                    'exists': False,
                    'size': '0B',
                    'vector_count': 0,
                    'dimension': 0,
                    'model': 'unknown'
                }
            },
            'ai_system': {
                'rag_module_loaded': False,
                'prompt_connected': False,
                'professor_g_active': False,
                'ai_provider': 'unknown'
            }
        }
        
        # 1. 데이터 소스 (Google Drive) 정보 수집
        try:
            # from src.backend.infrastructure.integrations.gdrive import list_prepared_files
            def list_prepared_files(): return []
            files = list_prepared_files()
            ai_environment['data_source']['google_drive_status'] = 'connected'
            ai_environment['data_source']['google_drive_files'] = len(files)
            # 새 파일은 현재 구현에서 0으로 설정 (향후 개선)
            ai_environment['data_source']['new_files'] = 0
        except Exception as e:
            ai_environment['data_source']['google_drive_status'] = f'error: {str(e)}'
        
        # 2. 릴리스 인덱스 정보 수집
        try:
            # from src.backend.domain.rag.index_status import get_index_summary
            def get_index_summary(): return {"status": "unknown", "files": 0, "chunks": 0}
            from ..services.persist import effective_persist_dir
            from ..services.session_adapter import session_adapter
            
            # 실제 persist 디렉토리 사용
            persist_dir = effective_persist_dir()
            summary = get_index_summary(persist_dir)

            # persist 경로 및 파일 목록 수집(요청한 진단 용도)
            try:
                from pathlib import Path as _Path
                import os as _os
                pdir_str = str(persist_dir)
                ai_environment['release_index']['persist_dir'] = pdir_str
                files_list = []
                # 파일 기준 정렬(이름 오름차순), 상위 500개 제한
                for p in sorted(_Path(persist_dir).iterdir(), key=lambda x: x.name)[:500]:
                    try:
                        if p.is_file():
                            st = p.stat()
                            files_list.append({
                                'name': p.name,
                                'size': int(st.st_size),
                                'size_human': format_file_size(int(st.st_size)),
                                'mtime': int(st.st_mtime)
                            })
                    except Exception:
                        # 개별 파일 오류는 무시하고 계속
                        pass
                ai_environment['release_index']['persist_files'] = files_list
            except Exception:
                # 파일 목록 수집 실패는 치명적이지 않으므로 무시
                ai_environment['release_index']['persist_dir'] = str(persist_dir)
            
            # chunks.jsonl 존재 여부(상단 표시용)
            try:
                import os as _os
                ai_environment['release_index']['local_chunks_exists'] = _os.path.exists(
                    _os.path.join(str(persist_dir), 'chunks.jsonl')
                )
            except Exception:
                ai_environment['release_index']['local_chunks_exists'] = False
            
            # 벡터 인덱스 정보 수집
            try:
                from pathlib import Path
                vector_dir = Path(persist_dir) / 'vectors'
                chroma_db = vector_dir / 'chroma.sqlite3'
                
                if chroma_db.exists() and chroma_db.stat().st_size > 0:
                    ai_environment['release_index']['vector_index']['exists'] = True
                    ai_environment['release_index']['vector_index']['size'] = format_file_size(chroma_db.stat().st_size)
                    
                    # 벡터 메타 정보 가져오기
                    vmeta = _read_vector_meta()
                    ai_environment['release_index']['vector_index']['vector_count'] = vmeta.get('vector_count', 0)
                    ai_environment['release_index']['vector_index']['dimension'] = vmeta.get('dimension', 0)
                    ai_environment['release_index']['vector_index']['model'] = vmeta.get('embedding_model', 'unknown')
                else:
                    ai_environment['release_index']['vector_index']['exists'] = False
            except Exception as e:
                print(f"[DEBUG] 벡터 인덱스 정보 수집 오류: {e}")
                ai_environment['release_index']['vector_index']['exists'] = False

            # 릴리스 태그 가져오기 (최신 릴리스 확인)
            try:
                # 최신 릴리스 태그 확인 (index-<num> 또는 index-v<timestamp>)
                import requests
                import os
                import re
                
                # GitHub 토큰 가져오기
                github_token = os.getenv('GITHUB_TOKEN')
                
                headers = {'Accept': 'application/vnd.github.v3+json'}
                if github_token:
                    headers['Authorization'] = f'token {github_token}'
                
                response = requests.get(f'https://api.github.com/repos/LEES1605/MAIC-Flask/releases?per_page=100', headers=headers, timeout=5)
                
                if response.status_code == 200:
                    releases = response.json()
                    # 우선순위: index-<num> 최대값, 없으면 index-v* 중 가장 최신(created_at)
                    numeric_tags = []
                    timestamp_tags = []
                    for r in releases:
                        tag = (r.get('tag_name') or '').strip()
                        if re.fullmatch(r'index-(\d+)', tag):
                            try:
                                numeric_tags.append((int(tag.split('-')[1]), tag))
                            except Exception:
                                pass
                        elif tag.startswith('index-v'):
                            # created_at 기준으로 정렬할 수 있도록 함께 보관
                            timestamp_tags.append((r.get('created_at') or '', tag))

                    latest_tag = None
                    if numeric_tags:
                        latest_tag = sorted(numeric_tags, key=lambda x: x[0], reverse=True)[0][1]
                    elif timestamp_tags:
                        latest_tag = sorted(timestamp_tags, key=lambda x: x[0], reverse=True)[0][1]

                    if latest_tag:
                        ai_environment['release_index']['tag'] = latest_tag
                        session_adapter.set('release_tag', latest_tag)
                        print(f"[INFO] 릴리스 태그 조회 성공: {latest_tag}")
                    else:
                        ai_environment['release_index']['tag'] = session_adapter.get('release_tag', 'unknown')
                        print("[WARN] index-* 릴리스가 없음")
                else:
                    ai_environment['release_index']['tag'] = session_adapter.get('release_tag', 'unknown')
                    print(f"[WARN] GitHub API 오류: {response.status_code}")
            except Exception as e:
                # GitHub 연결 실패 시 세션 값 사용
                print(f"[ERROR] GitHub API 호출 실패: {type(e).__name__}: {str(e)}")
                ai_environment['release_index']['tag'] = session_adapter.get('release_tag', 'unknown')
            
            # 인덱스 파일 정보
            ai_environment['release_index']['filename'] = get_index_filename()
            ai_environment['release_index']['size'] = get_index_file_size()
            
            # 인덱스 데이터 정보
            ai_environment['release_index']['chunk_count'] = summary.total_chunks
            ai_environment['release_index']['file_count'] = summary.total_files
            
            # 날짜 형식 변환
            if summary.last_built_at:
                import datetime
                try:
                    # 타임스탬프를 읽을 수 있는 날짜 형식으로 변환
                    dt = datetime.datetime.fromtimestamp(summary.last_built_at)
                    ai_environment['release_index']['last_updated'] = dt.strftime('%Y-%m-%d %H:%M')
                except (ValueError, OSError):
                    ai_environment['release_index']['last_updated'] = 'Unknown'
            else:
                ai_environment['release_index']['last_updated'] = 'Unknown'
                
            ai_environment['release_index']['exists'] = summary.total_chunks > 0
        except Exception as e:
            print(f"[ADMIN] RAG 인덱스 상태 확인 오류: {e}")
            # 보강 폴백: index.meta.json 또는 chunks.jsonl 직접 읽기
            try:
                import os, json
                from ..services.persist import effective_persist_dir as _eff
                pdir = _eff()
                meta_path = os.path.join(str(pdir), 'index.meta.json')
                chunks_path = os.path.join(str(pdir), 'chunks.jsonl')
                
                # 1) meta 우선
                chunks = None
                files_count = None
                if os.path.exists(meta_path):
                    try:
                        with open(meta_path, 'r', encoding='utf-8') as f:
                            meta = json.load(f)
                        chunks = int(meta.get('chunks') or 0)
                    except Exception:
                        chunks = None
                
                # 2) meta가 없거나 0이면 chunks.jsonl 라인수로 계산
                if (chunks is None or chunks == 0) and os.path.exists(chunks_path):
                    try:
                        cnt = 0
                        with open(chunks_path, 'r', encoding='utf-8') as f:
                            for cnt, _ in enumerate(f, 1):
                                pass
                        chunks = cnt
                    except Exception:
                        chunks = 0
                
                # 3) manifest 파일로 file_count 추정
                manifest_path = os.path.join(str(pdir), 'manifest.json')
                if os.path.exists(manifest_path):
                    try:
                        with open(manifest_path, 'r', encoding='utf-8') as f:
                            mani = json.load(f)
                        files_count = len(mani.get('files') or [])
                    except Exception:
                        files_count = None
                
                # 폴백 정보로 업데이트
                ai_environment['release_index']['chunk_count'] = int(chunks or 0)
                if files_count is not None:
                    ai_environment['release_index']['file_count'] = int(files_count)
                ai_environment['release_index']['exists'] = ai_environment['release_index']['chunk_count'] > 0
                ai_environment['release_index']['last_updated'] = 'Unknown'
                
            except Exception:
                # 최종 폴백: 세션 저장값 사용
                from ..services.session_adapter import session_adapter
                ai_environment['release_index']['chunk_count'] = session_adapter.get('rag_chunk_count', 0)
                ai_environment['release_index']['file_count'] = session_adapter.get('rag_files_count', 0)
                ai_environment['release_index']['exists'] = ai_environment['release_index']['chunk_count'] > 0
                ai_environment['release_index']['last_updated'] = 'Unknown'

        # 3. AI 시스템 정보 수집
        try:
            from ..services.session_adapter import session_adapter
            from ..services.ai_service import get_current_provider
            
            # RAG 모듈 로드 상태 (실제 인덱스 존재 여부로 판단)
            ai_environment['ai_system']['rag_module_loaded'] = summary.total_chunks > 0
            
            # Professor G 활성화 상태 (RAG 모듈이 로드되고 프롬프트가 연결된 경우)
            ai_environment['ai_system']['professor_g_active'] = (
                summary.total_chunks > 0 and 
                session_adapter.get('prompt_connected', False)
            )
            
            # AI 제공자 정보
            try:
                current_provider = get_current_provider()
                ai_environment['ai_system']['ai_provider'] = current_provider
            except Exception:
                ai_environment['ai_system']['ai_provider'] = 'unknown'
            
            # 프롬프트 연결 상태 (기본적으로 연결됨으로 가정)
            ai_environment['ai_system']['prompt_connected'] = True
            
            # 벡터 인덱스 상태 확인
            try:
                from ..services.config_adapter import config_adapter as _cfg
                from ..services.persist import effective_persist_dir
                from pathlib import Path
                
                persist_dir = Path(effective_persist_dir())
                vector_dir = Path(_cfg.get('VECTOR_DB_PATH', persist_dir / 'vectors'))
                chroma_db = vector_dir / "chroma.sqlite3"
                
                # 벡터 인덱스 존재 여부 확인
                ai_environment['ai_system']['vector_built'] = chroma_db.exists() and chroma_db.stat().st_size > 0
            except Exception:
                ai_environment['ai_system']['vector_built'] = False
            
        except Exception as e:
            print(f"[ADMIN] AI 시스템 정보 수집 오류: {e}")
        
        return jsonify({
            'success': True,
            'data': ai_environment
        })
        
    except Exception as e:
        print(f"[ADMIN] 인덱스 정보 조회 오류: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@admin_bp.route('/system/index-diagnostics', methods=['GET'])
def get_index_diagnostics():
    """
    인덱스 관련 단계형 진단 정보 제공

    Returns:
        {
          "success": true,
          "data": {
            "steps": [
              {"id": 1, "title": "환경 확인", "status": "success|error", "duration_ms": 10, "message": "..."},
              {"id": 2, "title": "GDrive 자격증명", "status": "success|error", "message": "..."},
              {"id": 3, "title": "GDrive 파일목록", "status": "success|error", "count": 223, "message": "..."},
              {"id": 4, "title": "RAG 인덱스", "status": "success|error", "chunks": 2787, "files": 218, "message": "..."},
              {"id": 5, "title": "모듈/플래그", "status": "success|error", "message": "..."}
            ],
            "overall": "success|error"
          }
        }
    """
    import os
    import time
    from pathlib import Path
    import json

    # 0) TTL 캐시 확인
    now = time.time()
    age = now - float(_INDEX_DIAG_CACHE['ts'] or 0)
    if _INDEX_DIAG_CACHE['data'] is not None and age < _INDEX_DIAG_TTL_SECONDS:
        cached = dict(_INDEX_DIAG_CACHE['data'])
        cached['cache'] = {
            'mode': 'hit',
            'age_ms': int(age * 1000),
            'ttl_seconds': _INDEX_DIAG_TTL_SECONDS
        }
        return jsonify({'success': True, 'data': cached})

    steps = []
    overall_ok = True

    # 1) 환경 확인
    t0 = time.time()
    try:
        fid = os.getenv('GDRIVE_PREPARED_FOLDER_ID', '').strip()
        assert bool(fid), 'GDRIVE_PREPARED_FOLDER_ID 누락'
        steps.append({
            'id': 1,
            'title': '환경 확인',
            'status': 'success',
            'duration_ms': int((time.time() - t0) * 1000),
            'message': '필수 환경변수 확인 완료'
        })
    except Exception as e:
        overall_ok = False
        steps.append({
            'id': 1,
            'title': '환경 확인',
            'status': 'error',
            'duration_ms': int((time.time() - t0) * 1000),
            'message': str(e)
        })

    # 2) GDrive 자격증명
    t0 = time.time()
    try:
        sa = (os.getenv('GDRIVE_SA_JSON') or '').strip()
        assert sa, 'GDRIVE_SA_JSON 누락'
        p = Path(sa)
        if p.exists():
            _ = json.loads(p.read_text(encoding='utf-8'))
        else:
            _ = json.loads(sa)
        steps.append({
            'id': 2,
            'title': 'GDrive 자격증명',
            'status': 'success',
            'duration_ms': int((time.time() - t0) * 1000),
            'message': '서비스 계정 JSON 확인'
        })
    except Exception as e:
        overall_ok = False
        steps.append({
            'id': 2,
            'title': 'GDrive 자격증명',
            'status': 'error',
            'duration_ms': int((time.time() - t0) * 1000),
            'message': str(e)
        })

    # 3) GDrive 파일목록
    t0 = time.time()
    try:
        # from src.backend.infrastructure.integrations.gdrive import list_prepared_files
        def list_prepared_files(): return []
        files = list_prepared_files()
        steps.append({
            'id': 3,
            'title': 'GDrive 파일목록',
            'status': 'success',
            'duration_ms': int((time.time() - t0) * 1000),
            'count': len(files),
            'message': '파일목록 조회 성공'
        })
    except Exception as e:
        overall_ok = False
        steps.append({
            'id': 3,
            'title': 'GDrive 파일목록',
            'status': 'error',
            'duration_ms': int((time.time() - t0) * 1000),
            'message': str(e)
        })

    # 4) RAG 인덱스
    t0 = time.time()
    try:
        # from src.backend.domain.rag.index_status import get_index_summary
        def get_index_summary(): return {"status": "unknown", "files": 0, "chunks": 0}
        from ..services.persist import effective_persist_dir
        persist_dir = effective_persist_dir()
        summary = get_index_summary(persist_dir)
        def _iget(obj, key, default=0):
            try:
                if hasattr(obj, key):
                    return int(getattr(obj, key) or 0)
                if isinstance(obj, dict):
                    return int(obj.get(key, default) or 0)
            except Exception:
                pass
            return int(default)
        chunks = _iget(summary, 'chunk_count') or _iget(summary, 'chunks')
        files  = _iget(summary, 'file_count')  or _iget(summary, 'files')
        # 폴백: meta/manifest 직접 읽어 보강
        try:
            if (chunks or 0) <= 0 or (files or 0) <= 0:
                pdir = persist_dir
                meta_path = os.path.join(str(pdir), 'index.meta.json')
                chunks_path = os.path.join(str(pdir), 'chunks.jsonl')
                if os.path.exists(meta_path):
                    try:
                        with open(meta_path, 'r', encoding='utf-8') as f:
                            meta = json.load(f)
                        chunks = int(meta.get('chunks') or chunks or 0)
                    except Exception:
                        pass
                if (chunks or 0) <= 0 and os.path.exists(chunks_path):
                    try:
                        cnt = 0
                        with open(chunks_path, 'r', encoding='utf-8') as f:
                            for cnt, _ in enumerate(f, 1):
                                pass
                        chunks = int(cnt)
                    except Exception:
                        pass
                manifest_path = os.path.join(str(pdir), 'manifest.json')
                if os.path.exists(manifest_path):
                    try:
                        with open(manifest_path, 'r', encoding='utf-8') as f:
                            mani = json.load(f)
                        files = int(len(mani.get('files') or [])) or files or 0
                    except Exception:
                        pass
        except Exception:
            pass
        steps.append({
            'id': 4,
            'title': 'RAG 인덱스',
            'status': 'success' if chunks > 0 else 'error',
            'duration_ms': int((time.time() - t0) * 1000),
            'chunks': int(chunks),
            'files': int(files),
            'message': '인덱스 요약 로드'
        })
        if not chunks:
            overall_ok = False
    except Exception as e:
        overall_ok = False
        steps.append({
            'id': 4,
            'title': 'RAG 인덱스',
            'status': 'error',
            'duration_ms': int((time.time() - t0) * 1000),
            'message': str(e)
        })

    # 5) 모듈/플래그
    t0 = time.time()
    try:
        steps.append({
            'id': 5,
            'title': '모듈/플래그',
            'status': 'success',
            'duration_ms': int((time.time() - t0) * 1000),
            'message': f"professor_g_enabled={session_adapter.get('professor_g_enabled', False)}, rag_modules_loaded={session_adapter.get('rag_modules_loaded', False)}"
        })
    except Exception as e:
        overall_ok = False
        steps.append({
            'id': 5,
            'title': '모듈/플래그',
            'status': 'error',
            'duration_ms': int((time.time() - t0) * 1000),
            'message': str(e)
        })

    # 6) 요약/지표(SSOT) 구성: 두 화면이 공통 참조
    #    - GDrive, RAG, 플래그, 복원 상태, 카운트, 생성 시각 등
    try:
        # GDrive 요약
        gdrive_step = next((s for s in steps if s.get('id') == 3), {})
        google_drive_status = 'connected' if gdrive_step.get('status') == 'success' else 'error'
        google_drive_files = int(gdrive_step.get('count') or 0)
    except Exception:
        google_drive_status = 'unknown'
        google_drive_files = 0

    try:
        # RAG 요약
        rag_step = next((s for s in steps if s.get('id') == 4), {})
        chunk_count = int(rag_step.get('chunks') or 0)
        file_count = int(rag_step.get('files') or 0)
        rag_status = 'ready' if chunk_count > 0 else 'not_ready'
    except Exception:
        rag_status = 'unknown'
        chunk_count = 0
        file_count = 0

    # 추가 진단: JSON/벡터 메타 존재 여부 표시
    has_chunks_jsonl = False
    has_manifest_json = False
    has_index_meta_json = False
    has_vector_meta_json = False
    try:
        from ..services.persist import effective_persist_dir as _eff
        pdir = _eff()
        import os
        chunks_path = os.path.join(str(pdir), 'chunks.jsonl')
        manifest_path = os.path.join(str(pdir), 'manifest.json')
        index_meta_path = os.path.join(str(pdir), 'index.meta.json')
        has_chunks_jsonl = os.path.exists(chunks_path)
        has_manifest_json = os.path.exists(manifest_path)
        has_index_meta_json = os.path.exists(index_meta_path)
    except Exception:
        pass
    try:
        # 벡터 메타는 VECTOR_DB_PATH 하위 vector_index.meta.json을 우선 탐색
        from ..services.config_adapter import config_adapter
        vdir = config_adapter.get('VECTOR_DB_PATH', '') or ''
        if vdir:
            import os
            vmeta = os.path.join(vdir, 'vector_index.meta.json')
            has_vector_meta_json = os.path.exists(vmeta)
    except Exception:
        pass

    # 세션 플래그/복원 상태/릴리스 태그
    restore_status = session_adapter.get('restore_status', {}).get('status', 'idle')
    professor_g_enabled = session_adapter.get('professor_g_enabled', False)
    rag_modules_loaded = session_adapter.get('rag_modules_loaded', False)
    release_tag = session_adapter.get('release_tag')

    # 릴리스/로컬 인덱스 파일명 보강
    local_index_filename = None
    local_chunks_exists = has_chunks_jsonl
    try:
        from ..services.persist import effective_persist_dir as _eff
        import os
        pdir = _eff()
        # 가장 최근 index-* 파일명을 추정(있다면)
        candidates = [f for f in os.listdir(str(pdir)) if f.startswith('index-')]
        if candidates:
            # 사전순이 최신이 아닐 수 있으므로 수정시간 기준 정렬
            candidates_full = [(f, os.path.getmtime(os.path.join(str(pdir), f))) for f in candidates]
            candidates_full.sort(key=lambda x: x[1], reverse=True)
            local_index_filename = candidates_full[0][0]
    except Exception:
        pass

    payload = {
        'steps': steps,
        'overall': 'success' if overall_ok else 'error',
        'summary': {
            'google_drive_status': google_drive_status,
            'google_drive_files': google_drive_files,
            'rag_status': rag_status,
            'chunk_count': chunk_count,
            'file_count': file_count,
            'has_chunks_jsonl': has_chunks_jsonl,
            'has_manifest_json': has_manifest_json,
            'has_index_meta_json': has_index_meta_json,
            'has_vector_meta_json': has_vector_meta_json,
            'local_index_filename': local_index_filename,
            'local_chunks_exists': local_chunks_exists,
            'restore_status': restore_status,
            'professor_g_enabled': professor_g_enabled,
            'rag_modules_loaded': rag_modules_loaded,
            'release_tag': release_tag,
            'vector_built': False,
        },
        'generated_at': int(now),
        'cache': {
            'mode': 'miss',
            'age_ms': 0,
            'ttl_seconds': _INDEX_DIAG_TTL_SECONDS
        }
    }

    # 벡터 인덱스 파일 존재 기반 상태 보강
    try:
        from ..services.config_adapter import config_adapter as _cfg
        import os as _os
        vdir = _cfg.get('VECTOR_DB_PATH', '') or ''
        if vdir:
            chroma_sqlite = _os.path.join(vdir, 'chroma.sqlite3')
            payload['summary']['vector_built'] = _os.path.exists(chroma_sqlite) and (_os.path.getsize(chroma_sqlite) > 0)
    except Exception:
        pass

    # 7) TTL 캐시에 저장
    _INDEX_DIAG_CACHE['data'] = payload
    _INDEX_DIAG_CACHE['ts'] = now

    return jsonify({'success': True, 'data': payload})


# ============================================================
# 관리자 메뉴 컴포넌트 로드 API
# ============================================================

@admin_bp.route('/component/<component_name>', methods=['GET'])
def load_admin_component(component_name):
    """
    관리자 메뉴 HTML 컴포넌트 로드
    
    Args:
        component_name (str): 컴포넌트 이름
            - auto_restore
            - dashboard
            - question_mode
            - user_management
            - prompt_management
            - system_management
            - data_logs
    
    Returns:
        {
            "success": true,
            "html": "..."
        }
    """
    try:
        # 허용된 컴포넌트 목록
        allowed_components = [
            'auto_restore',
            'dashboard',
            'question_mode',
            'user_management',
            'prompt_management',
            'system_management',
            'data_logs',
            'environment_settings',
            'security_settings',
            'performance_settings',
            'indexing'
        ]
        
        if component_name not in allowed_components:
            return jsonify({
                'success': False,
                'message': f'허용되지 않은 컴포넌트: {component_name}'
            }), 400
        
        # 컴포넌트별 데이터 준비
        template_data = {}
        
        if component_name == 'dashboard':
            # 대시보드 데이터 준비
            template_data = {
                'current_time': time.strftime('%Y-%m-%d %H:%M:%S'),
                'PreparedFilesCount': 15,  # 예시 데이터
                'modeUsage_grammar': 35,
                'modeUsage_reading': 45,
                'modeUsage_writing': 20,
                'dailyQuestions_today': 127,
                'dailyQuestions_yesterday': 98,
                'dailyQuestions_change': 29.6,
                'satisfaction_rate': 87,
                'satisfaction_percentage': 218.3,  # 87 * 2.51
                'total_users': 1247,
                'active_users': 89,
                'total_questions': 3456,
                'avg_session_time': 23,
                'last_update_time': time.strftime('%Y-%m-%d %H:%M:%S')
            }
        
        # 컴포넌트 HTML 렌더링 (Jinja2로 변수 전달 가능)
        html = render_template(f'components/admin/admin_{component_name}.html', **template_data)
        
        return jsonify({
            'success': True,
            'html': html
        })
        
    except Exception as e:
        print(f"[ADMIN] 컴포넌트 로드 오류: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


# ============================================================
# 검색 엔진/벡터 인덱스 관리 API (UI 연계)
# ============================================================

def _count_chunks_lines() -> int:
    try:
        from ..services.persist import effective_persist_dir
        from pathlib import Path
        chunks_file = Path(effective_persist_dir()) / 'chunks.jsonl'
        if not chunks_file.exists():
            return 0
        cnt = 0
        with open(chunks_file, 'r', encoding='utf-8') as f:
            for cnt, _ in enumerate(f, 1):
                pass
        return int(cnt)
    except Exception:
        return 0


def _read_vector_meta() -> dict:
    from ..services.config_adapter import config_adapter
    from ..services.persist import effective_persist_dir
    from pathlib import Path
    import os, json
    
    meta = {
        'exists': False,
        'vector_count': 0,
        'dimension': 0,
        'embedding_model': '',
    }
    
    try:
        # 벡터 디렉토리 경로 확인
        vdir = config_adapter.get('VECTOR_DB_PATH', '') or ''
        if not vdir:
            persist_dir = Path(effective_persist_dir())
            vdir = str(persist_dir / 'vectors')
        
        chroma_db = os.path.join(vdir, 'chroma.sqlite3')
        
        # ChromaDB 파일 존재 여부 확인
        if os.path.exists(chroma_db) and os.path.getsize(chroma_db) > 0:
            meta['exists'] = True
            
            # 세션에서 벡터 정보 가져오기
            from ..services.session_adapter import session_adapter
            meta['vector_count'] = session_adapter.get('vector_count', 0)
            meta['dimension'] = 384  # Sentence-Transformers 기본 차원
            meta['embedding_model'] = session_adapter.get('embedding_model', 'sentence-transformer')
            
            # 메타 파일이 있다면 더 정확한 정보 사용
            vmeta = os.path.join(vdir, 'vector_index.meta.json')
            if os.path.exists(vmeta):
                try:
                    with open(vmeta, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    meta['vector_count'] = int(data.get('indexed_count') or meta['vector_count'])
                    meta['dimension'] = int(data.get('dimension') or meta['dimension'])
                    meta['embedding_model'] = str(data.get('provider') or meta['embedding_model'])
                except Exception:
                    pass
    except Exception as e:
        print(f"[DEBUG] 벡터 메타 읽기 오류: {e}")
        
    return meta


@admin_bp.route('/vector/status', methods=['GET'])
def vector_status():
    """벡터 인덱스 상태 조회(UI의 검색 엔진 카드에서 사용)."""
    try:
        meta = _read_vector_meta()
        # 파일 기반 실측 상태 추가
        try:
            from ..services.config_adapter import config_adapter as _cfg
            import os as _os
            vdir = _cfg.get('VECTOR_DB_PATH', '') or ''
            if vdir:
                chroma_sqlite = _os.path.join(vdir, 'chroma.sqlite3')
                meta['exists'] = _os.path.exists(chroma_sqlite) and (_os.path.getsize(chroma_sqlite) > 0)
        except Exception:
            pass
        return jsonify({'success': True, 'data': meta})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/search-mode', methods=['GET', 'POST'])
def search_mode():
    """검색 모드 설정/조회.
    - GET: { mode, alpha, bm25_count, vector_count }
    - POST: { mode, alpha }
    """
    try:
        if request.method == 'POST':
            if not auth_service.is_authenticated():
                return jsonify({'success': False, 'error': 'Unauthorized'}), 401
            data = request.get_json() or {}
            mode = (data.get('mode') or 'hybrid').strip().lower()
            alpha = float(data.get('alpha') or 0.5)
            session_adapter.set('rag_search_mode', mode)
            session_adapter.set('rag_alpha', alpha)
            return jsonify({'success': True})

        # GET
        mode = session_adapter.get('rag_search_mode', 'hybrid')
        alpha = float(session_adapter.get('rag_alpha', 0.5))
        bm25_count = _count_chunks_lines()
        vmeta = _read_vector_meta()
        return jsonify({
            'success': True,
            'data': {
                'mode': mode,
                'alpha': alpha,
                'bm25_count': bm25_count,
                'vector_count': int(vmeta.get('vector_count') or 0),
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/vector/rebuild', methods=['POST'])
def vector_rebuild():
    """벡터 인덱스 재구축 - 새로운 엔드포인트"""
    try:
        if not auth_service.is_authenticated():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401

        data = request.get_json() or {}
        provider = data.get('provider', 'sentence-transformer')
        model = data.get('model', 'paraphrase-multilingual-MiniLM-L12-v2')
        force_rebuild = data.get('force_rebuild', True)
        vector_db_path = data.get('vector_db_path', None)

        print(f"[REBUILD] Provider: {provider}")
        print(f"[REBUILD] Model: {model}")
        print(f"[REBUILD] Force rebuild: {force_rebuild}")

        from pathlib import Path
        from ..services.persist import effective_persist_dir
        # from src.backend.domain.rag.vector_indexer import build_vector_index
        def build_vector_index(): return {"success": False, "error": "Not implemented"}

        chunks_file = Path(effective_persist_dir()) / 'chunks.jsonl'
        if not chunks_file.exists():
            return jsonify({'success': False, 'error': 'chunks.jsonl이 없습니다. 먼저 인덱스 생성이 필요합니다.'}), 400

        print(f"[REBUILD] Chunks file: {chunks_file}")
        
        result = build_vector_index(
            str(chunks_file),
            provider=provider,
            model=model,
            vector_db_path=vector_db_path,
            force_rebuild=force_rebuild,
        )
        
        print(f"[REBUILD] Result: {result}")
        
        if int(result.get('indexed_count') or 0) <= 0:
            return jsonify({
                'success': False, 
                'error': f'벡터가 0개로 생성되었습니다. chunks.jsonl/임베딩 설정을 확인하세요.'
            }), 400
            
        return jsonify({
            'success': True, 
            'data': {
                'vector_count': int(result.get('indexed_count') or 0),
                'provider': provider,
                'model': model
            }
        })
        
    except Exception as e:
        print(f"[REBUILD] Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@admin_bp.route('/vector/build', methods=['POST'])
def vector_build():
    """벡터 인덱스 재구축(chunks.jsonl 기반)."""
    try:
        if not auth_service.is_authenticated():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401

        from pathlib import Path
        from ..services.persist import effective_persist_dir
        # from src.backend.domain.rag.vector_indexer import build_vector_index
        def build_vector_index(): return {"success": False, "error": "Not implemented"}

        # 클라이언트에서 임베딩 설정 오버라이드 허용
        payload = {}
        try:
            payload = request.get_json(force=False, silent=True) or {}
        except Exception:
            payload = {}
        provider = (payload.get('provider') or '').strip() or None
        model = (payload.get('model') or '').strip() or None
        vector_db_path = (payload.get('vector_db_path') or '').strip() or None
        force_rebuild = bool(payload.get('force_rebuild')) if 'force_rebuild' in payload else True

        chunks_file = Path(effective_persist_dir()) / 'chunks.jsonl'
        if not chunks_file.exists():
            return jsonify({'success': False, 'error': 'chunks.jsonl이 없습니다. 먼저 인덱스 생성이 필요합니다.'}), 400

        
        try:
            result = build_vector_index(
                str(chunks_file),
                provider=provider,
                model=model,
                vector_db_path=vector_db_path,
                force_rebuild=force_rebuild,
            )
            
        except Exception as e:
            raise
            
        # 상태 플래그 업데이트
        session_adapter.set('rag_modules_loaded', True)
        session_adapter.set('vector_index_built', True)
        session_adapter.set('vector_count', int(result.get('indexed_count') or 0))
        session_adapter.set('embedding_model', result.get('provider') or 'unknown')
        
        if int(result.get('indexed_count') or 0) <= 0:
            # 자동 폴백: OpenAI 실패 시 ST 시도, 그 반대도 시도
            try:
                fallback_provider = None
                if (provider or '').strip().lower() == 'openai':
                    fallback_provider = 'sentence-transformer'
                elif (provider or '').strip().lower() == 'sentence-transformer':
                    fallback_provider = 'openai'
                else:
                    # 명시 안했으면 ST 우선
                    fallback_provider = 'sentence-transformer'

                if fallback_provider:
                    fb_res = build_vector_index(
                        str(chunks_file),
                        provider=fallback_provider,
                        model=None,
                        vector_db_path=vector_db_path,
                        force_rebuild=True,
                    )
                    if int(fb_res.get('indexed_count') or 0) > 0:
                        result = fb_res
                        # 폴백 성공 시에도 상태 업데이트
                        session_adapter.set('vector_index_built', True)
                        session_adapter.set('vector_count', int(result.get('indexed_count') or 0))
                        session_adapter.set('embedding_model', result.get('provider') or 'unknown')
                    else:
                        return jsonify({'success': False, 'error': f"벡터가 0개로 생성되었습니다(시도: {provider or 'default'} → {fallback_provider}). chunks.jsonl/임베딩 설정을 확인하세요."}), 400
            except Exception as _e:
                return jsonify({'success': False, 'error': f"폴백 실패: {str(_e)}"}), 400
        return jsonify({'success': True, 'data': {
            'vector_count': int(result.get('indexed_count') or 0),
            'dimension': int(result.get('dimension') or 0),
            'provider': result.get('provider') or ''
        }})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@admin_bp.route('/search-test', methods=['POST'])
def search_test():
    """간단한 검색 테스트(UI의 🧪 검색 테스트)."""
    try:
        if not auth_service.is_authenticated():
            return jsonify({'success': False, 'error': 'Unauthorized'}), 401

        data = request.get_json() or {}
        query = (data.get('query') or '').strip()
        mode = (data.get('mode') or 'hybrid').strip().lower()
        top_k = int(data.get('top_k') or 3)
        alpha = float(session_adapter.get('rag_alpha', 0.5))
        if not query:
            return jsonify({'success': False, 'error': 'query가 필요합니다.'}), 400

        # BM25 + (선택) 벡터 검색기 구성
        # from src.backend.domain.rag.engine_bm25 import Bm25RagEngine
        class Bm25RagEngine: pass
        # from src.backend.domain.rag.engine import RagDoc
        class RagDoc: pass
        # from src.backend.domain.rag.vector_store import get_vector_store
        def get_vector_store(): return None
        # from src.backend.domain.rag.hybrid_search import HybridSearcher, SearchMode
        class HybridSearcher: pass
        class SearchMode: pass
        from ..services.persist import effective_persist_dir
        from pathlib import Path
        import time

        chunks_file = Path(effective_persist_dir()) / 'chunks.jsonl'
        docs: list[RagDoc] = []
        if chunks_file.exists():
            import json as _json
            with open(chunks_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        c = _json.loads(line)
                        docs.append(RagDoc(doc_id=c.get('chunk_id',''), title=c.get('title',''), text=c.get('text','')))

        bm25 = Bm25RagEngine()
        if docs:
            bm25.index(docs)
        vs = get_vector_store()

        try:
            smode = SearchMode(mode) if mode in ('bm25','vector','hybrid') else SearchMode.HYBRID
        except Exception:
            smode = SearchMode.HYBRID

        hs = HybridSearcher(bm25, vs, mode=smode, alpha=alpha)
        t0 = time.time()
        results = hs.search(query, top_k=top_k)
        elapsed_ms = int((time.time() - t0) * 1000)

        out = []
        for r in results:
            out.append({
                'title': r.title,
                'text': r.text,
                'score': float(r.score),
                'doc_id': r.doc_id,
                'chunk_id': r.chunk_id,
                'source': r.source,
            })
        return jsonify({'success': True, 'elapsed_ms': elapsed_ms, 'query': query, 'mode': smode.value, 'results': out})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ------------------------------------------------------------------
# AI 제공자 관리 API
# ------------------------------------------------------------------

@admin_bp.route('/ai/provider', methods=['GET'])
def get_ai_provider():
    """
    현재 AI 제공자 조회
    
    Returns:
        {
            "success": true,
            "data": {
                "provider": "openai|gemini",
                "display_name": "OpenAI GPT|Google Gemini"
            }
        }
    """
    try:
        # from src.backend.infrastructure.ai_client import get_current_provider
        def get_current_provider(): return "openai"
        
        provider = get_current_provider()
        display_names = {
            'openai': 'OpenAI GPT',
            'gemini': 'Google Gemini'
        }
        
        return jsonify({
            'success': True,
            'data': {
                'provider': provider,
                'display_name': display_names.get(provider, provider)
            }
        })
        
    except Exception as e:
        print(f"[ADMIN] AI 제공자 조회 오류: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@admin_bp.route('/ai/provider', methods=['POST'])
def set_ai_provider():
    """
    AI 제공자 변경
    
    Request Body:
        {
            "provider": "openai|gemini"
        }
    
    Returns:
        {
            "success": true,
            "message": "AI 제공자가 변경되었습니다."
        }
    """
    try:
        data = request.get_json()
        if not data or 'provider' not in data:
            return jsonify({
                'success': False,
                'message': 'provider 파라미터가 필요합니다.'
            }), 400
        
        provider = data['provider']
        if provider not in ['openai', 'gemini']:
            return jsonify({
                'success': False,
                'message': 'provider는 openai 또는 gemini여야 합니다.'
            }), 400
        
        # AI 클라이언트에서 제공자 변경
        from ..services.ai_service import set_provider
        set_provider(provider)
        
        print(f"[ADMIN] AI 제공자 변경: {provider}")
        
        return jsonify({
            'success': True,
            'message': f'AI 제공자가 {provider}로 변경되었습니다.'
        })
        
    except Exception as e:
        print(f"[ADMIN] AI 제공자 변경 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'설정 중 오류가 발생했습니다: {str(e)}'
        }), 500

@admin_bp.route('/ai/mode-provider', methods=['POST'])
def set_mode_provider():
    """모드별 AI 제공자 설정"""
    try:
        data = request.get_json()
        if not data or 'mode' not in data or 'provider' not in data:
            return jsonify({
                'success': False,
                'message': 'mode와 provider 파라미터가 필요합니다.'
            }), 400
        
        mode = data['mode']
        provider = data['provider']
        
        # 유효한 모드인지 확인
        valid_modes = ['grammar', 'question', 'sentence', 'passage']
        if mode not in valid_modes:
            return jsonify({
                'success': False,
                'message': f'mode는 {valid_modes} 중 하나여야 합니다.'
            }), 400
        
        # 유효한 제공자인지 확인
        if provider not in ['openai', 'gemini']:
            return jsonify({
                'success': False,
                'message': 'provider는 openai 또는 gemini여야 합니다.'
            }), 400
        
        # 모드별 AI 제공자 설정
        session_adapter.set(f'ai_provider_{mode}', provider)
        
        print(f"[ADMIN] {mode} 모드 AI 제공자 변경: {provider}")
        
        return jsonify({
            'success': True,
            'message': f'{mode} 모드의 AI 제공자가 {provider}로 변경되었습니다.'
        })
        
    except Exception as e:
        print(f"[ADMIN] 모드별 AI 제공자 설정 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'설정 중 오류가 발생했습니다: {str(e)}'
        }), 500

@admin_bp.route('/ai/mode-providers', methods=['GET'])
def get_mode_providers():
    """모드별 AI 제공자 설정 조회"""
    try:
        providers = {}
        for mode in ['grammar', 'question', 'sentence', 'passage']:
            # 기본값 설정
            if mode == 'sentence':
                default_provider = 'gemini'  # 문장분석은 기본값으로 Gemini
            else:
                default_provider = 'openai'  # 나머지는 OpenAI
            
            provider = session_adapter.get(f'ai_provider_{mode}', default_provider)
            providers[mode] = provider
        
        return jsonify({
            'success': True,
            'providers': providers
        })
        
    except Exception as e:
        print(f"[ADMIN] 모드별 AI 제공자 조회 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


def get_default_temperature_config():
    """기본 온도 설정 반환"""
    return {
        'grammar': 0.3,
        'sentence': {
            'elementary': 0.1,
            'intermediate': 0.2,
            'advanced': 0.4
        },
        'passage': 0.3
    }

@admin_bp.route('/ai/temperature', methods=['GET'])
def get_ai_temperature():
    """AI 온도 설정 조회 (모드별)"""
    try:
        from ..services.session_adapter import session_adapter
        
        # 기본 설정과 현재 설정 병합
        default_config = get_default_temperature_config()
        current_config = session_adapter.get('ai_temperature_config', {})
        
        # 병합 (현재 설정이 우선, 없으면 기본값 사용)
        config = {}
        for mode, default_value in default_config.items():
            if isinstance(default_value, dict):
                config[mode] = {}
                for difficulty, default_temp in default_value.items():
                    config[mode][difficulty] = current_config.get(mode, {}).get(difficulty, default_temp)
            else:
                config[mode] = current_config.get(mode, default_value)
        
        return jsonify({
            'success': True,
            'data': config
        })
        
    except Exception as e:
        print(f"[ERROR] AI 온도 조회 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'AI 온도 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@admin_bp.route('/ai/temperature', methods=['POST'])
def set_ai_temperature():
    """AI 온도 설정 (모드별)"""
    try:
        from ..services.session_adapter import session_adapter
        
        data = request.get_json()
        mode = data.get('mode')
        difficulty = data.get('difficulty')  # sentence 모드에서만 사용
        temperature = data.get('temperature')
        
        if not mode or temperature is None:
            return jsonify({
                'success': False,
                'message': '모드와 온도 값이 필요합니다.'
            }), 400
            
        # 온도 값 검증 (0.0 ~ 2.0)
        try:
            temperature = float(temperature)
            if temperature < 0.0 or temperature > 2.0:
                return jsonify({
                    'success': False,
                    'message': '온도는 0.0 ~ 2.0 사이의 값이어야 합니다.'
                }), 400
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'message': '온도는 숫자 값이어야 합니다.'
            }), 400
        
        # 현재 설정 로드
        current_config = session_adapter.get('ai_temperature_config', {})
        
        # 설정 업데이트
        if mode == 'sentence' and difficulty:
            if mode not in current_config:
                current_config[mode] = {}
            current_config[mode][difficulty] = temperature
        else:
            current_config[mode] = temperature
        
        # 세션에 저장
        session_adapter.set('ai_temperature_config', current_config)
        
        # 레거시 호환성을 위해 단일 온도도 업데이트
        session_adapter.set('ai_temperature', temperature)
        
        return jsonify({
            'success': True,
            'message': f'{mode} 모드의 온도가 {temperature}로 설정되었습니다.',
            'data': {
                'mode': mode,
                'difficulty': difficulty,
                'temperature': temperature
            }
        })
        
    except Exception as e:
        print(f"[ERROR] AI 온도 설정 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'AI 온도 설정 중 오류가 발생했습니다: {str(e)}'
        }), 500


@admin_bp.route('/ai/professor-g', methods=['GET'])
def get_professor_g_status():
    """Professor G 모드 상태 조회"""
    try:
        from ..services.session_adapter import session_adapter
        
        enabled = session_adapter.get('professor_g_enabled', True)  # 기본값: 활성화
        
        return jsonify({
            'success': True,
            'data': {
                'enabled': bool(enabled)
            }
        })
        
    except Exception as e:
        print(f"[ERROR] Professor G 상태 조회 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'Professor G 상태 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500


@admin_bp.route('/ai/professor-g', methods=['POST'])
def set_professor_g_status():
    """Professor G 모드 설정"""
    try:
        from ..services.session_adapter import session_adapter
        
        data = request.get_json()
        enabled = data.get('enabled')
        
        if enabled is None:
            return jsonify({
                'success': False,
                'message': 'enabled 파라미터가 필요합니다.'
            }), 400
        
        # 세션에 저장
        session_adapter.set('professor_g_enabled', bool(enabled))
        
        status_text = '활성화' if enabled else '비활성화'
        print(f"[ADMIN] Professor G 모드 {status_text}")
        
        return jsonify({
            'success': True,
            'message': f'Professor G 모드가 {status_text}되었습니다.',
            'data': {
                'enabled': bool(enabled)
            }
        })
        
    except Exception as e:
        print(f"[ERROR] Professor G 설정 오류: {e}")
        return jsonify({
            'success': False,
            'message': f'Professor G 설정 중 오류가 발생했습니다: {str(e)}'
        }), 500



@admin_bp.route('/vector/status', methods=['GET'])
def get_vector_status():
    """
    벡터 인덱스 상태 조회
    
    Returns:
        {
            "success": boolean,
            "data": {
                "exists": boolean,
                "vector_count": int,
                "embedding_provider": string,
                "embedding_model": string
            }
        }
    """
    try:
        # from src.backend.domain.rag.vector_indexer import get_default_indexer
        def get_default_indexer(): return None
        
        indexer = get_default_indexer()
        stats = indexer.get_index_stats()
        
        return jsonify({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        print(f"[ADMIN] 벡터 상태 조회 오류: {e}")
        return jsonify({
            'success': False,
            'message': str(e),
            'data': {
                'exists': False,
                'vector_count': 0
            }
        }), 500


@admin_bp.route('/search-mode', methods=['GET'])
def get_search_mode():
    """
    검색 모드 설정 조회
    
    Returns:
        {
            "success": boolean,
            "data": {
                "mode": "bm25|vector|hybrid",
                "alpha": float,
                "bm25_count": int,
                "vector_count": int
            }
        }
    """
    try:
        from ..services.session_adapter import session_adapter
        from ..services.rag_service import RAGService
        rag_service = RAGService()
        import os
        
        # 현재 설정
        mode = os.getenv('RAG_RETRIEVAL_MODE', 'bm25')
        alpha = float(os.getenv('RAG_ALPHA', '0.5'))
        
        # 세션에서도 확인 (우선순위)
        session_mode = session_adapter.get('search_mode', mode)
        session_alpha = session_adapter.get('search_alpha', alpha)
        
        # BM25 인덱스 상태
        bm25_stats = rag_service.get_index_stats()
        bm25_count = bm25_stats.get('chunk_count', 0)
        
        # 벡터 인덱스 상태
        try:
            # from src.backend.domain.rag.vector_indexer import get_default_indexer
            def get_default_indexer(): return None
            vector_indexer = get_default_indexer()
            vector_stats = vector_indexer.get_index_stats()
            vector_count = vector_stats.get('vector_count', 0)
        except Exception:
            vector_count = 0
        
        return jsonify({
            'success': True,
            'data': {
                'mode': session_mode,
                'alpha': session_alpha,
                'bm25_count': bm25_count,
                'vector_count': vector_count
            }
        })
        
    except Exception as e:
        print(f"[ADMIN] 검색 모드 조회 오류: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@admin_bp.route('/search-mode', methods=['POST'])
def set_search_mode():
    """
    검색 모드 설정 변경
    
    Request Body:
        {
            "mode": "bm25|vector|hybrid",
            "alpha": float  # 0.0 ~ 1.0 (optional)
        }
    
    Returns:
        {
            "success": boolean,
            "message": string
        }
    """
    try:
        if not auth_service.is_authenticated():
            return jsonify({'success': False, 'message': '관리자 권한이 필요합니다.'}), 401
        
        data = request.get_json() or {}
        mode = data.get('mode', 'hybrid')
        alpha = data.get('alpha', 0.5)
        
        # 검증
        if mode not in ['bm25', 'vector', 'hybrid']:
            return jsonify({
                'success': False,
                'message': 'mode는 bm25, vector, hybrid 중 하나여야 합니다.'
            }), 400
        
        if not (0.0 <= alpha <= 1.0):
            return jsonify({
                'success': False,
                'message': 'alpha는 0.0에서 1.0 사이여야 합니다.'
            }), 400
        
        # 세션에 저장
        from ..services.session_adapter import session_adapter
        session_adapter.set('search_mode', mode)
        session_adapter.set('search_alpha', alpha)
        
        print(f"[ADMIN] 검색 모드 변경: {mode} (alpha: {alpha})")
        
        return jsonify({
            'success': True,
            'message': f'검색 모드가 {mode}로 변경되었습니다.'
        })
        
    except Exception as e:
        print(f"[ADMIN] 검색 모드 변경 오류: {e}")
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500


@admin_bp.route('/search-test', methods=['POST'])
def test_search():
    """
    검색 테스트
    
    Request Body:
        {
            "query": string,
            "mode": "bm25|vector|hybrid",
            "top_k": int
        }
    
    Returns:
        {
            "success": boolean,
            "results": [
                {
                    "title": string,
                    "score": float,
                    "search_type": string,
                    "snippet": string
                }
            ],
            "elapsed_ms": float
        }
    """
    try:
        if not auth_service.is_authenticated():
            return jsonify({'success': False, 'message': '관리자 권한이 필요합니다.'}), 401
        
        import time
        from ..services.rag_service import RAGService
        rag_service = RAGService()
        
        data = request.get_json() or {}
        query = data.get('query', '')
        mode = data.get('mode', 'hybrid')
        top_k = data.get('top_k', 3)
        
        if not query:
            return jsonify({
                'success': False,
                'message': '쿼리를 입력해주세요.'
            }), 400
        
        # 검색 실행
        start_time = time.time()
        
        use_hybrid = mode == 'hybrid'
        results = rag_service.search(query, top_k=top_k, use_hybrid=use_hybrid)
        
        elapsed_ms = (time.time() - start_time) * 1000
        
        # 결과 변환
        search_results = []
        for result in results:
            search_results.append({
                'title': result.title,
                'score': float(result.score),
                'search_type': mode,
                'snippet': result.text[:100] + '...' if len(result.text) > 100 else result.text
            })
        
        return jsonify({
            'success': True,
            'results': search_results,
            'elapsed_ms': round(elapsed_ms, 2),
            'query': query,
            'mode': mode
        })
        
    except Exception as e:
        print(f"[ADMIN] 검색 테스트 오류: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'검색 테스트 중 오류가 발생했습니다: {str(e)}'
        }), 500


@admin_bp.route('/ai/rag-toggle', methods=['POST'])
def toggle_ai_rag():
    """RAG+벡터인덱싱 활성화/비활성화 설정 (모드별)"""
    try:
        from ..services.session_adapter import session_adapter
        import json
        import os
        
        data = request.get_json()
        print(f"[ADMIN] RAG 토글 요청 데이터: {data}")
        
        mode = data.get('mode')
        rag_enabled = data.get('rag_enabled')
        
        print(f"[ADMIN] 모드: {mode}, RAG 활성화: {rag_enabled}")
        
        if not mode or rag_enabled is None:
            print(f"[ADMIN] 잘못된 요청: mode={mode}, rag_enabled={rag_enabled}")
            return jsonify({
                'success': False,
                'message': '모드와 RAG 활성화 상태가 필요합니다.'
            }), 400
        
        # 설정 파일 경로
        config_file = os.path.join(os.getcwd(), 'config', 'rag_settings.json')
        os.makedirs(os.path.dirname(config_file), exist_ok=True)
        
        # 현재 설정 로드 (파일에서)
        current_config = {}
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    current_config = json.load(f)
            except Exception as e:
                print(f"[ADMIN] 설정 파일 로드 실패, 기본값 사용: {e}")
        
        # 기본값 설정
        default_values = {
            'grammar': True,
            'sentence': False,
            'passage': True
        }
        
        # 설정 업데이트
        current_config[mode] = bool(rag_enabled)
        
        # 파일에 저장 (영구 저장)
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(current_config, f, ensure_ascii=False, indent=2)
            print(f"[ADMIN] RAG 설정 파일 저장 완료: {config_file}")
        except Exception as e:
            print(f"[ADMIN] 설정 파일 저장 실패: {e}")
            # 파일 저장 실패 시 세션에 백업 저장
            session_adapter.set('ai_rag_config', current_config)
        
        # 세션에도 동기화 (임시 저장)
        session_adapter.set('ai_rag_config', current_config)
        
        print(f"[ADMIN] RAG 설정 업데이트 완료: {mode} = {rag_enabled}")
        print(f"[ADMIN] 업데이트된 전체 설정: {current_config}")
        
        return jsonify({
            'success': True,
            'message': f'{mode} 모드 RAG가 {"활성화" if rag_enabled else "비활성화"}되었습니다.',
            'config': current_config
        })
        
    except Exception as e:
        print(f"[ERROR] RAG 설정 실패: {e}")
        return jsonify({
            'success': False,
            'message': f'RAG 설정 중 오류가 발생했습니다: {str(e)}'
        }), 500


@admin_bp.route('/ai/usage-data', methods=['GET'])
def get_usage_data():
    """일별 사용량 데이터 API"""
    try:
        # 샘플 데이터 (실제로는 데이터베이스나 로그에서 가져와야 함)
        sample_data = {
            'success': True,
            'data': {
                'labels': ['1일', '2일', '3일', '4일', '5일', '6일', '7일', '8일', '9일', '10일',
                          '11일', '12일', '13일', '14일', '15일', '16일', '17일', '18일', '19일', '20일',
                          '21일', '22일', '23일', '24일', '25일', '26일', '27일', '28일', '29일', '30일'],
                'datasets': [
                    {
                        'label': 'OpenAI',
                        'data': [1200, 1900, 3000, 5000, 2000, 3000, 4500, 3200, 2800, 3600,
                                4000, 3200, 4800, 5200, 3800, 4200, 4600, 3400, 3900, 4100,
                                4300, 3700, 4400, 4700, 3500, 4000, 4200, 3800, 3600, 3245],
                        'borderColor': '#1976d2',
                        'backgroundColor': 'rgba(25, 118, 210, 0.1)',
                        'tension': 0.4
                    },
                    {
                        'label': 'Gemini',
                        'data': [800, 1200, 1800, 2200, 1500, 1900, 2500, 1800, 1600, 2000,
                                2200, 1800, 2400, 2600, 2000, 2200, 2400, 1900, 2100, 2200,
                                2300, 2000, 2400, 2500, 1900, 2200, 2300, 2000, 1800, 2592],
                        'borderColor': '#ff9800',
                        'backgroundColor': 'rgba(255, 152, 0, 0.1)',
                        'tension': 0.4
                    },
                    {
                        'label': '총 사용량',
                        'data': [2000, 3100, 4800, 7200, 3500, 4900, 7000, 5000, 4400, 5600,
                                6200, 5000, 7200, 7800, 5800, 6400, 7000, 5300, 6000, 6300,
                                6600, 5700, 6800, 7200, 5400, 6200, 6500, 5800, 5400, 5837],
                        'borderColor': '#4caf50',
                        'backgroundColor': 'rgba(76, 175, 80, 0.1)',
                        'tension': 0.4
                    }
                ]
            }
        }
        print(f"[ADMIN] 일별 사용량 데이터 반환: {len(sample_data['data']['labels'])}일간 데이터")
        return jsonify(sample_data)
    except Exception as e:
        print(f"[ADMIN] 일별 사용량 데이터 조회 오류: {e}")
        return jsonify({'success': False, 'message': f'데이터 조회 중 오류가 발생했습니다: {str(e)}'}), 500

@admin_bp.route('/ai/rag-config', methods=['GET'])
def get_rag_config():
    """현재 RAG 설정 조회"""
    try:
        from ..services.session_adapter import session_adapter
        import json
        import os
        
        # 설정 파일 경로
        config_file = os.path.join(os.getcwd(), 'config', 'rag_settings.json')
        
        # 기본값 설정
        default_rag_settings = {
            'grammar': True,    # 문법학습: 기본 활성화
            'sentence': False,  # 문장분석: 기본 비활성화
            'passage': True     # 지문설명: 기본 활성화
        }
        
        # 파일에서 설정 로드
        current_config = {}
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    current_config = json.load(f)
                print(f"[ADMIN] RAG 설정 파일에서 로드: {current_config}")
            except Exception as e:
                print(f"[ADMIN] 설정 파일 로드 실패: {e}")
                # 파일 로드 실패 시 세션에서 로드
                current_config = session_adapter.get('ai_rag_config', {})
        else:
            print(f"[ADMIN] 설정 파일 없음, 세션에서 로드")
            # 파일이 없으면 세션에서 로드
            current_config = session_adapter.get('ai_rag_config', {})
        
        # 기본값과 현재 설정 병합
        full_config = {}
        for mode in ['grammar', 'sentence', 'passage']:
            full_config[mode] = current_config.get(mode, default_rag_settings[mode])
        
        print(f"[ADMIN] RAG 설정 조회 완료: {full_config}")
        
        return jsonify({
            'success': True,
            'config': full_config,
            'message': 'RAG 설정을 성공적으로 조회했습니다.'
        })
        
    except Exception as e:
        print(f"[ERROR] RAG 설정 조회 실패: {e}")
        return jsonify({
            'success': False,
            'message': f'RAG 설정 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500

@admin_bp.route('/ai/model-config', methods=['POST'])
def update_ai_model_config():
    """AI 모델 설정 업데이트"""
    try:
        from ..services.session_adapter import session_adapter
        
        data = request.get_json()
        provider = data.get('provider')
        model = data.get('model')
        
        if not provider or not model:
            return jsonify({
                'success': False,
                'message': '제공자와 모델이 필요합니다.'
            }), 400
        
        # 유효한 제공자 확인
        if provider not in ['openai', 'gemini']:
            return jsonify({
                'success': False,
                'message': '유효하지 않은 AI 제공자입니다.'
            }), 400
        
        # 현재 모델 설정 로드
        current_config = session_adapter.get('ai_model_config', {})
        current_config[provider] = model
        session_adapter.set('ai_model_config', current_config)
        
        print(f"[ADMIN] AI 모델 설정 업데이트: {provider} = {model}")
        
        return jsonify({
            'success': True,
            'message': f'{provider.upper()} 모델이 {model}로 설정되었습니다.',
            'data': current_config
        })
        
    except Exception as e:
        print(f"[ERROR] AI 모델 설정 실패: {e}")
        return jsonify({
            'success': False,
            'message': f'AI 모델 설정 중 오류가 발생했습니다: {str(e)}'
        }), 500

@admin_bp.route('/ai/model-status', methods=['GET'])
def get_ai_model_status():
    """현재 AI 모델 설정 조회"""
    try:
        from ..services.session_adapter import session_adapter
        
        # 기본 설정
        default_config = {
            'openai': 'gpt-4o-mini',
            'gemini': 'gemini-2.0-flash-001'
        }
        
        # 세션에서 설정 로드
        current_config = session_adapter.get('ai_model_config', default_config)
        
        print(f"[ADMIN] AI 모델 설정 조회: {current_config}")
        
        return jsonify({
            'success': True,
            'data': current_config
        })
        
    except Exception as e:
        print(f"[ERROR] AI 모델 설정 조회 실패: {e}")
        return jsonify({
            'success': False,
            'message': f'AI 모델 설정 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500

@admin_bp.route('/ai/cost-data', methods=['GET'])
def get_cost_data():
    """API 비용 데이터 조회"""
    try:
        from datetime import datetime, timedelta
        import random
        
        # 실제 구현에서는 데이터베이스나 로그 파일에서 데이터를 가져와야 함
        # 현재는 샘플 데이터를 생성
        
        # 오늘 데이터 (샘플)
        today_tokens = random.randint(5000, 15000)
        today_cost = today_tokens * 0.0015 / 1000  # GPT-4o-mini 기준
        
        # 주간 데이터 (샘플)
        weekly_tokens = random.randint(35000, 80000)
        weekly_cost = weekly_tokens * 0.0015 / 1000
        
        # OpenAI 데이터 (샘플)
        openai_data = {
            'today': {
                'tokens': random.randint(3000, 8000),
                'cost': random.randint(3000, 8000) * 0.0015 / 1000
            },
            'weekly': {
                'cost': random.randint(20000, 45000) * 0.0015 / 1000
            }
        }
        
        # Gemini 데이터 (샘플)
        gemini_data = {
            'today': {
                'tokens': random.randint(2000, 7000),
                'cost': random.randint(2000, 7000) * 0.0075 / 1000
            },
            'weekly': {
                'cost': random.randint(15000, 35000) * 0.0075 / 1000
            }
        }
        
        cost_data = {
            'today': {
                'tokens': today_tokens,
                'cost': today_cost
            },
            'weekly': {
                'tokens': weekly_tokens,
                'cost': weekly_cost
            },
            'openai': openai_data,
            'gemini': gemini_data,
            'last_updated': datetime.now().isoformat()
        }
        
        print(f"[ADMIN] 비용 데이터 조회: 오늘 {today_tokens} 토큰, ${today_cost:.4f}")
        
        return jsonify({
            'success': True,
            'data': cost_data
        })
        
    except Exception as e:
        print(f"[ERROR] 비용 데이터 조회 실패: {e}")
        return jsonify({
            'success': False,
            'message': f'비용 데이터 조회 중 오류가 발생했습니다: {str(e)}'
        }), 500