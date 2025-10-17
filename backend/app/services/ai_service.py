"""
Like-Opt - AI Service

AI 통합 서비스 (OpenAI, Google Gemini)
"""

import os
from typing import Dict, Any, Optional, List, Iterator
from enum import Enum


class AIProvider(str, Enum):
    """AI 제공자 열거형"""
    OPENAI = "openai"
    GEMINI = "gemini"


class AIService:
    """AI 통합 서비스 클래스"""
    
    def __init__(self):
        self.openai_client = None
        self.gemini_client = None
        self._initialize_clients()
    
    def _initialize_clients(self):
        """AI 클라이언트 초기화"""
        try:
            # OpenAI 클라이언트 초기화
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if openai_api_key:
                import openai
                self.openai_client = openai.OpenAI(api_key=openai_api_key)
                print("[AI] OpenAI client initialized successfully")
            else:
                print("[AI] OpenAI API key not configured")
            
            # Google Gemini 클라이언트 초기화
            gemini_api_key = os.getenv('GEMINI_API_KEY')
            if gemini_api_key:
                import google.generativeai as genai
                genai.configure(api_key=gemini_api_key)
                self.gemini_client = genai.GenerativeModel('gemini-1.5-flash')
                print("[AI] Google Gemini client initialized successfully")
            else:
                print("[AI] Google Gemini API key not configured")
                
        except Exception as e:
            print(f"[AI] Client initialization failed: {e}")
    
    def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        provider: str = "openai",
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        AI 응답 생성
        
        Args:
            messages: 대화 메시지 리스트
            provider: AI 제공자 ('openai' 또는 'gemini')
            temperature: 창의성 수준 (0.0-2.0)
            max_tokens: 최대 토큰 수
            
        Returns:
            str: AI 응답
        """
        try:
            if provider == AIProvider.OPENAI and self.openai_client:
                return self._generate_openai_response(messages, temperature, max_tokens)
            elif provider == AIProvider.GEMINI and self.gemini_client:
                return self._generate_gemini_response(messages, temperature, max_tokens)
            else:
                return "죄송합니다. AI 서비스를 사용할 수 없습니다."
                
        except Exception as e:
            print(f"[AI] 응답 생성 실패: {e}")
            return f"오류가 발생했습니다: {str(e)}"
    
    def _generate_openai_response(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float,
        max_tokens: Optional[int]
    ) -> str:
        """OpenAI 응답 생성"""
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens or 1000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"[AI] OpenAI 응답 생성 실패: {e}")
            raise
    
    def _generate_gemini_response(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float,
        max_tokens: Optional[int]
    ) -> str:
        """Google Gemini 응답 생성"""
        try:
            # Gemini는 시스템 메시지를 지원하지 않으므로 첫 번째 사용자 메시지에 병합
            if messages and messages[0].get('role') == 'system':
                system_msg = messages[0]['content']
                user_msg = messages[1]['content'] if len(messages) > 1 else ""
                prompt = f"{system_msg}\n\n{user_msg}"
            else:
                prompt = messages[-1]['content'] if messages else ""
            
            response = self.gemini_client.generate_content(
                prompt,
                generation_config={
                    'temperature': temperature,
                    'max_output_tokens': max_tokens or 1000
                }
            )
            
            return response.text
            
        except Exception as e:
            print(f"[AI] Gemini 응답 생성 실패: {e}")
            raise
    
    def stream_response(
        self, 
        messages: List[Dict[str, str]], 
        provider: str = "openai",
        temperature: float = 0.7
    ) -> Iterator[str]:
        """
        AI 응답 스트리밍
        
        Args:
            messages: 대화 메시지 리스트
            provider: AI 제공자
            temperature: 창의성 수준
            
        Yields:
            str: 스트리밍 응답 청크
        """
        try:
            if provider == AIProvider.OPENAI and self.openai_client:
                yield from self._stream_openai_response(messages, temperature)
            elif provider == AIProvider.GEMINI and self.gemini_client:
                yield from self._stream_gemini_response(messages, temperature)
            else:
                yield "죄송합니다. AI 서비스를 사용할 수 없습니다."
                
        except Exception as e:
            print(f"[AI] 스트리밍 응답 실패: {e}")
            yield f"오류가 발생했습니다: {str(e)}"
    
    def _stream_openai_response(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float
    ) -> Iterator[str]:
        """OpenAI 스트리밍 응답"""
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=temperature,
                stream=True
            )
            
            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            print(f"[AI] OpenAI 스트리밍 실패: {e}")
            raise
    
    def _stream_gemini_response(
        self, 
        messages: List[Dict[str, str]], 
        temperature: float
    ) -> Iterator[str]:
        """Google Gemini 스트리밍 응답"""
        try:
            # Gemini는 스트리밍을 지원하지 않으므로 일반 응답을 청크로 분할
            response = self._generate_gemini_response(messages, temperature, None)
            
            # 간단한 청크 분할 (단어 단위)
            words = response.split()
            for word in words:
                yield word + " "
                
        except Exception as e:
            print(f"[AI] Gemini 스트리밍 실패: {e}")
            raise
    
    def get_available_providers(self) -> List[str]:
        """
        사용 가능한 AI 제공자 목록
        
        Returns:
            List[str]: 사용 가능한 제공자 목록
        """
        providers = []
        
        if self.openai_client:
            providers.append(AIProvider.OPENAI.value)
        
        if self.gemini_client:
            providers.append(AIProvider.GEMINI.value)
        
        return providers
    
    def is_provider_available(self, provider: str) -> bool:
        """
        특정 제공자 사용 가능 여부 확인
        
        Args:
            provider: AI 제공자
            
        Returns:
            bool: 사용 가능 여부
        """
        return provider in self.get_available_providers()

# 전역 AI 서비스 인스턴스
ai_service = AIService()
