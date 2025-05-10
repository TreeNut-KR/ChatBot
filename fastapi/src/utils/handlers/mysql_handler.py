import os
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv
from typing import NoReturn, List
from databases import Database
from sqlalchemy import text

class MySQLDBHandler:
    def __init__(self) -> NoReturn:
        '''
        MySQL 데이터베이스 초기 설정 및 연결 URL 구성
        '''
        current_directory = os.path.dirname(os.path.abspath(__file__))
        env_file_path = os.path.join(current_directory, '../../.env')
        load_dotenv(env_file_path)

        self.database = Database(
            f"mysql://{os.getenv('MYSQL_ROOT_USER')}:" \
            f"{os.getenv('MYSQL_ROOT_PASSWORD')}@" \
            f"{os.getenv('MYSQL_ROOT_HOST')}:" \
            f"{os.getenv('MYSQL_ROOT_PORT')}/" \
            f"{os.getenv('MYSQL_DATABASE')}"
        )

    async def connect(self):
        '''
        데이터베이스 연결
        '''
        await self.database.connect()

    async def disconnect(self):
        '''
        데이터베이스 연결 해제
        '''
        await self.database.disconnect()

    async def fetch_all(self, query: str, params: dict = None) -> List[dict]:
        '''
        SELECT 쿼리 실행 후 결과 리스트 반환
        '''
        return await self.database.fetch_all(query=query, values=params)

    async def execute(self, query: str, params: dict = None):
        '''
        INSERT, UPDATE, DELETE 쿼리 실행
        '''
        await self.database.execute(query=query, values=params)

    async def get_tables(self) -> List[str]:
        '''
        데이터베이스 내 모든 테이블 이름 반환
        '''
        query = "SHOW TABLES"
        tables = await self.fetch_all(query)
        return [table[f'Tables_in_{os.getenv("MYSQL_DATABASE")}'] for table in tables]

    async def get_membership_by_userid(self, userid: str) -> str:
        '''
        userid로 membership 등급(BASIC, VIP) 조회
        '''
        query = """
            SELECT membership FROM users
            WHERE userid = :userid
        """
        result = await self.fetch_all(query, {'userid': userid})
        return result[0]['membership'] if result else None
    
    async def create_verification_code(self, code: str, userid: str):
        '''
        인증 코드 생성 또는 갱신 (만료 시간: 15분)
        '''
        check_query = """
            SELECT id FROM email_verification
            WHERE userid = :userid
        """
        result = await self.fetch_all(check_query, {'userid': userid})
        existing = result[0] if result else None

        expiration_time = datetime.now() + timedelta(minutes=15)

        if existing is None:
            insert_query = """
                INSERT INTO email_verification (userid, verification_code, expiry_time)
                VALUES (:userid, :code, :expiration_time)
            """
            await self.execute(insert_query, {
                'userid': userid,
                'code': code,
                'expiration_time': expiration_time
            })
        else:
            update_query = """
                UPDATE email_verification
                SET verification_code = :code, expiry_time = :expiration_time
                WHERE userid = :userid
            """
            await self.execute(update_query, {
                'userid': userid,
                'code': code,
                'expiration_time': expiration_time
            })

    async def code_verification(self, code: str, userid: str, email: str) -> str:
        '''
        인증 코드 검증 및 만료 여부 확인
        '''
        check_query = """
            SELECT verification_code, expiry_time
            FROM email_verification
            WHERE userid = :userid
        """
        result = await self.fetch_all(check_query, {'userid': userid})
        row = result[0] if result else None

        if row is None:
            return "code not found"

        verification_code, expiry_time = row["verification_code"], row["expiry_time"]

        if expiry_time < datetime.now():
            delete_query = """
                DELETE FROM email_verification
                WHERE userid = :userid
            """
            await self.execute(delete_query, {'userid': userid})
            return "code is expired"

        if verification_code == code:
            delete_query = """
                DELETE FROM email_verification
                WHERE userid = :userid
            """
            await self.execute(delete_query, {'userid': userid})
            update_membership_query = """
                UPDATE users
                SET membership = 'VIP',
                    email = :email
                WHERE userid = :userid
            """
            await self.execute(update_membership_query, {'userid': userid, 'email': email})

            return "success"
        else:
            return "code is different"
