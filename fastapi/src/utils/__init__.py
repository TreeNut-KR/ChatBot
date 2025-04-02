# Desc: Package initializer for the utils module
"""
utils 패키지 초기화 모듈

이 모듈은 utils 패키지의 초기화를 담당하며, 다음과 같은 하위 모듈들을 포함합니다:

Handlers:
    - error_handler: FastAPI 예외 처리
    - mysql_handler: MySQL 데이터베이스 처리
    - mongodb_handler: MongoDB 데이터베이스 처리
    - smtp_handler: SMTP 이메일 인증 처리

Schemas:
    - chat_schema: FastAPI Pydantic 모델 정의
"""

# Handlers
from .handlers import error_handler as ChatError
from .handlers.mysql_handler import MySQLDBHandler
from .handlers.mongodb_handler import MongoDBHandler
from .handlers.smtp_handler import SMTPHandler  # SMTP 핸들러 추가

# Schemas
from .schemas import chat_schema as ChatModel


__all__ = [
    # Handlers
    'ChatError',
    'MySQLDBHandler',
    'MongoDBHandler',
    'SMTPHandler',  # SMTP 핸들러 추가
    
    # Schemas
    'ChatModel'
]