import re
import uuid
import httpx
from typing import Optional
from pydantic import BaseModel, Field, field_validator, conint

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

NATURAL_NUM = conint(ge=1)
user_id_set = Field(
        examples=["shaa97102"],
        title="유저 id",
        min_length=1, max_length=50,
        description="유저 id 길이 제약"
)
id_set = Field(
    examples=["123e4567-e89b-12d3-a456-426614174000"],
    title="채팅방 id",
    min_length=1, max_length=36,
    description="UUID 형식"
)
character_idx_set = Field(
    examples=[1],
    title="캐릭터 id",
    description="int 형식"
)
img_url_set = Field(
    examples=["https://drive.google.com/thumbnail?id=12PqUS6bj4eAO_fLDaWQmoq94-771xfim"],
    title="이미지 URL",
    min_length=1, max_length=2048,
    description="URL의 최대 길이는 일반적으로 2048자"
)
input_data_set = Field(
    examples=["안녕하세요, 챗봇!"],
    title="사용자 입력 문장",
    min_length=1, max_length=500,
    description="사용자 입력 문장 길이 제약"
)
output_data_set = Field(
    examples=["안녕하세요! 무엇을 도와드릴까요?"],
    title="챗봇 출력 문장",
    min_length=1, max_length=8191,
    description="챗봇 출력 문장 길이 제약"
)
index_set = Field(
    examples=[1],
    title="채팅방 log index",
    description="int 형식"
)
value_set = Field(
    examples=[{}],
    title="채팅 로그"
)

# Public ---------------------------------------------------------------------------------------------------

class Identifier_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    
    @field_validator('id', mode='before')
    def check_id(cls, v):
        return Validators.validate_uuid(v)

class Log_Delete_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    index: NATURAL_NUM = index_set # type: ignore
    
    @field_validator('id', mode='before')
    def check_id(cls, v):
        return Validators.validate_uuid(v)

class Room_Delete_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    
    @field_validator('id', mode='before')
    def check_id(cls, v):
        return Validators.validate_uuid(v)

# Office ---------------------------------------------------------------------------------------------------

class Office_Id_Request(BaseModel):
    user_id: str = user_id_set

class Office_Create_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    input_data: str = input_data_set
    output_data: str = output_data_set
    
    @field_validator('id', mode='before') # mode='before'는 필드 값이 검증되기 전에 호출
    def check_id(cls, v):
        return Validators.validate_uuid(v)
    
    def model_dump(self, **kwargs):
        """
        Pydantic BaseModel의 dict() 메서드를 대체하는 model_dump() 메서드입니다.
        필터링된 데이터만 반환하도록 수정할 수 있습니다.
        """
        return super().model_dump(**kwargs)

class Office_Update_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    input_data: str = input_data_set
    output_data: str = output_data_set
    index: NATURAL_NUM = index_set # type: ignore
    
    @field_validator('id', mode='before')
    def check_id(cls, v):
        return Validators.validate_uuid(v)
    
    def model_dump(self, **kwargs):
        """
        Pydantic BaseModel의 dict() 메서드를 대체하는 model_dump() 메서드입니다.
        필터링된 데이터만 반환하도록 수정할 수 있습니다.
        """
        return super().model_dump(**kwargs)
    
# Office용 새로운 응답 모델 추가
class OfficeResponse(BaseModel):
    id: str = id_set
    value: list = value_set
        
    @field_validator('id', mode='before')
    def check_id(cls, v):
        return Validators.validate_uuid(v)


# ChatBot ---------------------------------------------------------------------------------------------------

class ChatBot_Id_Request(BaseModel):
    user_id: str = user_id_set
    character_idx: int = character_idx_set
    
class ChatBot_Create_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    img_url: str = img_url_set
    input_data: str = input_data_set
    output_data: str = output_data_set
    
    @field_validator('id', mode='before') # mode='before'는 필드 값이 검증되기 전에 호출
    def check_id(cls, v):
        return Validators.validate_uuid(v)
    
    # @field_validator('img_url', mode='before')
    # def check_img_url(cls, v):
    #     return Validators.validate_URL(v)
    
    def model_dump(self, **kwargs):
        """
        Pydantic BaseModel의 dict() 메서드를 대체하는 model_dump() 메서드입니다.
        필터링된 데이터만 반환하도록 수정할 수 있습니다.
        """
        return super().model_dump(**kwargs)

class ChatBot_Update_Request(BaseModel):
    user_id: str = user_id_set
    id: str = id_set
    img_url: str = img_url_set
    input_data: str = input_data_set
    output_data: str = output_data_set
    index: NATURAL_NUM = index_set # type: ignore
    
    @field_validator('id', mode='before')
    def check_id(cls, v):
        return Validators.validate_uuid(v)
    
    # @field_validator('img_url', mode='before')
    # def check_img_url(cls, v):
    #     return Validators.validate_URL(v)
    
    def model_dump(self, **kwargs):
        """
        Pydantic BaseModel의 dict() 메서드를 대체하는 model_dump() 메서드입니다.
        필터링된 데이터만 반환하도록 수정할 수 있습니다.
        """
        return super().model_dump(**kwargs)

class ChatBotResponse(BaseModel):
    id: str = id_set
    character_idx: int = character_idx_set
    value: list = value_set
        
    @field_validator('id', mode='before')
    def check_id(cls, v):
        return Validators.validate_uuid(v)

# SMTP 이메일 인증 관련 모델 --------------------------------------------------------------------
class EmailSchema(BaseModel):
    email: str = Field(
        examples=["user@example.com"],
        title="이메일 주소",
        description="인증 코드를 전송할 이메일 주소",
    )
    
    @field_validator('email')
    def validate_email(cls, v):
        email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        if not email_pattern.match(v):
            raise ValueError('유효한 이메일 형식이 아닙니다.')
        return v

class VerificationSchema(BaseModel):
    email: str = Field(
        examples=["user@example.com"],
        title="이메일 주소",
        description="인증 코드를 전송한 이메일 주소",
    )
    code: str = Field(
        examples=["123456"],
        title="인증 코드",
        description="6자리 인증 코드",
        min_length=6,
        max_length=6,
    )
    
    @field_validator('email')
    def validate_email(cls, v):
        email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        if not email_pattern.match(v):
            raise ValueError('유효한 이메일 형식이 아닙니다.')
        return v
    
    @field_validator('code')
    def validate_code(cls, v):
        # 대문자 알파벳 또는 숫자 6자리만 허용
        if not re.fullmatch(r'[A-Z0-9]{6}', v):
            raise ValueError('인증 코드는 6자리 대문자 알파벳 또는 숫자여야 합니다.')
        return v