from pymongo import MongoClient
from typing import List
from dotenv import load_dotenv
import os

def get_database_names(host: str, port: int, username: str, password: str, auth_source: str) -> List[str]:
    """
    MongoDB에 연결하여 데이터베이스 목록을 반환합니다.

    Parameters:
        host (str): MongoDB 호스트
        port (int): MongoDB 포트
        username (str): MongoDB 사용자 이름
        password (str): MongoDB 비밀번호
        auth_source (str): 인증 소스 데이터베이스

    Returns:
        List[str]: 데이터베이스 이름 목록
    """
    # MongoDB 클라이언트 생성
    client = MongoClient(
        host=host,
        port=port,
        username=username,
        password=password,
        authSource=auth_source
    )
    
    # 데이터베이스 목록 가져오기
    db_names = client.list_database_names()
    
    return db_names

if __name__ == "__main__":
    load_dotenv()
    # 환경 변수 또는 직접 값을 설정하여 사용
    HOST = "localhost"
    PORT = 27017
    USERNAME = os.getenv("MONGO_ADMIN_USER")
    PASSWORD = os.getenv("MONGO_ADMIN_PASSWORD")
    AUTH_SOURCE = "admin"

    # 데이터베이스 목록 출력
    databases = get_database_names(HOST, PORT, USERNAME, PASSWORD, AUTH_SOURCE)
    print("MongoDB 데이터베이스 목록:")
    for db_name in databases:
        print(f" - {db_name}")
