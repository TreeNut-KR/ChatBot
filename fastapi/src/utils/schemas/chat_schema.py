import re
import uuid
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
    def validate_email(v: str) -> str:
        """
        이메일 형식 검증 함수
        """
        email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        if not email_pattern.match(v):
            raise ValueError('지원하는는 이메일 형식이 아닙니다. 다음과 같은 형식을 따르십쇼. ex) user@example.com')
        return v

    @staticmethod
    def validate_code(v: str) -> str:
        """
        인증 코드 형식 검증 함수
        """
        if not re.fullmatch(r'[A-Z0-9]{6}', v):
            raise ValueError('인증 코드는 6자리 대문자 알파벳 또는 숫자여야 합니다.')
        return v

class BaseModelWithCustomDump(BaseModel):
    def model_dump(self, **kwargs):
        """
        Pydantic 모델 데이터를 딕셔너리로 변환하는 메서드입니다.
        기본 dict() 메서드를 대체하며, 데이터를 가공하거나 필터링할 수 있습니다.

        주요 기능:
        1. Pydantic 모델 데이터를 딕셔너리로 변환:
            - Pydantic 모델 인스턴스를 JSON 직렬화가 가능한 딕셔너리 형태로 변환합니다.
            - MongoDB와 같은 데이터베이스에 저장하거나 API 응답으로 반환하기 위해 사용됩니다.

        2. 필터링된 데이터 반환:
            - 필요에 따라 특정 필드를 제외하거나, 데이터를 가공하여 반환할 수 있습니다.
            - 예: 민감한 데이터를 제외하거나, 기본값을 설정하는 등의 작업.

        3. Pydantic v2의 권장 방식:
            - Pydantic v2에서는 dict() 대신 model_dump()를 사용하는 것이 권장됩니다.
            - 더 많은 옵션과 유연성을 제공하며, 향후 Pydantic의 표준 방식으로 자리 잡았습니다.
        """
        return super().model_dump(**kwargs)

class CommonFields:
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
    email_set = Field(
        examples=["user@example.com"],
        title="이메일 주소",
        description="인증 코드를 전송한 이메일 주소",
    )
    code_set = Field(
        examples=["A12B34"],
        title="인증 코드",
        description="6자리 인증 코드",
        min_length=6,
        max_length=6,
    )

# Office ---------------------------------------------------------------------------------------------------

class Office_Create_Request(BaseModelWithCustomDump):
    input_data: str = CommonFields.input_data_set
    output_data: str = CommonFields.output_data_set

class Office_Update_Request(BaseModelWithCustomDump):
    input_data: str = CommonFields.input_data_set
    output_data: str = CommonFields.output_data_set

# ChatBot ---------------------------------------------------------------------------------------------------

class ChatBot_Id_Request(BaseModel):
    character_idx: int = CommonFields.character_idx_set

class ChatBot_Create_Request(BaseModelWithCustomDump):
    img_url: str = CommonFields.img_url_set
    input_data: str = CommonFields.input_data_set
    output_data: str = CommonFields.output_data_set

class ChatBot_Update_Request(BaseModelWithCustomDump):
    img_url: str = CommonFields.img_url_set
    input_data: str = CommonFields.input_data_set
    output_data: str = CommonFields.output_data_set

class Email_Request(BaseModel):
    email: str = CommonFields.email_set
    
    @field_validator('email')
    def check_email(cls, v):
        return Validators.validate_email(v)

class Verification_Request(BaseModel):
    email: str = CommonFields.email_set
    code: str = CommonFields.code_set
    
    @field_validator('email')
    def check_email(cls, v):
        return Validators.validate_email(v)
    
    @field_validator('code')
    def check_code(cls, v):
        return Validators.validate_code(v)
