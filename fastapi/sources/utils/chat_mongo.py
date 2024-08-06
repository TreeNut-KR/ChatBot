import os
from typing import NoReturn, List, Dict
from pymongo import MongoClient
from dotenv import load_dotenv
import uuid


class MongoDBHandler:
    def __init__(self) -> NoReturn:
        """
        MongoDBHandler 초기화.
        환경 변수에서 MongoDB 정보 로드.
        """
        # 현재 파일의 디렉토리 경로
        current_directory = os.path.dirname(os.path.abspath(__file__))
        env_file_path = os.path.join(current_directory, '.env')
        load_dotenv(env_file_path)  # .env 파일 로드
        
        # 환경 변수에서 MongoDB 설정값 가져오기
        self.host = os.getenv("MONGO_HOST", "localhost")  # Docker 컨테이너 이름 또는 호스트 IP
        self.port = int(os.getenv("MONGO_PORT", 27017))
        self.username = os.getenv("MONGO_ADMIN_USER")
        self.password = os.getenv("MONGO_ADMIN_PASSWORD")
        self.database_name = os.getenv("MONGO_DATABASE")
        self.auth_name = os.getenv("MONGO_AUTH")
        
        # MongoDB 클라이언트 생성
        self.client = MongoClient(
            host=self.host,
            port=self.port,
            username=self.username,
            password=self.password,
            authSource=self.auth_name
        )
        self.db = self.client[self.database_name] # 데이터베이스 참조

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
    
    def add_to_value(self, document_id: str, new_data: Dict) -> str:
        """
        특정 문서의 'value' 필드에 JSON 데이터를 추가하는 함수.
        :param document_id: 문서의 ID
        :param new_data: 추가할 JSON 데이터
        :return: 성공 메시지 또는 실패 메시지
        """
        # chatlog 컬렉션 참조
        collection = self.db['chatlog']

        try:
            # 문서 조회
            document = collection.find_one({"id": document_id})
            
            if document is None:
                return f"No document found with ID: {document_id}"
            
            # 자동 인덱스 생성
            new_index = len(document['value']) + 1
            new_data_with_index = {
                "index": new_index,
                **new_data
            }

            # 'value' 필드에 새로운 데이터 추가
            result = collection.update_one(
                {"id": document_id},  # 문서 식별 조건
                {"$push": {"value": new_data_with_index}}  # 'value' 배열에 데이터 추가
            )

            if result.modified_count > 0:
                return f"Successfully added data to document with ID: {document_id}"
            else:
                return f"No document found with ID: {document_id} or no data added."
        
        except Exception as e:
            # 예외 발생 시 실패 메시지와 함께 예외 내용 반환
            return f"An error occurred: {str(e)}"

    def get_collection_names(self) -> List[str]:
        """
        데이터베이스의 컬렉션 이름 목록을 반환하는 함수.
        :return: 컬렉션 이름 리스트
        """
        return self.db.list_collection_names()
    
    def get_db_names(self) -> List[str]:
        """
        데이터베이스 이름 목록을 반환하는 함수.
        :return: 데이터베이스 이름 리스트
        """
        return self.client.list_database_names()
