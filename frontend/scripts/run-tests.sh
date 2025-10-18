#!/bin/bash

# Like-Opt 프론트엔드 테스트 실행 스크립트

set -e

echo "🧪 Like-Opt 프론트엔드 테스트 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 테스트 타입 확인
TEST_TYPE=${1:-"all"}

# 의존성 설치 확인
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 의존성 설치 중...${NC}"
    npm install
fi

# 테스트 실행 함수
run_unit_tests() {
    echo -e "${BLUE}🔬 단위 테스트 실행...${NC}"
    npm run test:coverage
}

run_integration_tests() {
    echo -e "${BLUE}🔗 통합 테스트 실행...${NC}"
    npm run test -- --testPathPattern="integration"
}

run_e2e_tests() {
    echo -e "${BLUE}🎭 E2E 테스트 실행...${NC}"
    npm run test:e2e
}

run_lint_tests() {
    echo -e "${BLUE}🔍 린트 검사 실행...${NC}"
    npm run lint
}

# 백엔드 서버 상태 확인
check_backend() {
    echo -e "${YELLOW}🔍 백엔드 서버 상태 확인...${NC}"
    
    if curl -s http://localhost:5001/api/v1/health > /dev/null; then
        echo -e "${GREEN}✅ 백엔드 서버가 실행 중입니다.${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ 백엔드 서버가 실행되지 않았습니다.${NC}"
        echo -e "${YELLOW}   통합 테스트는 스킵됩니다.${NC}"
        return 1
    fi
}

# 테스트 결과 요약
summarize_results() {
    local exit_code=$1
    local test_type=$2
    
    echo ""
    echo "=========================================="
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $test_type 테스트가 성공적으로 완료되었습니다!${NC}"
    else
        echo -e "${RED}❌ $test_type 테스트에서 실패가 발생했습니다.${NC}"
    fi
    
    echo "=========================================="
}

# 메인 실행 로직
case $TEST_TYPE in
    "unit")
        run_unit_tests
        summarize_results $? "단위"
        ;;
    "integration")
        if check_backend; then
            run_integration_tests
            summarize_results $? "통합"
        else
            echo -e "${YELLOW}⏭️ 백엔드 서버가 없어 통합 테스트를 스킵합니다.${NC}"
        fi
        ;;
    "e2e")
        if check_backend; then
            run_e2e_tests
            summarize_results $? "E2E"
        else
            echo -e "${YELLOW}⏭️ 백엔드 서버가 없어 E2E 테스트를 스킵합니다.${NC}"
        fi
        ;;
    "lint")
        run_lint_tests
        summarize_results $? "린트"
        ;;
    "all")
        echo -e "${BLUE}🚀 전체 테스트 실행...${NC}"
        
        # 린트 검사
        run_lint_tests
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ 린트 검사에서 실패했습니다.${NC}"
            exit 1
        fi
        
        # 단위 테스트
        run_unit_tests
        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ 단위 테스트에서 실패했습니다.${NC}"
            exit 1
        fi
        
        # 백엔드 서버 확인
        if check_backend; then
            # 통합 테스트
            run_integration_tests
            if [ $? -ne 0 ]; then
                echo -e "${RED}❌ 통합 테스트에서 실패했습니다.${NC}"
                exit 1
            fi
            
            # E2E 테스트
            run_e2e_tests
            if [ $? -ne 0 ]; then
                echo -e "${RED}❌ E2E 테스트에서 실패했습니다.${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}⚠️ 백엔드 서버가 없어 통합 및 E2E 테스트를 스킵합니다.${NC}"
        fi
        
        echo -e "${GREEN}🎉 모든 테스트가 성공적으로 완료되었습니다!${NC}"
        ;;
    *)
        echo -e "${RED}❌ 잘못된 테스트 타입입니다.${NC}"
        echo "사용법: $0 [unit|integration|e2e|lint|all]"
        echo ""
        echo "테스트 타입:"
        echo "  unit        - 단위 테스트만 실행"
        echo "  integration - 통합 테스트만 실행"
        echo "  e2e         - E2E 테스트만 실행"
        echo "  lint        - 린트 검사만 실행"
        echo "  all         - 모든 테스트 실행 (기본값)"
        exit 1
        ;;
esac
