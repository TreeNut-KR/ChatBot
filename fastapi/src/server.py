import os
from pydantic import ValidationError
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import JSONResponse

from utils  import ChatError, app_state, MongoController, SmtpController

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    '''
    FastAPI 애플리케이션의 수명 주기를 관리하는 함수.
    '''
    await app_state.initialize_handlers()
    try:
        yield
    finally:
        await app_state.cleanup_handlers()

app = FastAPI(lifespan=lifespan)
ChatError.add_exception_handlers(app)  # 예외 핸들러 추가

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="ChatBot FastAPI",
        version="v1.0.0",
        summary="쳇봇 데이터 관리 및 이메일 인증 API",
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
app.openapi = custom_openapi

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

# FastAPI 애플리케이션에 mongo_router를 추가
app.include_router(
    MongoController.mongo_router,
    prefix="/mongo",
    tags=["MongoDB Router"],
    responses={500: {"description": "Internal Server Error"}}
)

# FastAPI 애플리케이션에 smtp_router를 추가
app.include_router(
    SmtpController.smtp_router,
    prefix="/auth",
    tags=["Authentication"],
    responses={500: {"description": "Internal Server Error"}}
)
