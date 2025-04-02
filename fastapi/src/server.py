import os
from pydantic import ValidationError
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import JSONResponse

from utils  import ChatError, ChatModel, MongoDBHandler, MySQLDBHandler, SMTPHandler

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
ChatError.add_exception_handlers(app)  # 예외 핸들러 추가

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
        version="v0.2.0",
        summary="쳇봇 데이터 관리 API (개발 중인 버전)",
        routes=app.routes,
        description=(
            "이 API는 다음과 같은 기능을 제공합니다:\n\n"
            "각 엔드포인트의 자세한 정보는 해당 엔드포인트의 문서에서 확인할 수 있습니다."
        ),
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "https://drive.google.com/thumbnail?id=12PqUS6bj4eAO_fLDaWQmoq94-771xfim"
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema
app.openapi = custom_openapi

mysql_router = APIRouter() # MySQL 관련 라우터 정의

@mysql_router.get("/tables", summary="테이블 목록 가져오기")
async def list_tables():
    '''
    MySQL 데이터베이스 내의 모든 테이블 목록을 반환합니다.
    '''
    try:
        tables = await mysql_handler.get_tables()
        return {"Tables": tables}
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))

@mysql_router.get("/query", summary="사용자 정의 쿼리 실행")
async def execute_query(query: str):
    '''
    사용자 정의 MySQL 쿼리를 실행하고 결과를 반환합니다.
    '''
    try:
        if not query.lower().startswith(("select", "show")):
            raise ChatError.BadRequestException(detail="Only SELECT and SHOW queries are allowed.")
        
        result = await mysql_handler.execute_query(query)
        return {"Result": result}
    except ChatError.BadRequestException as e:
        raise e
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))

app.include_router(
    mysql_router,
    prefix="/mysql",
    tags=["MySQL Router"],
    responses={500: {"description": "Internal Server Error"}}
)

mongo_router = APIRouter() # MySQL 관련 라우터 정의

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

office_router = APIRouter() # Office 관련 라우터 정의

@office_router.post("/create", summary="유저 채팅방 ID 생성")
async def create_chat(request: ChatModel.Office_Id_Request):
    '''
    새로운 유저 채팅 문서(채팅 로그)를 MongoDB에 생성합니다.
    '''
    try:
        document_id = await mongo_handler.create_office_collection(
            user_id=request.user_id,
            router="office"
        )
        return {"Document ID": document_id}
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))

