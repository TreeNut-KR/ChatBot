from fastapi import APIRouter, Request, Query, Depends
from fastapi.responses import JSONResponse

from core import dependencies
from services import mongodb_client
from utils import error_tools

from . import office_controller as OfficeController
from . import character_controller as CharacterController

mongo_router = APIRouter()

@mongo_router.get("/db", summary="데이터베이스 목록 가져오기")
async def list_databases(
    req: Request,
    mongo_handler: mongodb_client.MongoDBHandler = Depends(dependencies.get_mongo_handler)
):
    '''
    데이터베이스 서버에 있는 모든 데이터베이스의 목록을 반환합니다.
    '''
    try:
        databases = await mongo_handler.get_db()
        response_data = {
            "Database": databases,
            "_links": [
                { 
                    "href": str(req.url),
                    "rel": "self",
                    "type": "GET",
                    "title": "데이터베이스 목록 가져오기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/collections",
                    "rel": "collections",
                    "type": "GET",
                    "title": "데이터베이스 컬렉션 목록 가져오기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/offices",
                    "rel": "office-chats",
                    "type": "GET",
                    "title": "오피스 채팅방 생성",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters",
                    "rel": "character-chats",
                    "type": "GET",
                    "title": "캐릭터 채팅방 생성",
                },
            ]
        }
        return JSONResponse(response_data)             
        
    except Exception as e:
        raise error_tools.InternalServerErrorException(detail=str(e))

@mongo_router.get("/collections", summary="데이터베이스 컬렉션 목록 가져오기")
async def list_collections(
    req: Request,
    db_name: str = Query(..., description="데이터베이스 이름"),
    mongo_handler: mongodb_client.MongoDBHandler = Depends(dependencies.get_mongo_handler)
):
    '''
    현재 선택된 데이터베이스 내의 모든 컬렉션 이름을 반환합니다.
    '''
    try:
        collections = await mongo_handler.get_collection(database_name=db_name)
        response_data = {
            "Collections": collections,
            "_links": [
                { 
                    "href": str(req.url),
                    "rel": "self",
                    "type": "GET",
                },
                {
                    "href": f"{str(req.base_url)}mongo/db",
                    "rel": "databases",
                    "type": "GET",
                },
                {
                    "href": f"{req.base_url}mongo/offices",
                    "rel": "office-chats",
                    "type": "GET",
                },
                {
                    "href": f"{req.base_url}mongo/characters",
                    "rel": "character-chats",
                    "type": "GET",
                },
            ]
        }
        return JSONResponse(response_data)
    except Exception as e:
        raise error_tools.InternalServerErrorException(detail=str(e))
    
mongo_router.include_router(
    OfficeController.office_router,
    prefix="/offices",
    tags=["MongoDB / Offices"]
)
mongo_router.include_router(
    CharacterController.character_router,
    prefix="/characters",
    tags=["MongoDB / Characters"]
)
