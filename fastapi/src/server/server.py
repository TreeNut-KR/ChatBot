import os
from fastapi import  FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager

from api import mongo_controller, smtp_controller
from core import app_state
from utils import error_tools

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

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="ChatBot FastAPI",
        version="v1.0.*",
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

error_tools.ExceptionManager.register(app)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET"), # 세션 비밀 키, 사용을 원할 경우에 ENV에 설정
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.openapi = custom_openapi

# FastAPI 애플리케이션에 mongo_router를 추가
app.include_router(
    mongo_controller.mongo_router,
    prefix="/mongo",
    tags=["MongoDB Router"],
    responses={500: {"description": "Internal Server Error"}}
)

# FastAPI 애플리케이션에 smtp_router를 추가
app.include_router(
    smtp_controller.smtp_router,
    prefix="/auth",
    tags=["Authentication"],
    responses={500: {"description": "Internal Server Error"}}
)
