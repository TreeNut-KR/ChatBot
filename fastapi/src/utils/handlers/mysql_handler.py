import os
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv
from typing import NoReturn, List
from databases import Database
from sqlalchemy import text


class MySQLDBHandler:
    def __init__(self) -> NoReturn:
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
        await self.database.connect()

    async def disconnect(self):
        await self.database.disconnect()

    async def execute_query(self, query: str, params: tuple = None) -> List[dict]:
        result = await self.database.fetch_all(query=query, values=params)
        return [dict(row) for row in result]

    async def get_tables(self) -> List[str]:
        query = "SHOW TABLES"
        tables = await self.execute_query(query)
        return [table[f'Tables_in_{os.getenv("MYSQL_DATABASE")}'] for table in tables]
    
    async def create_verification_code(self, code:str, userid: str):
        check_query = text(
            """
            SELECT id FROM email_verification
            WHERE userid = :userid
            """
        )
        result = await self.execute_query(check_query, {'userid': userid})
        existing = result.fetchone()
        
        expiration_time = datetime.now() + timedelta(minutes=15)
        if existing is None:
            insert_query = text(
                """
                INSERT INTO email_verification (userid, verification_code, expiry_time)
                VALUES (:userid, :code, :expiration_time)
                """
            )
            await self.execute_query(insert_query, {
                'userid': userid,
                'code': code,
                'expiration_time': expiration_time
            })
        else:
            update_query  = text(
                """
                UPDATE email_verification
                SET verification_code = :code, expiry_time = :expiration_time
                WHERE userid = :userid
                """
            )
            await self.execute_query(update_query, {
                'userid': userid,
                'code': code,
                'expiration_time': expiration_time
            })

    async def code_verification(self, code: str, userid: str) -> str:
        ckeck_query = text(
            """
            SELECT verification_code, expiry_time
            FROM email_verification
            WHERE  userid = :userid
            """
        )
        result = await self.execute_query(ckeck_query, {'userid': userid})
        row = result.fetchone()
        if row is None:
            return "code not found"
        verification_code, expiry_time = row["verification_code"], row["expiry_time"]

        if expiry_time < datetime.now():
            delete_query = text(
                """
                DELETE FROM email_verification
                WHERE userid = :userid
                """
            )
            await self.execute_query(delete_query, {'userid': userid})
            return "code is expired"
        
        if verification_code == code:
            delete_query = text(
                """
                DELETE FROM email_verification
                WHERE userid = :userid
                """
            )
            await self.execute_query(delete_query, {'userid': userid})
            return "success"
        else:
            return "code is different"