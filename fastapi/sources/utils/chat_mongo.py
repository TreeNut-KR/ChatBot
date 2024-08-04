import os
from typing import NoReturn, List
from pymongo import MongoClient
from dotenv import load_dotenv
import uuid

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
        self.host = os.getenv("MONGO_HOST", "localhost")
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
        # chatlog 컬렉션 참조
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