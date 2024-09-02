import os
from contextlib import asynccontextmanager

from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import JSONResponse
from utils.DB_mongo import MongoDBHandler
from utils.DB_mysql import MySQLDBHandler
from utils.Error_handlers import (BadRequestException,
                                  InternalServerErrorException,
                                  NotFoundException, add_exception_handlers)
from utils.Models import (ChatData_Response, ChatLog_Creation_Request,
                          ChatLog_Delete_Request, ChatLog_Id_Request,
                          ChatLog_Identifier_Request, ChatRoom_Delete_Request,
                          Validators)

from fastapi import APIRouter, FastAPI, HTTPException, Query, Request

mysql_handler = MySQLDBHandler()  # MySQL 핸들러 초기화
mongo_handler = MongoDBHandler()  # MongoDB 핸들러 초기화

@asynccontextmanager
async def lifespan(app: FastAPI):
    '''
    FastAPI 애플리케이션의 수명 주기를 관리하는 함수.
    '''
    await mysql_handler.connect()
    try:
        yield
    finally:
        await mysql_handler.disconnect()

app = FastAPI(lifespan=lifespan)
add_exception_handlers(app)  # 예외 핸들러 추가

class ExceptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except Exception as e:
            # 예외 세부 사항을 보다 안전하게 처리
            error_detail = self._get_error_detail(e)
            return JSONResponse(
                status_code=500,
                content={"detail": error_detail}
            )
    
    def _get_error_detail(self, exception: Exception) -> str:
        if isinstance(exception, TypeError):
            return str(exception)
        try:
            return getattr(exception, 'detail', str(exception))
        except Exception as ex:
            return f"Unexpected error occurred: {str(ex)}"
        
app.add_middleware(ExceptionMiddleware)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "your-secret-key")  # 기본 비밀 키 추가
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="ChatBot FastAPI",
        version="v0.1.0-dev",
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

# MySQL 관련 라우터 정의
mysql_router = APIRouter()

@mysql_router.get("/tables", summary="테이블 목록 가져오기")
async def list_tables():
    '''
    MySQL 데이터베이스 내의 모든 테이블 목록을 반환합니다.
    '''
    try:
        tables = await mysql_handler.get_tables()
        return {"Tables": tables}
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))

@mysql_router.get("/query", summary="사용자 정의 쿼리 실행")
async def execute_query(query: str):
    '''
    사용자 정의 MySQL 쿼리를 실행하고 결과를 반환합니다.
    '''
    try:
        if not query.lower().startswith(("select", "show")):
            raise BadRequestException(detail="Only SELECT and SHOW queries are allowed.")
        
        result = await mysql_handler.execute_query(query)
        return {"Result": result}
    except BadRequestException as e:
        raise e
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))

app.include_router(
    mysql_router,
    prefix="/mysql",
    tags=["MySQL Router"],
    responses={500: {"description": "Internal Server Error"}}
)

# MongoDB 관련 라우터 정의
mongo_router = APIRouter()

@mongo_router.get("/db", summary="데이터베이스 목록 가져오기")
async def list_databases():
    '''
    데이터베이스 서버에 있는 모든 데이터베이스의 목록을 반환합니다.
    '''
    try:
        databases = await mongo_handler.get_db_names()
        return {"Database": databases}
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))

@mongo_router.get("/collections", summary="데이터베이스 컬렉션 목록 가져오기")
async def list_collections(db_name: str = Query(..., description="데이터베이스 이름")):
    '''
    현재 선택된 데이터베이스 내의 모든 컬렉션 이름을 반환합니다.
    '''
    try:
        collections = await mongo_handler.get_collection_names(database_name=db_name)
        return {"Collections": collections}
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))

@mongo_router.post("/chat/create", summary="유저 채팅방 ID 생성")
async def create_chat(request: ChatLog_Id_Request):
    '''
    새로운 유저 채팅 문서(채팅 로그)를 MongoDB에 생성합니다.
    '''
    try:
        document_id = await mongo_handler.create_chatlog_collection(user_id=request.user_id)
        return {"Document ID": document_id}
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))

@mongo_router.put("/chat/save_log", summary="유저 채팅 저장")
async def save_chat_log(request: ChatLog_Creation_Request):
    '''
    생성된 채팅 문서에 유저의 채팅 데이터를 저장합니다.
    '''
    try:
        await Validators().url_status(request.img_url)  # 이미지 URL 확인
        request_data = request.model_dump()
        filtered_data = {key: value for key, value in request_data.items() if key != 'id'}
        
        response_message = await mongo_handler.add_chatlog_value(
            user_id=request.user_id,
            document_id=request.id,
            new_data=filtered_data
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise BadRequestException(detail=str(e))
    except NotFoundException as e:
        raise NotFoundException(detail=str(e))
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))

@mongo_router.post("/chat/load_log", response_model=ChatData_Response, summary="유저 채팅 불러오기")
async def load_chat_log(request: ChatLog_Identifier_Request) -> ChatData_Response:
    '''
    생성된 채팅 문서의 채팅 로그를 MongoDB에서 불러옵니다.
    '''
    try:
        chat_logs = await mongo_handler.get_chatlog_value(
            user_id=request.user_id,
            document_id=request.id
        )
        response_data = ChatData_Response(
            id=request.id,
            value=chat_logs
        )
        return response_data
    except ValidationError as e:
        raise BadRequestException(detail=str(e))
    except NotFoundException as e:
        raise NotFoundException(detail=str(e))
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))
    
@mongo_router.delete("/chat/delete_log", summary="유저 채팅 일부 지우기")
async def delete_chat_log(request: ChatLog_Delete_Request):
    '''
    최신 대화 ~ 선택된 채팅을 로그에서 삭제합니다.
    '''
    try:
        response_message = await mongo_handler.remove_chatlog_value(
            user_id=request.user_id,
            document_id=request.id,
            selected_count=request.index
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise BadRequestException(detail=str(e))
    except NotFoundException as e:
        raise NotFoundException(detail=str(e))
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))
    
@mongo_router.delete("/chat/delete_room", summary="유저 채팅 지우기")
async def delete_chat_room(request: ChatRoom_Delete_Request):
    '''
    유저의 채팅방을 삭제합니다.
    '''
    try:
        response_message = await mongo_handler.remove_chatroom_value(
            user_id=request.user_id,
            document_id=request.id
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise BadRequestException(detail=str(e))
    except NotFoundException as e:
        raise NotFoundException(detail=str(e))
    except Exception as e:
        raise InternalServerErrorException(detail=str(e))

app.include_router(
    mongo_router,
    prefix="/mongo",
    tags=["MongoDB Router"],
    responses={500: {"description": "Internal Server Error"}}
)

@app.get("/")
async def health_check():
    '''
    서버의 상태를 확인하는 헬스 체크 엔드포인트입니다.
    '''
    return {"Connection": "Success"}

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    """
    모든 HTTP 요청에 대해 예외를 처리하는 미들웨어입니다.
    """
    try:
        response = await call_next(request)
        return response
    except ValidationError as e:
        raise BadRequestException(detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        error_detail = str(e)
        raise InternalServerErrorException(detail=error_detail)