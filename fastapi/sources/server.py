import os
import asyncio
from fastapi import FastAPI, APIRouter, HTTPException, Request, Query
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from pydantic import ValidationError

from utils.DB_mongo import MongoDBHandler
from utils.Models import ChatData_Request
from utils.Error_handlers import add_exception_handlers, NotFoundException, BadRequestException, UnauthorizedException, ForbiddenException, InternalServerErrorException

app = FastAPI()
add_exception_handlers(app) # 예외 핸들러 추가
mongo_handler = MongoDBHandler()# MongoDB 핸들러 초기화

# 커스텀 OpenAPI 설정
def custom_openapi(): 
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="ChatBot FastAPI",
        version="v0.0.1-dev",
        summary="쳇봇 데이터 관리 API (개발 중인 버전)",
        routes=app.routes,
        description=(
            "이 API는 다음과 같은 기능을 제공합니다:\n\n"
            "1. **유저 채팅 문서 생성**\n"
            "   - **Endpoint**: `GET /chat/create`\n"
            "   - **설명**: MongoDB에 새로운 유저 채팅 문서(채팅 로그)를 생성합니다.\n\n"
            "2. **유저 채팅 저장**\n"
            "   - **Endpoint**: `POST /chat/save_log`\n"
            "   - **설명**: MongoDB의 생성된 문서에 유저의 채팅 데이터를 저장합니다.\n\n"
            "3. **데이터베이스 목록 조회**\n"
            "   - **Endpoint**: `GET /database/names`\n"
            "   - **설명**: MongoDB 서버에 있는 데이터베이스 목록을 조회합니다.\n\n"
            "4. **데이터베이스 컬렉션 목록 조회**\n"
            "   - **Endpoint**: `GET /database/collections`\n"
            "   - **설명**: 현재 데이터베이스의 컬렉션 목록을 조회합니다.\n\n"
            "각 엔드포인트의 자세한 정보는 해당 엔드포인트의 문서에서 확인할 수 있습니다."
        ),
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "https://drive.google.com/thumbnail?id=12PqUS6bj4eAO_fLDaWQmoq94-771xfim"
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# 미들웨어 추가
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET") # 아직 구현 안함
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

'''
데이터베이스 관련 라우터 정의
'''
# 데이터베이스와 관련된 엔드포인트를 처리하는 라우터
database_router = APIRouter()

@database_router.get("/names", summary="데이터베이스 목록 가져오기")
async def list_databases():
    '''
    데이터베이스 서버에 있는 모든 데이터베이스의 목록을 반환합니다.
    
    이 엔드포인트는 MongoDB 서버에 연결하여 데이터베이스의 이름을 조회하고,
    이를 클라이언트에 JSON 형태로 반환합니다.
    
    - **200 OK**: 데이터베이스 목록이 성공적으로 반환됨
    - **500 Internal Server Error**: 서버에서 데이터를 조회하는 도중 문제가 발생함
    '''
    try:
        database = await asyncio.to_thread(mongo_handler.get_db_names)
        return {"Database": database}
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))

@database_router.get("/collections", summary="데이터베이스 컬렉션 목록 가져오기")
async def list_collections(db_name: str = Query(..., description="데이터베이스 이름")):
    '''
    현재 선택된 데이터베이스 내의 모든 컬렉션 이름을 반환합니다.
    
    이 엔드포인트는 MongoDB에서 선택된 데이터베이스의 컬렉션 목록을 조회하고,
    이를 클라이언트에 JSON 형태로 반환합니다.
    
    - **200 OK**: 컬렉션 목록이 성공적으로 반환됨
    - **404 Not Found**: 데이터베이스가 존재하지 않음
    - **500 Internal Server Error**: 컬렉션 목록을 조회하는 도중 문제가 발생함
    '''
    try:
        collections = await asyncio.to_thread(mongo_handler.get_collection_names, db_name)
        return {"Collections": collections}
    except NotFoundException as e:
        raise NotFoundException(detail=str(e))
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))
    
app.include_router(
    database_router,
    prefix="/database",
    tags=["Database"],
    responses={500: {"description": "Internal Server Error"}}
)

'''
채팅 관련 라우터 정의
'''
# 채팅과 관련된 엔드포인트를 처리하는 라우터
chat_router = APIRouter()

@chat_router.get("/create", summary="유저 채팅 ID 생성")
async def create_chat():
    '''
    새로운 유저 채팅 문서(채팅 로그)를 MongoDB에 생성합니다.
    
    이 엔드포인트는 MongoDB에서 새로운 채팅 로그 컬렉션을 생성하고,
    생성된 문서의 ID를 클라이언트에 JSON 형태로 반환합니다.
    
    - **200 OK**: 채팅 로그 문서의 ID가 성공적으로 반환됨
    - **500 Internal Server Error**: 채팅 로그 문서를 생성하는 도중 문제가 발생함
    '''
    try:
        document_id = await asyncio.to_thread(mongo_handler.create_chatlog_collection)
        return {"Document ID": document_id}
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))

@chat_router.post("/save_log", summary="유저 채팅 저장")
async def save_chat_log(request: ChatData_Request):
    '''
    생성된 채팅 문서에 유저의 채팅 데이터를 저장합니다.
    
    이 엔드포인트는 제공된 채팅 데이터를 MongoDB의 문서에 저장하며,
    저장 결과를 클라이언트에 JSON 형태로 반환합니다.
    
    - **200 OK**: 채팅 데이터가 성공적으로 저장됨
    - **400 Bad Request**: 요청 데이터가 유효하지 않거나 검증 실패
    - **404 Not Found**: 지정된 문서 ID가 존재하지 않음
    - **500 Internal Server Error**: 채팅 데이터를 저장하는 도중 문제가 발생함
    '''
    try:
        await request.url_status(request.img_url)  # 이미지 URL 확인
        response_message = await asyncio.to_thread(mongo_handler.add_to_value, request.id, request.dict())
        return {"Result": response_message}
    except ValidationError as e:
        raise BadRequestException(detail=str(e))
    except NotFoundException as e:
        raise NotFoundException(detail=str(e))
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))

app.include_router(
    chat_router,
    prefix="/chat",
    tags=["Chat"],
    responses={500: {"description": "Internal Server Error"}}
)

@app.get("/")
async def health_check():
    '''
    서버의 상태를 확인하는 헬스 체크 엔드포인트입니다.
    
    이 엔드포인트는 서버가 정상적으로 작동하는지 확인하기 위한 간단한 응답을 반환합니다.
    
    - **200 OK**: 서버가 정상적으로 작동 중임을 나타내는 메시지 반환
    '''
    return {"Connection": "Success"}

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    '''
    모든 HTTP 요청에 대해 예외를 처리하는 미들웨어입니다.
    
    이 미들웨어는 요청 처리 중 발생하는 예외를 잡아내어 적절한 HTTP 상태 코드와 메시지로 응답합니다.
    
    - **400 Bad Request**: 요청 데이터가 유효하지 않거나 검증 실패
    - **401 Unauthorized**: 인증 실패
    - **403 Forbidden**: 권한이 없음
    - **404 Not Found**: 요청한 자원을 찾을 수 없음
    - **500 Internal Server Error**: 서버에서 알 수 없는 오류 발생
    '''
    try:
        response = await call_next(request)
        return response
    except ValidationError as e:
        raise BadRequestException(detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))
