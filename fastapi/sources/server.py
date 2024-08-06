from fastapi import FastAPI, HTTPException
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import uvicorn

import os
from pydantic import BaseModel, Field
from utils.chat_mongo import MongoDBHandler

# MongoDBHandler 인스턴스 생성
mongo_handler = MongoDBHandler()

app = FastAPI()

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="ChatBot FastAPI",
        version="v0.0.1",
        summary="쳇봇 데이터 관리 API",
        routes=app.routes,
        description=(
            "mongoDB에 유저 채팅 document 생성ㅤ=>ㅤget('/chat/new')\n\n"
            "mongoDB에 생성된 document에 유저 채팅 저장ㅤ=>ㅤpost('/chat/log')\n\n"
            "데이터베이스의 컬렉션 이름 목록 가져오기ㅤ=>ㅤget('/collections')\n\n"
        ),
    )
    openapi_schema["info"]["x-logo"] = {
        "url": "https://drive.google.com/thumbnail?id=12PqUS6bj4eAO_fLDaWQmoq94-771xfim"
    }
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

app.add_middleware(  # Session 미들웨어 추가
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET")
)
app.add_middleware(  # CORS 미들웨어 추가
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatData_Request(BaseModel):
    id: str = Field(..., title="채팅방 id")
    img_url: str = Field(..., title="이미지 URL", min_length=1, max_length=2048, description="URL의 최대 길이는 일반적으로 2048자")
    input_data: str = Field(..., title="사용자 입력 문장", min_length=1, max_length=500, description="사용자 입력 문장 길이 제약")
    output_data: str = Field(..., title="챗봇 출력 문장", min_length=1, max_length=500, description="챗봇 출력 문장 길이 제약")
    
    class Config:
        schema_extra = {
            "example": {
                "id": "b9f5d2w9-abc6-rfde-9bbe-3871589e62ed",
                "img_url": "https://drive.google.com/thumbnail?id=12PqUS6bj4eAO_fLDaWQmoq94-771xfim",
                "input_data": "안녕하세요, 챗봇!",
                "output_data": "안녕하세요! 무엇을 도와드릴까요?"
            }
        }

class ChatData_Response(BaseModel):
    ChatData_img_url: str
    ChatData_input: str
    ChatData_output: str

@app.get("/")
def read_root():
    return {"Connection": "Success"}

@app.get("/mongo/check")
def mongo_check():
    Database = mongo_handler.get_db_names()
    return {"Database": Database}

@app.get("/chat/collections", summary="데이터베이스 컬렉션 목록 가져오기")
def get_collections():
    '''
    데이터베이스의 컬렉션 이름 목록을 반환
    '''
    collections = mongo_handler.get_collection_names()
    return {"Collections": collections}

@app.get("/chat/new", summary="유저 채팅 id 생성")
def chat_new():
    '''
    mongoDB에 유저 채팅 document 생성
    '''
    id = mongo_handler.create_chatlog_collection()
    return {"id": id}

@app.post("/chat/log", response_model=ChatData_Response, summary="유저 채팅 데이터")
def chat_log(request_data: ChatData_Request):
    '''
    mongoDB에 생성된 document에 유저 채팅 저장
    '''
    log_data = {
        "img_url": request_data.img_url,
        "input_data": request_data.input_data,
        "output_data": request_data.output_data
    }

    # 'value' 필드에 추가 데이터 삽입
    add_result = mongo_handler.add_to_value(request_data.id, log_data)

    if "Successfully added" in add_result:
        response_data = ChatData_Response(
            ChatData_img_url=request_data.img_url,
            ChatData_input=request_data.input_data,
            ChatData_output=request_data.output_data
        )
        return response_data
    else:
        raise HTTPException(status_code=404, detail=add_result)
