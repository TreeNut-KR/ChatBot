from typing import Optional
from services import (
    mongodb_client,
    mysql_client
)

GREEN = "\033[32m"
RED = "\033[31m"
RESET = "\033[0m"

# 핸들러 인스턴스는 초기에 None으로 설정하고 지연 초기화
mysql_handler: Optional[mysql_client.MySQLDBHandler] = None
mongo_handler: Optional[mongodb_client.MongoDBHandler] = None

async def initialize_handlers():
    """
    애플리케이션 시작 시 모든 DB 핸들러 초기화
    """
    global mysql_handler, mongo_handler
    
    # 지연 초기화: 핸들러가 아직 생성되지 않았다면 생성
    if mysql_handler is None:
        try:
            mysql_handler = mysql_client.MySQLDBHandler()
            print(f"{GREEN}INFO{RESET}:     MySQL 핸들러가 성공적으로 초기화되었습니다.")
        except Exception as e:
            print(f"{RED}ERROR{RESET}:     MySQL 초기화 오류 발생: {str(e)}")
            mysql_handler = None
    
    if mongo_handler is None:
        try:
            mongo_handler = mongodb_client.MongoDBHandler()
            print(f"{GREEN}INFO{RESET}:     MongoDB 핸들러가 성공적으로 초기화되었습니다.")
        except Exception as e:
            print(f"{RED}ERROR{RESET}:     MongoDB 초기화 오류 발생: {str(e)}")
            mongo_handler = None
    
    # 연결 설정
    if mysql_handler is not None:
        try:
            await mysql_handler.connect()
            print(f"{GREEN}INFO{RESET}:     MySQL 데이터베이스에 연결되었습니다.")
        except Exception as e:
            print(f"{RED}ERROR{RESET}:     MySQL 연결 오류: {str(e)}")

async def cleanup_handlers():
    """
    애플리케이션 종료 시 모든 DB 핸들러 정리
    """
    global mysql_handler, mongo_handler
    
    if mysql_handler is not None:
        try:
            await mysql_handler.disconnect()
            print(f"{GREEN}INFO{RESET}:     MySQL 데이터베이스 연결이 종료되었습니다.")
        except Exception as e:
            print(f"{RED}ERROR{RESET}:     MySQL 연결 종료 오류: {str(e)}")

def get_mysql_handler() -> Optional[mysql_client.MySQLDBHandler]:
    """MySQL 핸들러 인스턴스를 반환하는 함수"""
    return mysql_handler

def get_mongo_handler() -> Optional[mongodb_client.MongoDBHandler]:
    """MongoDB 핸들러 인스턴스를 반환하는 함수"""
    return mongo_handler
