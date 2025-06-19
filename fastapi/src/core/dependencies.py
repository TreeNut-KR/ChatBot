from fastapi import HTTPException, status

from . import app_state
from services import (
    mongodb_client,
    mysql_client
)

async def get_mongo_handler() -> mongodb_client.MongoDBHandler:
    """MongoDB 핸들러 의존성"""
    handler = app_state.get_mongo_handler()
    if handler is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB 서비스를 사용할 수 없습니다."
        )
    return handler

async def get_mysql_handler() -> mysql_client.MySQLDBHandler:
    """MySQL 핸들러 의존성"""
    handler = app_state.get_mysql_handler()
    if handler is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MySQL 서비스를 사용할 수 없습니다."
        )
    return handler