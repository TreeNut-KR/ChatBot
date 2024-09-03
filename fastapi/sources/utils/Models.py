import re
import uuid
import httpx
from typing import Optional
from pydantic import BaseModel, Field, field_validator

class Validators:
    @staticmethod
    def validate_uuid(v: str) -> str:
        """
        UUID 형식 검증 함수
        """
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError('유효한 UUID 형식이 아닙니다.')
        return v

    @staticmethod
    def validate_URL(v: str) -> str:
        """
        URL 형식 검증 함수
        """
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

    @staticmethod
    async def url_status(img_url: str):
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

user_id_set: str = Field(
        examples=["shaa97102"],
        title="유저 id",
        min_length=6, max_length=50,
        description="유저 id 길이 제약"
)
id_set: str = Field(
    examples=["123e4567-e89b-12d3-a456-426614174000"],
    title="채팅방 id",
    min_length=1, max_length=36,
    description="UUID 형식"
)
img_url_set: str = Field(
    examples=["https://drive.google.com/thumbnail?id=12PqUS6bj4eAO_fLDaWQmoq94-771xfim"],
    title="이미지 URL",
    min_length=1, max_length=2048,
    description="URL의 최대 길이는 일반적으로 2048자"
)
input_data_set: str = Field(
    examples=["안녕하세요, 챗봇!"],
    title="사용자 입력 문장",
    min_length=1, max_length=500,
    description="사용자 입력 문장 길이 제약"
)
output_data_set: str = Field(
    examples=["안녕하세요! 무엇을 도와드릴까요?"],
    title="챗봇 출력 문장",
    min_length=1, max_length=500,
    description="챗봇 출력 문장 길이 제약"
)
index_set: int = Field(
    examples=[1],
    title="채팅방 log index",
    description="int 형식"
)

class ChatLog_Create_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    img_url: str = img_url_set
    input_data: str = input_data_set
    output_data: str = output_data_set
    
    @field_validator('id', mode='before') # mode='before'는 필드 값이 검증되기 전에 호출
    def check_id(cls, v):
        return Validators.validate_uuid(v)
    
    @field_validator('img_url', mode='before')
    def check_img_url(cls, v):
        return Validators.validate_URL(v)
    
    def model_dump(self, **kwargs):
        """
        Pydantic BaseModel의 dict() 메서드를 대체하는 model_dump() 메서드입니다.
        필터링된 데이터만 반환하도록 수정할 수 있습니다.
        """
        return super().model_dump(**kwargs)


class ChatLog_Update_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    img_url: str = img_url_set
    input_data: str = input_data_set
    output_data: str = output_data_set
    index: int = index_set
    
    @field_validator('id', mode='before')
    def check_id(cls, v):
        return Validators.validate_uuid(v)
    
    @field_validator('img_url', mode='before')
    def check_img_url(cls, v):
        return Validators.validate_URL(v)
    
    def model_dump(self, **kwargs):
        """
        Pydantic BaseModel의 dict() 메서드를 대체하는 model_dump() 메서드입니다.
        필터링된 데이터만 반환하도록 수정할 수 있습니다.
        """
        return super().model_dump(**kwargs)
        
class ChatLog_Identifier_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    
    @field_validator('id', mode='before')
    def check_id(cls, v):
        return Validators.validate_uuid(v)

class ChatLog_Delete_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    index: int = index_set
    
    @field_validator('id', mode='before')
    def check_id(cls, v):
        return Validators.validate_uuid(v)
    
class ChatRoom_Delete_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set

class ChatLog_Id_Request(BaseModel):
    user_id: str = user_id_set

class ChatData_Response(BaseModel):
    id: str = Field(examples=["123e4567-e89b-12d3-a456-426614174000"], title="채팅 id")
    value: list = Field(examples=[{}], title="채팅 로그")