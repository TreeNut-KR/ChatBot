import re
import uuid
import httpx
from pydantic import BaseModel, Field, field_validator

class ChatData_Request(BaseModel):
    id: str = Field(..., title="채팅방 id", min_length=1, max_length=36, description="UUID 형식")
    img_url: str = Field(..., title="이미지 URL", min_length=1, max_length=2048, description="URL의 최대 길이는 일반적으로 2048자")
    input_data: str = Field(..., title="사용자 입력 문장", min_length=1, max_length=500, description="사용자 입력 문장 길이 제약")
    output_data: str = Field(..., title="챗봇 출력 문장", min_length=1, max_length=500, description="챗봇 출력 문장 길이 제약")
    
    @field_validator('id')
    def check_id(cls, v):
        try:
            uuid.UUID(v) # UUID 형식 검증
        except ValueError:
            raise ValueError('유효한 UUID 형식이 아닙니다.')
        return v
    
    @field_validator('img_url')
    def check_img_url(cls, v):
        url_pattern = re.compile(
            r'''
            ^                     # 문자열의 시작
            https?://             # http:// 또는 https://
            (drive\.google\.com)  # Google Drive 도메인
            /thumbnail            # 경로의 일부
            \?id=([a-zA-Z0-9_-]+) # 쿼리 파라미터 id
            $                     # 문자열의 끝
            ''', re.VERBOSE
        )
        if not url_pattern.match(v):
            raise ValueError('유효한 URL 형식이 아닙니다.')
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "img_url": "https://drive.google.com/thumbnail?id=12PqUS6bj4eAO_fLDaWQmoq94-771xfim",
                "input_data": "안녕하세요, 챗봇!",
                "output_data": "안녕하세요! 무엇을 도와드릴까요?"
            }
        }
    }
    
    async def url_status(self, img_url: str):
        '''
        URL의 연결 테스트 함수
        '''
        try:
            async with httpx.AsyncClient() as client:
                response = await client.head(img_url, follow_redirects=True)
            if response.status_code != 200:
                raise ValueError('이미지에 접근할 수 없습니다.')
        except httpx.RequestError:
            raise ValueError('이미지 URL에 접근하는 중 오류가 발생했습니다.')
        
class ChatData_Response(BaseModel):
    id: str = Field(..., title="채팅 id")
    value: list = Field(... , title="채팅 로그")