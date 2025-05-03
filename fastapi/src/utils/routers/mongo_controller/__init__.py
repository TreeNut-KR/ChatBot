from fastapi import APIRouter, Query
from .office_router import office_router
from .chatbot_router import chatbot_router

from ...handlers import error_handler as ChatError
from ...handlers.mongodb_handler import MongoDBHandler

mongo_handler = MongoDBHandler()  # MongoDB 핸들러 초기화
mongo_router = APIRouter()

@mongo_router.get("/db", summary="데이터베이스 목록 가져오기")
async def list_databases():
    '''
    데이터베이스 서버에 있는 모든 데이터베이스의 목록을 반환합니다.
    '''
    try:
        databases = await mongo_handler.get_db()
        return {"Database": databases}
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))

@mongo_router.get("/collections", summary="데이터베이스 컬렉션 목록 가져오기")
async def list_collections(db_name: str = Query(..., description="데이터베이스 이름")):
    '''
    현재 선택된 데이터베이스 내의 모든 컬렉션 이름을 반환합니다.
    '''
    try:
        collections = await mongo_handler.get_collection(database_name=db_name)
        return {"Collections": collections}
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
mongo_router.include_router(office_router, prefix="/office", tags=["MongoDB / Office"])
mongo_router.include_router(chatbot_router, prefix="/chatbot", tags=["MongoDB / Chatbot"])