@office_router.put("/save_log", summary="유저 채팅 저장")
async def save_chat_log(request: ChatModel.Office_Create_Request):
    '''
    생성된 채팅 문서에 유저의 채팅 데이터를 저장합니다.
    '''
    try:
        request_data = request.model_dump()
        filtered_data = {key: value for key, value in request_data.items() if key != 'id'}
        
        # output_data가 비어있거나 None인 경우 대체 문장 설정
        if not filtered_data.get("output_data"):
            filtered_data["output_data"] = "서버 에러가 있습니다. 다시 시도해주세요."
        
        response_message = await mongo_handler.add_office_log(
            user_id=request.user_id,
            document_id=request.id,
            new_data=filtered_data
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
@office_router.put("/update_log", summary="유저 채팅 업데이트")
async def update_chat_log(request: ChatModel.Office_Update_Request):
    '''
    기존 채팅 문서에 유저의 채팅 데이터를 수정합니다.
    '''
    try:
        request_data = request.model_dump()
        filtered_data = {key: value for key, value in request_data.items() if key != 'id'}
        
        # output_data가 비어있거나 None인 경우 대체 문장 설정
        if not filtered_data.get("output_data"):
            filtered_data["output_data"] = "서버 에러가 있습니다. 다시 시도해주세요."
        
        response_message = await mongo_handler.update_office_log(
            user_id=request.user_id,
            document_id=request.id,
            new_Data=filtered_data
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    

@office_router.post("/load_log", response_model=ChatModel.OfficeResponse, summary="유저 채팅 불러오기")
async def load_chat_log(request: ChatModel.Identifier_Request) -> ChatModel.OfficeResponse:
    '''
    생성된 채팅 문서의 채팅 로그를 MongoDB에서 불러옵니다.
    '''
    try:
        chat_logs = await mongo_handler.get_offic_log(
            user_id=request.user_id,
            document_id=request.id,
            router="office"
        )

        response_data = ChatModel.OfficeResponse(
            id=request.id,
            value=chat_logs
        )
        
        return response_data
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
@office_router.delete("/delete_log", summary="유저 채팅 일부 지우기")
async def delete_chat_log(request: ChatModel.Log_Delete_Request):
    '''
    최신 대화 ~ 선택된 채팅을 로그에서 삭제합니다.
    '''
    try:
        response_message = await mongo_handler.remove_log(
            user_id=request.user_id,
            document_id=request.id,
            selected_count=request.index,
            router="office"
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
@office_router.delete("/delete_room", summary="유저 채팅 지우기")
async def delete_chat_room(request: ChatModel.Room_Delete_Request):
    '''
    유저의 채팅방을 삭제합니다.
    '''
    try:
        response_message = await mongo_handler.remove_collection(
            user_id=request.user_id,
            document_id=request.id,
            router="office"
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
chatbot_router = APIRouter() # Chatbot 관련 라우터 정의

@chatbot_router.post("/create", summary="유저 채팅방 ID 생성")
async def create_chat(request: ChatModel.ChatBot_Id_Request):
    '''
    새로운 유저 채팅 문서(채팅 로그)를 MongoDB에 생성합니다.
    '''
    try:
        # character_idx가 양수인지 확인
        if request.character_idx <= 0:
            raise ChatError.BadRequestException("character_idx는 양수여야 합니다.")
            
        document_id = await mongo_handler.create_chatbot_collection(
            user_id=request.user_id,
            character=request.character_idx,
            router="chatbot"
        )
        
        if not document_id:
            raise ChatError.InternalServerErrorException("문서 ID 생성 실패")
            
        return {"Document ID": document_id}
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))

@chatbot_router.put("/save_log", summary="유저 채팅 저장")
async def save_chat_log(request: ChatModel.ChatBot_Create_Request):
    '''
    생성된 채팅 문서에 유저의 채팅 데이터를 저장합니다.
    '''
    try:
        await ChatModel.Validators().url_status(request.img_url)  # 이미지 URL 확인
        request_data = request.model_dump()
        filtered_data = {key: value for key, value in request_data.items() if key != 'id'}
        
        # output_data가 비어있거나 None인 경우 대체 문장 설정
        if not filtered_data.get("output_data"):
            filtered_data["output_data"] = "서버 에러가 있습니다. 다시 시도해주세요."
        
        response_message = await mongo_handler.add_chatbot_log(
            user_id=request.user_id,
            document_id=request.id,
            new_data=filtered_data
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
@chatbot_router.put("/update_log", summary="유저 채팅 업데이트")
async def update_chat_log(request: ChatModel.ChatBot_Update_Request):
    '''
    기존 채팅 문서에 유저의 채팅 데이터를 수정합니다.
    '''
    try:
        await ChatModel.Validators().url_status(request.img_url)  # 이미지 URL 확인
        request_data = request.model_dump()
        filtered_data = {key: value for key, value in request_data.items() if key != 'id'}
    
        # output_data가 비어있거나 None인 경우 대체 문장 설정
        if not filtered_data.get("output_data"):
            filtered_data["output_data"] = "서버 에러가 있습니다. 다시 시도해주세요."
        
        response_message = await mongo_handler.update_chatbot_log(
            user_id=request.user_id,
            document_id=request.id,
            new_Data=filtered_data
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    

@chatbot_router.post("/load_log", response_model=ChatModel.ChatBotResponse, summary="유저 채팅 불러오기")
async def load_chat_log(request: ChatModel.Identifier_Request) -> ChatModel.ChatBotResponse:
    '''
    생성된 채팅 문서의 채팅 로그를 MongoDB에서 불러옵니다.
    '''
    try:
        chat_logs, character_idx = await mongo_handler.get_chatbot_log(
            user_id=request.user_id,
            document_id=request.id,
            router="chatbot"
        )
        response_data = ChatModel.ChatBotResponse(
            id=request.id,
            character_idx=character_idx,
            value=chat_logs,
        )
        return response_data
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
@chatbot_router.delete("/delete_log", summary="유저 채팅 일부 지우기")
async def delete_chat_log(request: ChatModel.Log_Delete_Request):
    '''
    최신 대화 ~ 선택된 채팅을 로그에서 삭제합니다.
    '''
    try:
        response_message = await mongo_handler.remove_log(
            user_id=request.user_id,
            document_id=request.id,
            selected_count=request.index,
            router="chatbot"
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
@chatbot_router.delete("/delete_room", summary="유저 채팅 지우기")
async def delete_chat_room(request: ChatModel.Room_Delete_Request):
    '''
    유저의 채팅방을 삭제합니다.
    '''
    try:
        response_message = await mongo_handler.remove_collection(
            user_id=request.user_id,
            document_id=request.id,
            router="chatbot"
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))

# mongo_router에 세분화된 라우터 추가
mongo_router.include_router(
    office_router,
    prefix="/office",
    tags=["MongoDB Router / Office Router"]
)
mongo_router.include_router(
    chatbot_router,
    prefix="/chatbot", 
    tags=["MongoDB Router / Chatbot Router"]
)

# FastAPI 애플리케이션에 mongo_router를 추가
app.include_router(
    mongo_router,
    prefix="/mongo",
    tags=["MongoDB Router"],
    responses={500: {"description": "Internal Server Error"}}
)

# SMTP 핸들러 초기화
smtp_handler = SMTPHandler()  # SMTP 핸들러 초기화
smtp_router = APIRouter()  # SMTP 관련 라우터 정의

@smtp_router.post("/send-verification", summary="이메일 인증 코드 전송")
async def send_verification_email(request: ChatModel.EmailSchema):
    '''
    사용자 이메일로 인증 코드를 전송합니다.
    '''
    try:
        success = await smtp_handler.send_verification_email(request.email)
        if success:
            return {"status": "success", "message": "인증 코드가 전송되었습니다. 이메일을 확인해주세요."}
        else:
            raise ChatError.InternalServerErrorException(detail="이메일 전송에 실패했습니다.")
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))

@smtp_router.post("/verify-code", summary="이메일 인증 코드 확인")
async def verify_email_code(request: ChatModel.VerificationSchema):
    '''
    사용자로부터 받은 인증 코드를 검증합니다.
    '''
    try:
        # 입력값 디버깅 출력
        print(f"인증 코드 검증 요청: 이메일={request.email}, 코드={request.code}")
        
        # 현재 저장된 코드 출력 (디버깅 목적)
        if request.email in smtp_handler.verification_codes:
            stored = smtp_handler.verification_codes[request.email]
            print(f"저장된 코드 정보: {stored['code']}, 만료시간: {stored['expiry']}")
        else:
            print(f"이메일 {request.email}에 대한 저장된 코드가 없습니다")
            
        is_valid = smtp_handler.verify_code(request.email, request.code)
        
        if is_valid:
            return {"status": "success", "message": "인증이 완료되었습니다."}
        else:
            # 400 오류를 직접 반환하지 않고, JSONResponse를 반환
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error", 
                    "detail": "인증 코드가 유효하지 않거나 만료되었습니다.",
                    "code": "invalid_verification_code"
                }
            )
    except Exception as e:
        print(f"인증 코드 검증 중 오류 발생: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "detail": str(e),
                "code": "verification_error"
            }
        )

# FastAPI 애플리케이션에 smtp_router를 추가
app.include_router(
    smtp_router,
    prefix="/auth",
    tags=["Authentication"],
    responses={500: {"description": "Internal Server Error"}}
)

@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    """
    모든 HTTP 요청에 대해 예외를 처리하는 미들웨어입니다.
    """
    try:
        response = await call_next(request)
        return response
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except HTTPException as e:
        raise e
    except Exception as e:
        error_detail = str(e)
        raise ChatError.InternalServerErrorException(detail=error_detail)