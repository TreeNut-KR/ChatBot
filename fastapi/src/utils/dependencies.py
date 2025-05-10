from fastapi import HTTPException, status
from . import app_state
from .handlers.mongodb_handler import MongoDBHandler
from .handlers.mysql_handler import MySQLDBHandler

# (re-export)
__all__ = [
    # Types
    'MongoDBHandler',
    'MySQLDBHandler',

    # Dependencies
    'get_mongo_handler',
    'get_mysql_handler',
]

async def get_mongo_handler() -> MongoDBHandler:
    """MongoDB 핸들러 의존성"""
    handler = app_state.get_mongo_handler()
    if handler is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB 서비스를 사용할 수 없습니다."
        )
    return handler

async def get_mysql_handler() -> MySQLDBHandler:
    """MySQL 핸들러 의존성"""
    handler = app_state.get_mysql_handler()
    if handler is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MySQL 서비스를 사용할 수 없습니다."
        )
    return handler