import os
import asyncio
from dotenv import load_dotenv
from typing import NoReturn, List
from databases import Database

class MySQLDBHandler:
    def __init__(self) -> NoReturn:
        current_directory = os.path.dirname(os.path.abspath(__file__))
        env_file_path = os.path.join(current_directory, '../.env')
        load_dotenv(env_file_path)

        self.database = Database(f"mysql://{os.getenv('MYSQL_ROOT_USER')}:" \
                                 f"{os.getenv('MYSQL_ROOT_PASSWORD')}@" \
                                 f"{os.getenv('MYSQL_HOST')}:" \
                                 f"{os.getenv('MYSQL_PORT')}/" \
                                 f"{os.getenv('MYSQL_DATABASE')}")

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

# if __name__ == "__main__":
#     async def main():
#         db_handler = MySQLDBHandler()
#         await db_handler.connect()
#         print("Database connected successfully!")

#         # 테이블 목록 가져오기
#         tables = await db_handler.get_tables()
#         print("Tables in the database:")
#         for table in tables:
#             print(f"- {table}")

#         await db_handler.disconnect()
#         print("Database disconnected successfully!")

#     asyncio.run(main())
