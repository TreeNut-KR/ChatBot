from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import uvicorn

import os
import uuid
from dotenv import load_dotenv
from pymongo import MongoClient
from typing import NoReturn, List
from pydantic import BaseModel, Field

class MongoDBHandler:
    def __init__(self) -> NoReturn:
        """
        MongoDBHandler 초기화.
        환경 변수에서 MongoDB 정보 로드.
        """
        load_dotenv()  # .env 파일 로드

        # 환경 변수에서 MongoDB 설정값 가져오기
        self.username = os.getenv("MONGO_ADMIN_USER")
        self.password = os.getenv("MONGO_ADMIN_PASSWORD")
        self.database_name = os.getenv("MONGO_DATABASE")
        self.host = os.getenv("MONGO_HOST", "localhost")  # Docker 컨테이너 이름 또는 호스트 IP
        self.port = int(os.getenv("MONGO_PORT", 27017))

        # MongoDB 클라이언트 생성
        self.client = MongoClient(f'mongodb://{self.username}:{self.password}@{self.host}:{self.port}/{self.database_name}?authSource=admin')
        # 데이터베이스 참조
        self.db = self.client[self.database_name]

    def create_chatlog_collection(self) -> str:
        """
        chatlog 컬렉션을 생성하는 함수.
        :return: 생성된 문서의 ID
        """
        # chatlog 컬렉션 참조c
        collection = self.db['chatlog']

        # 새 문서 생성
        document = {
            "id": str(uuid.uuid4()),  # UUID 생성
            "value": []  # 리스트 형태의 데이터
        }

        # 문서 삽입
        result = collection.insert_one(document)
        print("Document created with ID:", result.inserted_id)  # 삽입된 문서의 ID 출력

        return document["id"]  # 생성된 ID 반환

    def get_collection_names(self) -> List[str]:
        """
        데이터베이스의 컬렉션 이름 목록을 반환하는 함수.
        :return: 컬렉션 이름 리스트
        """
        collection_names = self.db.list_collection_names()
        print("Collections in database:", collection_names)  # 컬렉션 이름 목록 출력
        return collection_names

mh = MongoDBHandler()
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
                "id": "",
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

@app.get("/chat/new", summary="유저 채팅 id 생성")
def chat_new():
    '''
    mongoDB에 유저 채팅 document 생성
    '''
    id = mh.create_chatlog_collection()
    return {"id": id}

@app.post("/chat/log", response_model=ChatData_Response, summary="유저 채팅 데이터")
def chat_log(request_data: ChatData_Request):
    '''
    mongoDB에 생성된 document에 유저 채팅 저장
    '''
    log_data = {
        "id": request_data.id,
        "img_url": request_data.img_url,
        "input_data": request_data.input_data,
        "output_data": request_data.output_data
    }

    # chatlog 컬렉션에 데이터 삽입
    collection = mh.db['chatlog']
    collection.insert_one(log_data)

    response_data = ChatData_Response(
        ChatData_img_url=request_data.img_url,
        ChatData_input=request_data.input_data,
        ChatData_output=request_data.output_data
    )
    return response_data

@app.get("/chat/collections", summary="데이터베이스 컬렉션 목록 가져오기")
def get_collections():
    '''
    데이터베이스의 컬렉션 이름 목록을 반환
    '''
    collections = mh.get_collection_names()
    return {"collections": collections}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
