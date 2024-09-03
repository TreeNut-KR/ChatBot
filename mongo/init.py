import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def initialize_database():
    """
    MongoDBHandler 클래스 초기화.
    MongoDB에 연결하고 필요한 환경 변수를 로드하여 데이터베이스를 생성합니다.
    작업이 완료된 후 클라이언트를 종료합니다.
    """
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
    mongo_uri = (
        f"mongodb://{mongo_user}:{mongo_password}@{mongo_host}:{mongo_port}/{mongo_db}?authSource={mongo_auth}"
    )
    
    # MongoDB 클라이언트 초기화
    client = AsyncIOMotorClient(mongo_uri)
    db = client[mongo_db]

    # 데이터베이스 생성 (MongoDB는 실제 데이터 삽입 전까지 데이터베이스를 생성하지 않지만, 컬렉션을 생성하여 강제로 데이터베이스를 생성할 수 있습니다.)
    collection_name = "TreeNut_collection"
    collection = db[collection_name]
    await collection.insert_one({"initial": "🌳"})

    # 클라이언트 종료
    client.close()

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(initialize_database())
