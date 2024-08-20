import os
import uuid
from typing import Dict, List, NoReturn

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError

from .Error_handlers import InternalServerErrorException, NotFoundException


class MongoDBHandler:
    def __init__(self) -> None:
        try:
            current_directory = os.path.dirname(os.path.abspath(__file__))
            env_file_path = os.path.join(current_directory, '../.env')
            load_dotenv(env_file_path)
            
            self.host = os.getenv("MONGO_HOST")
            self.port = int(os.getenv("MONGO_PORT", 27017))
            self.username = os.getenv("MONGO_ADMIN_USER")
            self.password = os.getenv("MONGO_ADMIN_PASSWORD")
            self.database_name = os.getenv("MONGO_DATABASE")
            self.auth_name = os.getenv("MONGO_AUTH")
            
            self.client = MongoClient(
                host=self.host,
                port=self.port,
                username=self.username,
                password=self.password,
                authSource=self.auth_name
            )
            self.db = self.client[self.database_name]
        except Exception as e:
            raise InternalServerErrorException(detail=str(e))

    def get_db_names(self) -> List[str]:
        """
        데이터베이스 이름 목록을 반환하는 함수.
        :return: 데이터베이스 이름 리스트
        """
        return self.client.list_database_names()
    
    def get_collection_names(self, database_name) -> List[str]:
        """
        데이터베이스의 컬렉션 이름 목록을 반환하는 함수.
        :param database_name: 데이터베이스 이름
        :return: 컬렉션 이름 리스트
        """
        # 데이터베이스가 존재하는지 확인
        db_names = self.get_db_names()
        if database_name not in db_names:
            raise NotFoundException(f"Database '{database_name}' not found.")
        return self.client[database_name].list_collection_names()
    
    def create_chatlog_collection(self, user_id: str) -> str:
        """
        chatlog 컬렉션을 생성하는 함수.
        :return: 생성된 문서의 UUID
        """
        collection = self.db[f'chatlog_{user_id}']
        document_id = str(uuid.uuid4())
        document = {
            "id": document_id,
            "value": []
        }
        collection.insert_one(document)
        return document_id
    
    def add_chatlog_value(self, user_id: str, document_id: str, new_data: Dict) -> str:
        """
        특정 문서의 'value' 필드에 JSON 데이터를 추가하는 함수.
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param new_data: 추가할 JSON 데이터
        :return: 성공 메시지 또는 실패 메시지
        """
        try:
            collection = self.db[f'chatlog_{user_id}']
            document = collection.find_one({"id": document_id})
            if document is None:
                raise NotFoundException(f"No document found with ID: {document_id}")
            
            
            new_data_filtered = { # 'id', 'user_id' 필드를 제외한 나머지 필드만 사용
                key: value for key, value in new_data.items() if key not in ['id','user_id']
            }

            new_index = len(document['value']) + 1
            new_data_with_index = {
                "index": new_index,
                **new_data_filtered
            }
            result = collection.update_one(
                {"id": document_id},
                {"$push": {"value": new_data_with_index}}
            )

            if result.modified_count > 0:
                return f"Successfully added data to document with ID: {document_id}"
            else:
                raise NotFoundException(f"No document found with ID: {document_id} or no data added.")
        except PyMongoError as e:
            raise InternalServerErrorException(detail=str(e))

    def get_chatlog_value(self, user_id: str, document_id: str) -> list:
        """
        특정 문서의 'value' 필드에 JSON 데이터를 추가하는 함수.
        :param document_id: 문서의 ID
        :return: 해당 문서의 'value' 필드 데이터 또는 빈 배열
        """
        try:
            collection = self.db[f'chatlog_{user_id}']
            document = collection.find_one({"id": document_id})

            if document is None:
                raise NotFoundException(f"No document found with ID: {document_id}")

            # document에서 value를 반환
            return document.get("value", [])
            
        except PyMongoError as e:
            raise InternalServerErrorException(detail=str(e))

    def remove_chatlog_value(self, user_id: str, document_id: str, selected_count: int) -> str:
        """
        특정 대화의 최신 대화 ~ 선택한 대화를 지우는 함수.
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param selected_count: 선택한 대화의 인덱스
        :return: 성공 메시지 또는 실패 메시지
        """
        try:
            collection = self.db[f'chatlog_{user_id}']
            document = collection.find_one({"id": document_id})

            if document is None:
                raise NotFoundException(f"No document found with ID: {document_id}")

            result = collection.update_one( # 선택한 인덱스 이후의 대화 항목을 삭제합니다.
                {"id": document_id},
                {"$pull": {"value": {"index": {"$gte": selected_count}}}}
            )

            if result.modified_count > 0:
                return f"Successfully removed data from document with ID: {document_id}"
            else:
                raise NotFoundException(f"No document found with ID: {document_id} or no data removed.")
                
        except PyMongoError as e:
            raise InternalServerErrorException(detail=str(e))
