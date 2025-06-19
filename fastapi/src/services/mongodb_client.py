import os
import uuid
import datetime

from pathlib import Path
from dotenv import load_dotenv
from typing import Dict, List
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError


from utils import error_tools

class MongoDBHandler:
    def __init__(self) -> None:
        """
        MongoDBHandler 클래스 초기화.
        MongoDB에 연결하고 필요한 환경 변수를 로드합니다.
        """
        try:
            env_file_path = Path(__file__).resolve().parents[1] / ".env"
            load_dotenv(env_file_path)
            
            # 환경 변수에서 MongoDB 연결 URI 가져오기
            mongo_host = os.getenv("MONGO_HOST")
            mongo_port = os.getenv("MONGO_PORT", 27017)
            mongo_user = os.getenv("MONGO_ADMIN_USER")
            mongo_password = os.getenv("MONGO_ADMIN_PASSWORD")
            mongo_db = os.getenv("MONGO_DATABASE")
            mongo_auth = os.getenv("MONGO_AUTH")
            
            # 디버깅 코드 추가
            if not mongo_db:
                raise ValueError("MONGO_DATABASE 환경 변수가 설정되지 않았습니다.")
            
            # MongoDB URI 생성
            self.mongo_uri = (
                f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}/{mongo_db}?authSource={mongo_auth}"
            )
            
            # MongoDB 클라이언트 초기화
            self.client = AsyncIOMotorClient(self.mongo_uri)
            self.db = self.client[mongo_db]
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"MongoDB connection error: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Error initializing MongoDBHandler: {str(e)}")

    async def get_db(self) -> List[str]:
        """
        데이터베이스 이름 목록을 반환합니다.
        
        :return: 데이터베이스 이름 리스트
        :raises error_tools.InternalServerErrorException: 데이터베이스 이름을 가져오는 도중 문제가 발생할 경우
        """
        try:
            return await self.client.list_database_names()
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"Error retrieving database names: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    async def get_collection(self, database_name: str) -> List[str]:
        """
        데이터베이스의 컬렉션 이름 목록을 반환합니다.
        
        :param database_name: 데이터베이스 이름
        :return: 컬렉션 이름 리스트
        :raises error_tools.NotFoundException: 데이터베이스가 존재하지 않을 경우
        :raises error_tools.InternalServerErrorException: 컬렉션 이름을 가져오는 도중 문제가 발생할 경우
        """
        db_names = await self.get_db()
        if (database_name not in db_names):
            raise error_tools.NotFoundException(f"Database '{database_name}' not found.")
        try:
            return await self.client[database_name].list_collection_names()
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"Error retrieving collection names: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    async def remove_log(self, user_id: str, document_id: str, selected_count: int, router: str) -> str:
        """
        특정 대화의 최신 대화 ~ 선택한 대화를 지웁니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param selected_count: 선택한 대화의 인덱스
        :return: 성공 메시지
        :raises error_tools.NotFoundException: 문서가 존재하지 않을 경우
        :raises error_tools.InternalServerErrorException: 데이터를 제거하는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'{router}_log_{user_id}']
            document = await collection.find_one({"id": document_id})

            if document is None:
                raise error_tools.NotFoundException(f"No document found with ID: {document_id}")

            # 'value' 필드에서 삭제할 항목 필터링 (selected_count 이상)
            value_to_remove = [item for item in document.get("value", []) if item.get("index") >= selected_count]

            if not value_to_remove:
                raise error_tools.NotFoundException(f"No data found to remove starting from index: {selected_count}")

            # 해당 index부터 마지막 데이터까지 삭제
            result = await collection.update_one(
                {"id": document_id},
                {"$pull": {"value": {"index": {"$gte": selected_count}}}}
            )

            if result.modified_count > 0:
                return f"Successfully removed data from index: {selected_count} to the end in document with ID: {document_id}"
            else:
                raise error_tools.NotFoundException(f"No data removed for document with ID: {document_id}")
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"Error removing chatlog value: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    async def remove_collection(self, user_id: str, document_id: str, router: str) -> str:
        """
        특정 대화방을 지웁니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :return: 성공 메시지
        :raises error_tools.NotFoundException: 문서가 존재하지 않을 경우
        :raises error_tools.InternalServerErrorException: 데이터를 제거하는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'{router}_log_{user_id}']
            document = await collection.find_one({"id": document_id})

            if document is None:
                raise error_tools.NotFoundException(f"No document found with ID: {document_id}")

            remove_collection = await collection.delete_one({"id": document_id})  # 수정: 조건으로 ID 사용

            if remove_collection.deleted_count == 0:
                raise error_tools.NotFoundException(f"No data found to remove document: {document_id}")
            elif remove_collection.deleted_count > 0:
                return f"Successfully deleted document with ID: {document_id}"
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"Error deleting document: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")
        
