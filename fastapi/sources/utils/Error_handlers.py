import logging
from fastapi import HTTPException, Request, FastAPI
from fastapi.responses import JSONResponse
import os

# 로그 디렉토리 및 파일 경로
log_dir = "./logs"
log_file = "./logs/error.log"

# 로그 디렉토리가 없는 경우 생성
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Logger 설정
logger = logging.getLogger("fastapi_error_handlers")
logger.setLevel(logging.ERROR)
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.ERROR)
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

class InternalServerErrorException(HTTPException):
    def __init__(self, detail: str = "Internal server error"):
        super().__init__(status_code=500, detail=detail)

async def not_found_exception_handler(request: Request, exc: NotFoundException):
    '''
    404 Not Found 에러 핸들러
    '''
    logger.error(f"NotFoundException: {exc.detail} - URL: {request.url} - Method: {request.method} - Headers: {request.headers}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": "The requested resource could not be found."},
    )

async def bad_request_exception_handler(request: Request, exc: BadRequestException):
    '''
    400 Bad Request 에러 핸들러
    '''
    logger.error(f"BadRequestException: {exc.detail} - URL: {request.url} - Method: {request.method} - Headers: {request.headers}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": "The request was invalid."},
    )

async def unauthorized_exception_handler(request: Request, exc: UnauthorizedException):
    '''
    401 Unauthorized 에러 핸들러
    '''
    logger.error(f"UnauthorizedException: {exc.detail} - URL: {request.url} - Method: {request.method} - Headers: {request.headers}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": "Unauthorized access."},
    )

async def forbidden_exception_handler(request: Request, exc: ForbiddenException):
    '''
    403 Forbidden 에러 핸들러
    '''
    logger.error(f"ForbiddenException: {exc.detail} - URL: {request.url} - Method: {request.method} - Headers: {request.headers}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": "Access to this resource is forbidden."},
    )

async def internal_server_error_exception_handler(request: Request, exc: InternalServerErrorException):
    '''
    500 Internal Server Error 에러 핸들러
    '''
    logger.error(f"InternalServerErrorException: {exc.detail} - URL: {request.url} - Method: {request.method} - Headers: {request.headers}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": "An internal server error occurred."},
    )

def add_exception_handlers(app: FastAPI):
    app.add_exception_handler(NotFoundException, not_found_exception_handler)
    app.add_exception_handler(BadRequestException, bad_request_exception_handler)
    app.add_exception_handler(UnauthorizedException, unauthorized_exception_handler)
    app.add_exception_handler(ForbiddenException, forbidden_exception_handler)
    app.add_exception_handler(InternalServerErrorException, internal_server_error_exception_handler)
