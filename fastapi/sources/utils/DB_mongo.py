import os
import uuid
from typing import Dict, List
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError

from .Error_handlers import InternalServerErrorException, NotFoundException

class MongoDBHandler:
    def __init__(self) -> None:
        """
        MongoDBHandler 클래스 초기화.
        MongoDB에 연결하고 필요한 환경 변수를 로드합니다.
        """
        try:
            # 환경 변수 파일 경로 설정
            current_directory = os.path.dirname(os.path.abspath(__file__))
            env_file_path = os.path.join(current_directory, '../.env')
            load_dotenv(env_file_path)
            
            # 환경 변수에서 MongoDB 연결 URI 가져오기
            mongo_host = os.getenv("MONGO_HOST")
            mongo_port = os.getenv("MONGO_PORT", 27017)
            mongo_user = os.getenv("MONGO_ADMIN_USER")
            mongo_password = os.getenv("MONGO_ADMIN_PASSWORD")
            mongo_db = os.getenv("MONGO_DATABASE")
            mongo_auth = os.getenv("MONGO_AUTH")
            
            # MongoDB URI 생성
            self.mongo_uri = (
                f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}/{mongo_db}?authSource={mongo_auth}"
            )
            
            # MongoDB 클라이언트 초기화
            self.client = AsyncIOMotorClient(self.mongo_uri)
            self.db = self.client[mongo_db]
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"MongoDB connection error: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Error initializing MongoDBHandler: {str(e)}")

    async def get_db(self) -> List[str]:
        """
        데이터베이스 이름 목록을 반환합니다.
        
        :return: 데이터베이스 이름 리스트
        :raises InternalServerErrorException: 데이터베이스 이름을 가져오는 도중 문제가 발생할 경우
        """
        try:
            return await self.client.list_database_names()
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"Error retrieving database names: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    async def get_collection(self, database_name: str) -> List[str]:
        """
        데이터베이스의 컬렉션 이름 목록을 반환합니다.
        
        :param database_name: 데이터베이스 이름
        :return: 컬렉션 이름 리스트
        :raises NotFoundException: 데이터베이스가 존재하지 않을 경우
        :raises InternalServerErrorException: 컬렉션 이름을 가져오는 도중 문제가 발생할 경우
        """
        db_names = await self.get_db_names()
        if database_name not in db_names:
            raise NotFoundException(f"Database '{database_name}' not found.")
        try:
            return await self.client[database_name].list_collection_names()
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"Error retrieving collection names: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Unexpected error: {str(e)}")


    async def create_collection(self, user_id: str, router: str) -> str:
        """
        사용자 ID에 기반한 채팅 로그 컬렉션을 생성합니다.
        
        :param user_id: 사용자 ID
        :return: 생성된 문서의 UUID
        :raises InternalServerErrorException: 채팅 로그 컬렉션을 생성하는 도중 문제가 발생할 경우
        """
        try:
            collection_name = f'{router}_log_{user_id}'
            collection = self.db[collection_name]
            document_id = str(uuid.uuid4())
            document = {
                "id": document_id,
                "value": []
            }
            await collection.insert_one(document)
            return document_id
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"Error creating chatlog collection: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Unexpected error: {str(e)}")
        
    async def get_log(self, user_id: str, document_id: str, router: str) -> List[Dict]:
        """
        특정 문서의 'value' 필드를 반환합니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :return: 해당 문서의 'value' 필드 데이터 또는 빈 배열
        :raises NotFoundException: 문서가 존재하지 않을 경우
        :raises InternalServerErrorException: 데이터를 가져오는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'{router}_log_{user_id}']
            document = await collection.find_one({"id": document_id})

            if document is None:
                raise NotFoundException(f"No document found with ID: {document_id}")

            value_list = document.get("value", [])

            sorted_value_list = sorted(value_list, key=lambda x:x.get("index"))

            # document에서 value를 반환
            return sorted_value_list
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"Error retrieving chatlog value: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    async def remove_log(self, user_id: str, document_id: str, selected_count: int, router: str) -> str:
        """
        특정 대화의 최신 대화 ~ 선택한 대화를 지웁니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param selected_count: 선택한 대화의 인덱스
        :return: 성공 메시지
        :raises NotFoundException: 문서가 존재하지 않을 경우
        :raises InternalServerErrorException: 데이터를 제거하는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'{router}_log_{user_id}']
            document = await collection.find_one({"id": document_id})

            if document is None:
                raise NotFoundException(f"No document found with ID: {document_id}")

            # 'value' 필드에서 삭제할 항목 필터링 (selected_count 이상)
            value_to_remove = [item for item in document.get("value", []) if item.get("index") >= selected_count]

            if not value_to_remove:
                raise NotFoundException(f"No data found to remove starting from index: {selected_count}")

            # 해당 index부터 마지막 데이터까지 삭제
            result = await collection.update_one(
                {"id": document_id},
                {"$pull": {"value": {"index": {"$gte": selected_count}}}}
            )

            if result.modified_count > 0:
                return f"Successfully removed data from index: {selected_count} to the end in document with ID: {document_id}"
            else:
                raise NotFoundException(f"No data removed for document with ID: {document_id}")
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"Error removing chatlog value: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    async def remove_collection(self, user_id: str, document_id: str, router: str) -> str:
        """
        특정 대화방을 지웁니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :return: 성공 메시지
        :raises NotFoundException: 문서가 존재하지 않을 경우
        :raises InternalServerErrorException: 데이터를 제거하는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'{router}_log_{user_id}']
            document = await collection.find_one({"id": document_id})

            if document is None:
                raise NotFoundException(f"No document found with ID: {document_id}")

            remove_collection = await collection.delete_one({"id": document_id})  # 수정: 조건으로 ID 사용

            if remove_collection.deleted_count == 0:
                raise NotFoundException(f"No data found to remove document: {document_id}")
            elif remove_collection.deleted_count > 0:
                return f"Successfully deleted document with ID: {document_id}"
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"Error deleting document: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Unexpected error: {str(e)}")
        
# Office Collection---------------------------------------------------------------------------------------------------

    async def add_office_log(self, user_id: str, document_id: str, new_data: Dict) -> str:
        """
        특정 문서의 'value' 필드에 JSON 데이터를 추가합니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param new_data: 추가할 JSON 데이터
        :return: 성공 메시지
        :raises NotFoundException: 문서가 존재하지 않을 경우
        :raises InternalServerErrorException: 데이터를 추가하는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'office_log_{user_id}']
            document = await collection.find_one({"id": document_id})
            if document is None:
                raise NotFoundException(f"No document found with ID: {document_id}")
            
            # 'id', 'user_id' 필드를 제외한 나머지 필드만 사용
            new_data_filtered = {
                key: value for key, value in new_data.items() if key not in ['id', 'user_id']
            }

            new_index = len(document['value']) + 1
            new_data_with_index = {
                "index": new_index,
                **new_data_filtered
            }
            result = await collection.update_one(
                {"id": document_id},
                {"$push": {"value": new_data_with_index}}
            )

            if result.modified_count > 0:
                return f"Successfully added data to document with ID: {document_id}"
            else:
                raise NotFoundException(f"No document found with ID: {document_id} or no data added.")
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"Error adding chatlog value: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    async def update_office_log(self, user_id:str, document_id:str, new_Data : Dict):
        """
        특정 문서의 'value' 필드를 수정합니다.

        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param index : 대화의 ID
        :return: 해당 문서의 수정된 'value' 필드 데이터
        :raises NotFoundException: 문서가 존재하지 않을 경우
        :raises InternalServerErrorException: 데이터를 가져오는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'office_log_{user_id}']
            document = await collection.find_one({"id": document_id})
            if document is None:
                raise NotFoundException(f"No document found with ID: {document_id}")


            update_data_filtered = {
                key: value for key, value in new_Data.items() if key not in ['user_id']
            }

            index = new_Data.get('index')

            update_data_with_index = {
                "index":index,
                **update_data_filtered
            }

            result = await collection.update_one(
                {"id": document_id},
                {"$pull": {"value": {"index": index}}}
            )

            result = await collection.update_one(
                {"id": document_id},
                {"$push": {"value": update_data_with_index}}
            )

            if result.modified_count > 0:
                return f"Successfully added data to document with ID: {document_id}, Values:{index}"
            else:
                raise NotFoundException(f"No document found with ID: {document_id} or no data added.")
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"Error adding chatlog value: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

# ChatBot Collection---------------------------------------------------------------------------------------------------

    async def add_chatbot_log(self, user_id: str, document_id: str, new_data: Dict) -> str:
        """
        특정 문서의 'value' 필드에 JSON 데이터를 추가합니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param new_data: 추가할 JSON 데이터
        :return: 성공 메시지
        :raises NotFoundException: 문서가 존재하지 않을 경우
        :raises InternalServerErrorException: 데이터를 추가하는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'chatbot_log_{user_id}']
            document = await collection.find_one({"id": document_id})
            if document is None:
                raise NotFoundException(f"No document found with ID: {document_id}")
            
            # 'id', 'user_id' 필드를 제외한 나머지 필드만 사용
            new_data_filtered = {
                key: value for key, value in new_data.items() if key not in ['id', 'user_id']
            }

            new_index = len(document['value']) + 1
            new_data_with_index = {
                "index": new_index,
                **new_data_filtered
            }
            result = await collection.update_one(
                {"id": document_id},
                {"$push": {"value": new_data_with_index}}
            )

            if result.modified_count > 0:
                return f"Successfully added data to document with ID: {document_id}"
            else:
                raise NotFoundException(f"No document found with ID: {document_id} or no data added.")
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"Error adding chatlog value: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    async def update_chatbot_log(self, user_id:str, document_id:str, new_Data : Dict):
        """
        특정 문서의 'value' 필드를 수정합니다.

        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param index : 대화의 ID
        :return: 해당 문서의 수정된 'value' 필드 데이터
        :raises NotFoundException: 문서가 존재하지 않을 경우
        :raises InternalServerErrorException: 데이터를 가져오는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'chatbot_log_{user_id}']
            document = await collection.find_one({"id": document_id})
            if document is None:
                raise NotFoundException(f"No document found with ID: {document_id}")


            update_data_filtered = {
                key: value for key, value in new_Data.items() if key not in ['user_id']
            }

            index = new_Data.get('index')

            update_data_with_index = {
                "index":index,
                **update_data_filtered
            }

            result = await collection.update_one(
                {"id": document_id},
                {"$pull": {"value": {"index": index}}}
            )

            result = await collection.update_one(
                {"id": document_id},
                {"$push": {"value": update_data_with_index}}
            )

            if result.modified_count > 0:
                return f"Successfully added data to document with ID: {document_id}, Values:{index}"
            else:
                raise NotFoundException(f"No document found with ID: {document_id} or no data added.")
        except PyMongoError as e:
            raise InternalServerErrorException(detail=f"Error adding chatlog value: {str(e)}")
        except Exception as e:
            raise InternalServerErrorException(detail=f"Unexpected error: {str(e)}")