# Office Collection---------------------------------------------------------------------------------------------------
    async def create_office_collection(self, user_id: str, router: str) -> str:
        """
        사용자 ID에 기반한 채팅 로그 컬렉션을 생성합니다.
        
        :param user_id: 사용자 ID
        :return: 생성된 문서의 UUID
        :raises error_tools.InternalServerErrorException: 채팅 로그 컬렉션을 생성하는 도중 문제가 발생할 경우
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
            raise error_tools.InternalServerErrorException(detail=f"Error creating chatlog collection: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")
        

    async def add_office_log(self, user_id: str, document_id: str, new_data: Dict) -> str:
        """
        특정 문서의 'value' 필드에 JSON 데이터를 추가합니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param new_data: 추가할 JSON 데이터
        :return: 성공 메시지
        :raises error_tools.NotFoundException: 문서가 존재하지 않을 경우
        :raises error_tools.InternalServerErrorException: 데이터를 추가하는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'office_log_{user_id}']
            document = await collection.find_one({"id": document_id})
            if document is None:
                raise error_tools.NotFoundException(f"No document found with ID: {document_id}")
            
            # 'id', 'user_id' 필드를 제외한 나머지 필드만 사용
            new_data_filtered = {
                key: value for key, value in new_data.items() if key not in ['id', 'user_id']
            }

            # 현재 날짜 시간 정보 추가
            current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            new_data_filtered["timestamp"] = current_time

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
                raise error_tools.NotFoundException(f"No document found with ID: {document_id} or no data added.")
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"Error adding chatlog value: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    async def update_office_log(self, user_id: str, document_id: str, new_Data: Dict):
        """
        특정 문서의 'value' 필드 중 가장 큰 인덱스(최신 대화)의 데이터를 수정합니다.

        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param new_Data: 업데이트할 데이터
        :return: 성공 메시지
        :raises error_tools.NotFoundException: 문서가 존재하지 않을 경우
        :raises error_tools.InternalServerErrorException: 데이터를 수정하는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'office_log_{user_id}']
            document = await collection.find_one({"id": document_id})
            
            if document is None:
                raise error_tools.NotFoundException(f"No document found with ID: {document_id}")
                
            value_list = document.get("value", [])
            
            if not value_list:
                raise error_tools.NotFoundException(f"No conversations found in document with ID: {document_id}")
                
            # None 값을 안전하게 처리하는 정렬 키 함수
            def safe_get_index(item):
                index = item.get("index")
                # None 값이거나 정수가 아닌 경우 기본값으로 0 반환
                return index if index is not None else 0
                
            # 가장 큰 인덱스(최신 대화) 찾기
            sorted_value_list = sorted(value_list, key=safe_get_index)
            if not sorted_value_list:
                raise error_tools.NotFoundException(f"No valid conversations found in document with ID: {document_id}")
                
            latest_item = sorted_value_list[-1]  # 가장 큰 인덱스를 가진 항목
            latest_index = latest_item.get("index")
            
            if latest_index is None:
                raise error_tools.NotFoundException(f"Latest conversation has no valid index in document with ID: {document_id}")

            # 'id', 'user_id' 필드를 제외한 나머지 필드만 사용
            update_data_filtered = {
                key: value for key, value in new_Data.items() if key not in ['id', 'user_id']
            }
            
            # 현재 날짜 시간 정보 추가
            current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            update_data_filtered["timestamp"] = current_time
            
            # 최신 대화에 대한 업데이트 데이터 준비
            update_data_with_index = {
                "index": latest_index,
                **update_data_filtered
            }
            
            # 최신 대화 삭제 후 업데이트된 데이터 추가
            result_pull = await collection.update_one(
                {"id": document_id},
                {"$pull": {"value": {"index": latest_index}}}
            )
            
            result_push = await collection.update_one(
                {"id": document_id},
                {"$push": {"value": update_data_with_index}}
            )
            
            if result_pull.modified_count > 0 or result_push.modified_count > 0:
                return f"Successfully updated latest conversation (index: {latest_index}) in document with ID: {document_id}"
            else:
                raise error_tools.NotFoundException(f"Failed to update data in document with ID: {document_id}")
                
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"Error updating chatlog value: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")
        
    async def get_offic_log(self, user_id: str, document_id: str, router: str) -> List[Dict]:
        """
        특정 문서의 'value' 필드를 반환합니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :return: 해당 문서의 'value' 필드 데이터 또는 빈 배열
        :raises error_tools.NotFoundException: 문서가 존재하지 않을 경우
        :raises error_tools.InternalServerErrorException: 데이터를 가져오는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'{router}_log_{user_id}']
            document = await collection.find_one({"id": document_id})

            if document is None:
                raise error_tools.NotFoundException(f"No document found with ID: {document_id}")

            value_list = document.get("value", [])

            sorted_value_list = sorted(value_list, key=lambda x:x.get("index"))

            # document에서 value를 반환
            return sorted_value_list
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"Error retrieving chatlog value: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    
# ChatBot Collection---------------------------------------------------------------------------------------------------
    async def create_chatbot_collection(self, user_id: str, character: int, router: str) -> str:
        """
        사용자 ID에 기반한 채팅 로그 컬렉션을 생성합니다.
        
        :param user_id: 사용자 ID
        :param character: 캐릭터 인덱스
        :param router: 라우터 타입
        :return: 생성된 문서의 UUID
        :raises error_tools.InternalServerErrorException: 채팅 로그 컬렉션을 생성하는 도중 문제가 발생할 경우
        """
        try:
            collection_name = f'{router}_log_{user_id}'
            collection = self.db[collection_name]
            
            # 항상 새로운 UUID 생성
            document_id = str(uuid.uuid4())
            document = {
                "id": document_id,
                "character_idx": character,
                "value": []
            }
        
            result = await collection.insert_one(document)
            if not result.inserted_id:
                raise error_tools.InternalServerErrorException("문서 생성 실패")
                
            return document_id
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"MongoDB 에러: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"예상치 못한 에러: {str(e)}")
        
    async def add_chatbot_log(self, user_id: str, document_id: str, new_data: Dict) -> str:
        """
        특정 문서의 'value' 필드에 JSON 데이터를 추가합니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param new_data: 추가할 JSON 데이터
        :return: 성공 메시지
        :raises error_tools.NotFoundException: 문서가 존재하지 않을 경우
        :raises error_tools.InternalServerErrorException: 데이터를 추가하는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'chatbot_log_{user_id}']
            document = await collection.find_one({"id": document_id})
            if document is None:
                raise error_tools.NotFoundException(f"No document found with ID: {document_id}")
            
            # 'id', 'user_id' 필드를 제외한 나머지 필드만 사용
            new_data_filtered = {
                key: value for key, value in new_data.items() if key not in ['id', 'user_id']
            }
            
            # 현재 날짜 시간 정보 추가
            current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            new_data_filtered["timestamp"] = current_time

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
                raise error_tools.NotFoundException(f"No document found with ID: {document_id} or no data added.")
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"Error adding chatlog value: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")

    async def update_chatbot_log(self, user_id: str, document_id: str, new_Data: Dict):
        """
        특정 문서의 'value' 필드 중 가장 큰 인덱스(최신 대화)의 데이터를 수정합니다.

        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :param new_Data: 업데이트할 데이터
        :return: 성공 메시지
        :raises error_tools.NotFoundException: 문서가 존재하지 않을 경우
        :raises error_tools.InternalServerErrorException: 데이터를 수정하는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'chatbot_log_{user_id}']
            document = await collection.find_one({"id": document_id})
            
            if document is None:
                raise error_tools.NotFoundException(f"No document found with ID: {document_id}")
                
            value_list = document.get("value", [])
            
            if not value_list:
                raise error_tools.NotFoundException(f"No conversations found in document with ID: {document_id}")
                
            # None 값을 안전하게 처리하는 정렬 키 함수
            def safe_get_index(item):
                index = item.get("index")
                # None 값이거나 정수가 아닌 경우 기본값으로 0 반환
                return index if index is not None else 0
                
            # 가장 큰 인덱스(최신 대화) 찾기
            sorted_value_list = sorted(value_list, key=safe_get_index)
            if not sorted_value_list:
                raise error_tools.NotFoundException(f"No valid conversations found in document with ID: {document_id}")
                
            latest_item = sorted_value_list[-1]  # 가장 큰 인덱스를 가진 항목
            latest_index = latest_item.get("index")
            
            if latest_index is None:
                raise error_tools.NotFoundException(f"Latest conversation has no valid index in document with ID: {document_id}")

            # 'id', 'user_id' 필드를 제외한 나머지 필드만 사용
            update_data_filtered = {
                key: value for key, value in new_Data.items() if key not in ['id', 'user_id']
            }
            
            # 현재 날짜 시간 정보 추가
            current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            update_data_filtered["timestamp"] = current_time
            
            # 최신 대화에 대한 업데이트 데이터 준비
            update_data_with_index = {
                "index": latest_index,
                **update_data_filtered
            }
            
            # 최신 대화 삭제 후 업데이트된 데이터 추가
            result_pull = await collection.update_one(
                {"id": document_id},
                {"$pull": {"value": {"index": latest_index}}}
            )
            
            result_push = await collection.update_one(
                {"id": document_id},
                {"$push": {"value": update_data_with_index}}
            )
            
            if result_pull.modified_count > 0 or result_push.modified_count > 0:
                return f"Successfully updated latest conversation (index: {latest_index}) in document with ID: {document_id}"
            else:
                raise error_tools.NotFoundException(f"Failed to update data in document with ID: {document_id}")
                
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"Error updating chatlog value: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")
        
    async def get_chatbot_log(self, user_id: str, document_id: str, router: str):
        """
        특정 문서의 'value' 필드와 'character_idx' 필드를 반환합니다.
        
        :param user_id: 사용자 ID
        :param document_id: 문서의 ID
        :return: 해당 문서의 'value' 필드 데이터와 'character_idx'
        :raises error_tools.NotFoundException: 문서가 존재하지 않을 경우
        :raises error_tools.InternalServerErrorException: 데이터를 가져오는 도중 문제가 발생할 경우
        """
        try:
            collection = self.db[f'{router}_log_{user_id}']
            document = await collection.find_one({"id": document_id})

            if document is None:
                raise error_tools.NotFoundException(f"No document found with ID: {document_id}")

            value_list = document.get("value", [])
            character_idx = document.get("character_idx", 0)  # character_idx가 없으면 0을 반환

            sorted_value_list = sorted(value_list, key=lambda x:x.get("index"))

            # document에서 value와 character_idx를 함께 반환
            return sorted_value_list, character_idx
        except PyMongoError as e:
            raise error_tools.InternalServerErrorException(detail=f"Error retrieving chatlog value: {str(e)}")
        except Exception as e:
            raise error_tools.InternalServerErrorException(detail=f"Unexpected error: {str(e)}")
