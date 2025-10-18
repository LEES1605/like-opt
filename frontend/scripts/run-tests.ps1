# Like-Opt 프론트엔드 테스트 실행 스크립트 (PowerShell)

param(
    [string]$TestType = "all"
)

# 에러 발생 시 스크립트 중단
$ErrorActionPreference = "Stop"

Write-Host "🧪 Like-Opt 프론트엔드 테스트 시작..." -ForegroundColor Cyan

# 색상 함수
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Blue }

# 의존성 설치 확인
if (-not (Test-Path "node_modules")) {
    Write-Warning "📦 의존성 설치 중..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ 의존성 설치에 실패했습니다."
        exit 1
    }
}

# 테스트 실행 함수들
function Run-UnitTests {
    Write-Info "🔬 단위 테스트 실행..."
    npm run test:coverage
    return $LASTEXITCODE
}

function Run-IntegrationTests {
    Write-Info "🔗 통합 테스트 실행..."
    npm run test -- --testPathPattern="integration"
    return $LASTEXITCODE
}

function Run-E2ETests {
    Write-Info "🎭 E2E 테스트 실행..."
    npm run test:e2e
    return $LASTEXITCODE
}

function Run-LintTests {
    Write-Info "🔍 린트 검사 실행..."
    npm run lint
    return $LASTEXITCODE
}

# 백엔드 서버 상태 확인
function Test-BackendServer {
    Write-Warning "🔍 백엔드 서버 상태 확인..."
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/api/v1/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "✅ 백엔드 서버가 실행 중입니다."
        return $true
    }
    catch {
        Write-Warning "⚠️ 백엔드 서버가 실행되지 않았습니다."
        Write-Warning "   통합 테스트는 스킵됩니다."
        return $false
    }
}

# 테스트 결과 요약
function Show-TestSummary {
    param(
        [int]$ExitCode,
        [string]$TestType
    )
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Gray
    
    if ($ExitCode -eq 0) {
        Write-Success "✅ $TestType 테스트가 성공적으로 완료되었습니다!"
    } else {
        Write-Error "❌ $TestType 테스트에서 실패가 발생했습니다."
    }
    
    Write-Host "==========================================" -ForegroundColor Gray
}

# 메인 실행 로직
switch ($TestType.ToLower()) {
    "unit" {
        $exitCode = Run-UnitTests
        Show-TestSummary $exitCode "단위"
        exit $exitCode
    }
    
    "integration" {
        if (Test-BackendServer) {
            $exitCode = Run-IntegrationTests
            Show-TestSummary $exitCode "통합"
        } else {
            Write-Warning "⏭️ 백엔드 서버가 없어 통합 테스트를 스킵합니다."
        }
    }
    
    "e2e" {
        if (Test-BackendServer) {
            $exitCode = Run-E2ETests
            Show-TestSummary $exitCode "E2E"
        } else {
            Write-Warning "⏭️ 백엔드 서버가 없어 E2E 테스트를 스킵합니다."
        }
    }
    
    "lint" {
        $exitCode = Run-LintTests
        Show-TestSummary $exitCode "린트"
        exit $exitCode
    }
    
    "all" {
        Write-Info "🚀 전체 테스트 실행..."
        
        # 린트 검사
        $exitCode = Run-LintTests
        if ($exitCode -ne 0) {
            Write-Error "❌ 린트 검사에서 실패했습니다."
            exit $exitCode
        }
        
        # 단위 테스트
        $exitCode = Run-UnitTests
        if ($exitCode -ne 0) {
            Write-Error "❌ 단위 테스트에서 실패했습니다."
            exit $exitCode
        }
        
        # 백엔드 서버 확인
        if (Test-BackendServer) {
            # 통합 테스트
            $exitCode = Run-IntegrationTests
            if ($exitCode -ne 0) {
                Write-Error "❌ 통합 테스트에서 실패했습니다."
                exit $exitCode
            }
            
            # E2E 테스트
            $exitCode = Run-E2ETests
            if ($exitCode -ne 0) {
                Write-Error "❌ E2E 테스트에서 실패했습니다."
                exit $exitCode
            }
        } else {
            Write-Warning "⚠️ 백엔드 서버가 없어 통합 및 E2E 테스트를 스킵합니다."
        }
        
        Write-Success "🎉 모든 테스트가 성공적으로 완료되었습니다!"
    }
    
    default {
        Write-Error "❌ 잘못된 테스트 타입입니다."
        Write-Host "사용법: .\run-tests.ps1 [unit|integration|e2e|lint|all]"
        Write-Host ""
        Write-Host "테스트 타입:"
        Write-Host "  unit        - 단위 테스트만 실행"
        Write-Host "  integration - 통합 테스트만 실행"
        Write-Host "  e2e         - E2E 테스트만 실행"
        Write-Host "  lint        - 린트 검사만 실행"
        Write-Host "  all         - 모든 테스트 실행 (기본값)"
        exit 1
    }
}
