# mongo/init_db.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv

def initialize_database():
    # 현재 파일의 디렉토리 경로
    current_directory = os.path.dirname(os.path.abspath(__file__))
    env_file_path = os.path.join(current_directory, '.env')
    load_dotenv(env_file_path)  # .env 파일 로드

    mongo_host = os.getenv("MONGO_HOST", "localhost")
    mongo_port = int(os.getenv("MONGO_PORT", 27017))
    mongo_admin_user = os.getenv("MONGO_ADMIN_USER", "root")
    mongo_admin_password = os.getenv("MONGO_ADMIN_PASSWORD", "1234")
    mongo_database = os.getenv("MONGO_DATABASE", "chatbot")

    # MongoDB 클라이언트 생성
    client = MongoClient(
        host=mongo_host,
        port=mongo_port,
        username=mongo_admin_user,
        password=mongo_admin_password,
        authSource="admin"
    )

    # 데이터베이스 생성 (컬렉션 추가로)
    db = client[mongo_database]
    db.create_collection("initial_collection")  # 컬렉션 생성 (데이터베이스 생성)

    print(f"Database '{mongo_database}' created successfully with initial collection.")

if __name__ == "__main__":
    initialize_database()
