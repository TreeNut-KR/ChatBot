import logging
from fastapi import HTTPException, Request, FastAPI
from fastapi.responses import JSONResponse
from typing import Dict, Type, Callable
import os

# 현재 파일의 상위 디렉토리 경로
current_directory = os.path.dirname(os.path.abspath(__file__))
parent_directory = os.path.dirname(current_directory) # 상위 디렉토리

# 로그 디렉토리 및 파일 경로 설정
log_dir = os.path.join(parent_directory, "logs")
log_file = os.path.join(log_dir, "error.log")

# 로그 디렉토리가 없는 경우 생성
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Logger 설정
logger = logging.getLogger("fastapi_error_handlers")
logger.setLevel(logging.DEBUG)
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

class NotFoundException(HTTPException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=404, detail=detail)

class BadRequestException(HTTPException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=400, detail=detail)

class UnauthorizedException(HTTPException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status_code=401, detail=detail)

class ForbiddenException(HTTPException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=403, detail=detail)

class ValueErrorException(HTTPException):
    def __init__(self, detail: str = "Value Error"):
        super().__init__(status_code=422, detail=detail)

class InternalServerErrorException(HTTPException):
    def __init__(self, detail: str = "Internal server error"):
        super().__init__(status_code=500, detail=detail)

class DatabaseErrorException(HTTPException):
    def __init__(self, detail: str = "Database Error"):
        super().__init__(status_code=503, detail=detail)

# 예외와 핸들러 매핑
exception_handlers: Dict[Type[HTTPException], Callable[[Request, HTTPException], JSONResponse]] = {
    NotFoundException: lambda request, exc: JSONResponse(
        status_code=exc.status_code,
        content={"detail": "The requested resource could not be found."},
    ),
    BadRequestException: lambda request, exc: JSONResponse(
        status_code=exc.status_code,
        content={"detail": "The request was invalid."},
    ),
    UnauthorizedException: lambda request, exc: JSONResponse(
        status_code=exc.status_code,
        content={"detail": "Unauthorized access."},
    ),
    ForbiddenException: lambda request, exc: JSONResponse(
        status_code=exc.status_code,
        content={"detail": "Access to this resource is forbidden."},
    ),
    ValueErrorException: lambda request, exc: JSONResponse(
        status_code=exc.status_code,
        content={"detail": "The input data is invalid."},
    ),
    InternalServerErrorException: lambda request, exc: JSONResponse(
        status_code=exc.status_code,
        content={"detail": "An internal server error occurred."},
    ),
    DatabaseErrorException: lambda request, exc: JSONResponse(
        status_code=exc.status_code,
        content={"detail": "A database error occurred. Please contact the administrator."},
    ),
}

async def generic_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    '''
    예외 핸들러
    '''
    handler = exception_handlers.get(type(exc), None)
    if handler is None:
        logger.error(f"Unhandled exception: {exc.detail} - URL: {request.url} - Method: {request.method} - Headers: {request.headers}")
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected error occurred."},
        )
    if exc.status_code == 403:
        logger.info(f"403 Forbidden - URL: {request.url} - Method: {request.method} - Headers: {request.headers}")
    else:
        logger.error(f"{exc.__class__.__name__}: {exc.detail} - URL: {request.url} - Method: {request.method} - Headers: {request.headers}")
    return handler(request, exc)

def add_exception_handlers(app: FastAPI):
    for exc_type, handler in exception_handlers.items():
        app.add_exception_handler(exc_type, generic_exception_handler)
