import os
import logging
from typing import Callable, Dict, Type, Optional
from fastapi.responses import JSONResponse
from fastapi import FastAPI, HTTPException, Request

# 현재 파일의 상위 디렉토리 경로
current_directory = os.path.dirname(os.path.abspath(__file__))
parent_directory = os.path.dirname(current_directory)  # 상위 디렉토리

# 로그 디렉토리 및 파일 경로 설정
log_dir = os.path.join(parent_directory, "logs")
log_file = os.path.join(log_dir, "error.log")

# 로그 디렉토리가 없는 경우 생성
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Logger 설정
logger = logging.getLogger("fastapi_error_handlers")
logger.setLevel(logging.DEBUG)

# FileHandler 설정 (append 모드)
file_handler = logging.FileHandler(log_file, mode='a')
file_handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s - %(url)s - %(method)s - %(headers)s - %(body)s')
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
    def __init__(self, detail: Optional[str] = None):
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
    """
    기본 예외 처리기.

    FastAPI 애플리케이션에서 발생한 HTTPException을 처리하며,
    요청의 정보와 예외에 대한 세부 사항을 로그로 기록합니다.
    특정 HTTPException에 대한 핸들러가 정의되어 있으면 해당 핸들러를 호출하고,
    정의되지 않은 경우에는 500 상태 코드를 반환합니다.

    :param request: 예외가 발생한 요청 객체.
    :param exc: 발생한 HTTPException 객체.
    :return: JSON 응답 객체로, 클라이언트에 반환됩니다.
    """
    handler = exception_handlers.get(type(exc), None)
    
    # 요청 본문 읽기 (비동기식으로 동작)
    body = await request.body()

    log_data = {
        "url": str(request.url),
        "method": request.method,
        "headers": dict(request.headers),
        "body": body.decode("utf-8") if body else "",
        "exception_class": exc.__class__.__name__,
        "detail": exc.detail
    }
    
    if handler is None:
        logger.critical(f"Unhandled exception: {log_data}")
        return JSONResponse(
            status_code=500,
            content={"detail": "An unexpected error occurred."},
        )
    
    if exc.status_code == 403:
        logger.warning(f"403 Forbidden: {log_data}")
    elif exc.status_code == 401:
        logger.warning(f"401 Unauthorized: {log_data}")
    elif exc.status_code == 404:
        logger.info(f"404 Not Found: {log_data}")
    elif exc.status_code >= 500:
        logger.error(f"Server Error: {log_data}")
    else:
        logger.error(f"{exc.status_code} Error: {log_data}")
    
    return handler(request, exc)

def add_exception_handlers(app: FastAPI):
    """
    FastAPI 애플리케이션에 예외 핸들러를 추가하는 함수.

    정의된 예외 타입과 관련된 핸들러를 FastAPI 애플리케이션에 등록합니다.
    이를 통해 발생한 예외에 대해 특정한 로직을 적용할 수 있습니다.

    :param app: FastAPI 애플리케이션 인스턴스.
    """
    for exc_type, handler in exception_handlers.items():
        app.add_exception_handler(exc_type, generic_exception_handler)