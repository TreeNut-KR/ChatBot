# Desc: Package initializer for the utils module
"""
utils 패키지 초기화 모듈

이 모듈은 utils 패키지의 초기화를 담당하며, 다음과 같은 하위 모듈들을 포함합니다:

Handlers:
    - error_handler: FastAPI 예외 처리
    
Schemas:
    - chat_schema: FastAPI Pydantic 모델 정의
    
Routers:
    - mysql_controller: MySQL 데이터베이스 라우터
    - mongo_controller: MongoDB 데이터베이스 라우터
    - smtp_controller: SMTP 이메일 인증 라우터
"""

# Handlers
from .handlers import error_handler as ChatError
from .handlers.mysql_handler import mysql_handler

# Schemas
from .schemas import chat_schema as ChatModel

# Routers
from .routers import mysql_controller as mysql_router  
from .routers import mongo_controller as mongo_router
from .routers import smtp_controller as smtp_router

__all__ = [
    # Handlers
    'ChatError',
    'mysql_handler',
    
    # Schemas
    'ChatModel',
    
    # Routers
    'mysql_router',
    'mongo_router',
    'smtp_router',
]