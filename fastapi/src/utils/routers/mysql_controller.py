from fastapi import APIRouter
from . import ChatError, mysql_handler

mysql_router = APIRouter() # MySQL 관련 라우터 정의

@mysql_router.get("/tables", summary="테이블 목록 가져오기")
async def list_tables():
    '''
    MySQL 데이터베이스 내의 모든 테이블 목록을 반환합니다.
    '''
    try:
        tables = await mysql_handler.get_tables()
        return {"Tables": tables}
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))

@mysql_router.get("/query", summary="사용자 정의 쿼리 실행")
async def execute_query(query: str):
    '''
    사용자 정의 MySQL 쿼리를 실행하고 결과를 반환합니다.
    '''
    try:
        if not query.lower().startswith(("select", "show")):
            raise ChatError.BadRequestException(detail="Only SELECT and SHOW queries are allowed.")
        
        result = await mysql_handler.execute_query(query)
        return {"Result": result}
    except ChatError.BadRequestException as e:
        raise e
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
