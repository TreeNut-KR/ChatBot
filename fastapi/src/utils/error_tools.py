'''
FastAPI 애플리케이션에서 발생하는 예외를 처리하는 모듈입니다.
'''
import uuid
import os
import logging
import logging.handlers  # 이 줄을 추가
import traceback
from pathlib import Path
from datetime import datetime
from typing import Callable, Dict, Optional, Type, Any

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.middleware.base import BaseHTTPMiddleware


# ==========================
# 1. 로그 디렉토리 및 설정
# ==========================
BASE_DIR = Path(__file__).resolve().parents[2]
LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

class DailyRotatingFileHandler(logging.handlers.BaseRotatingHandler):
    """
    날짜별 로그 파일을 생성하는 커스텀 핸들러입니다.
    """
    def __init__(self, dir_path: str, date_format: str = "%Y%m%d", encoding=None):
        self.dir_path = dir_path
        self.date_format = date_format
        self.current_date = datetime.now().strftime(self.date_format)
        log_file = os.path.join(self.dir_path, f"{self.current_date}.log")
        super().__init__(log_file, 'a', encoding)

    def shouldRollover(self, record):
        return datetime.now().strftime(self.date_format) != self.current_date

    def doRollover(self):
        self.current_date = datetime.now().strftime(self.date_format)
        self.baseFilename = os.path.join(self.dir_path, f"{self.current_date}.log")
        if self.stream:
            self.stream.close()
            self.stream = self._open()

# ==========================
# 2. Logger 구성
# ==========================
logger = logging.getLogger("fastapi_error_handlers")
logger.setLevel(logging.DEBUG)

formatter = logging.Formatter(
    '[%(asctime)s] %(levelname)s in %(module)s:\n%(message)s\n',
    datefmt='%Y-%m-%d %H:%M:%S'
)

file_handler = DailyRotatingFileHandler(LOG_DIR, encoding='utf-8')
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(formatter)
logger.addHandler(stream_handler)

# ==========================
# 3. 예외 클래스 정의
# ==========================
class BaseCustomException(HTTPException):
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)

class NotFoundException(BaseCustomException):
    def __init__(self, detail="Resource not found"):
        super().__init__(404, detail)

class BadRequestException(BaseCustomException):
    def __init__(self, detail="Bad request"):
        super().__init__(400, detail)

class UnauthorizedException(BaseCustomException):
    def __init__(self, detail="Unauthorized"):
        super().__init__(401, detail)

class ForbiddenException(BaseCustomException):
    def __init__(self, detail="Forbidden"):
        super().__init__(403, detail)

class ValueErrorException(BaseCustomException):
    def __init__(self, detail="Invalid value"):
        super().__init__(422, detail)

class InternalServerErrorException(BaseCustomException):
    def __init__(self, detail="Internal Server Error"):
        trace_id = uuid.uuid4()
        super().__init__(500, detail)

class DatabaseErrorException(BaseCustomException):
    def __init__(self, detail="Database Error"):
        super().__init__(503, detail)

class IPRestrictedException(BaseCustomException):
    def __init__(self, detail="Unauthorized IP address"):
        super().__init__(403, detail)

class MethodNotAllowedException(BaseCustomException):
    def __init__(self, detail="Method Not Allowed"):
        super().__init__(405, detail)

class RouteNotFoundException(BaseCustomException):
    def __init__(self, detail="Route not found"):
        super().__init__(404, detail)

# ==========================
# 4. 핸들러 함수
# ==========================
def log_error(
    *,
    exc: Exception,
    request: Request,
    status_code: int,
    detail: str,
    extra: dict = None
):
    """
    에러 정보를 로그로 기록하는 함수.
    """
    body = ""
    try:
        body = request._body.decode('utf-8') if hasattr(request, "_body") and request._body else ""
    except Exception:
        pass
    client_ip = request.client.host if request.client else "Unknown"
    query_params = dict(request.query_params)
    # traceback을 detail에 추가
    tb = traceback.format_exc()
    log_msg = (
        f"{'='*80}\n"
        f"Error Type: {type(exc).__name__}\n"
        f"Status: {status_code}\n"
        f"Detail: {detail}\n"
        f"Traceback: {tb}\n"
        f"URL: {request.url}\n"
        f"Method: {request.method}\n"
        f"Client IP: {client_ip}\n"
        f"Body: {body}\n"
        f"Query: {query_params}\n"
    )
    if extra:
        log_msg += f"Extra: {extra}\n"
    log_msg += f"{'='*80}"
    logger.error(log_msg)

class ExceptionHandlerFactory:
    handlers: Dict[Type[HTTPException], Callable[[Request, HTTPException], JSONResponse]] = {
        NotFoundException: lambda req, exc: JSONResponse(status_code=exc.status_code, content={"detail": "Not found"}),
        BadRequestException: lambda req, exc: JSONResponse(status_code=exc.status_code, content={"detail": "Bad request"}),
        UnauthorizedException: lambda req, exc: JSONResponse(status_code=exc.status_code, content={"detail": "Unauthorized"}),
        ForbiddenException: lambda req, exc: JSONResponse(status_code=exc.status_code, content={"detail": "Forbidden"}),
        ValueErrorException: lambda req, exc: JSONResponse(status_code=exc.status_code, content={"detail": "Invalid input"}),
        InternalServerErrorException: lambda req, exc: JSONResponse(status_code=exc.status_code, content={"detail": "Server error"}),
        DatabaseErrorException: lambda req, exc: JSONResponse(status_code=exc.status_code, content={"detail": "Database error"}),
        IPRestrictedException: lambda req, exc: JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}),
        MethodNotAllowedException: lambda req, exc: JSONResponse(status_code=exc.status_code, content={"detail": "Not allowed"})
    }

    @staticmethod
    async def generic_handler(request: Request, exc: HTTPException) -> JSONResponse:
        handler = ExceptionHandlerFactory.handlers.get(type(exc))
        log_error(
            exc=exc,
            request=request,
            status_code=exc.status_code,
            detail=exc.detail
        )
        return handler(request, exc) if handler else JSONResponse(
            status_code=500,
            content={"detail": "Unexpected error", "type": type(exc).__name__}
        )

    @staticmethod
    async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        error_details = [
            {"location": err["loc"], "message": err["msg"], "type": err["type"]}
            for err in exc.errors()
        ]
        log_error(
            exc=exc,
            request=request,
            status_code=422,
            detail="입력 데이터 검증 실패",
            extra={"validation_errors": error_details}
        )
        return JSONResponse(status_code=422, content={"detail": error_details, "message": "입력 데이터 검증 실패"})

    @staticmethod
    async def database_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        log_error(
            exc=exc,
            request=request,
            status_code=503,
            detail="데이터베이스 오류",
            extra={"traceback": traceback.format_exc()}
        )
        return JSONResponse(status_code=503, content={"detail": "데이터베이스 오류", "message": "관리자에게 문의하세요."})

# ==========================
# 5. 미들웨어
# ==========================
class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Any:
        try:
            return await call_next(request)
        except Exception as exc:
            raise exc

class RouteLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Any:
        response = await call_next(request)
        if response.status_code == 404:
            logger.warning(
                f"Route Not Found: {request.url.path} | Method: {request.method} | IP: {request.client.host}"
            )
        return response

# ==========================
# 6. 예외 핸들러 등록기
# ==========================
class ExceptionManager:
    @staticmethod
    def register(app: FastAPI):
        for exc_type in ExceptionHandlerFactory.handlers:
            app.add_exception_handler(exc_type, ExceptionHandlerFactory.generic_handler)

        app.add_exception_handler(RequestValidationError, ExceptionHandlerFactory.validation_handler)
        app.add_exception_handler(SQLAlchemyError, ExceptionHandlerFactory.database_handler)
        app.add_exception_handler(RouteNotFoundException, ExceptionHandlerFactory.generic_handler)
        app.add_middleware(ErrorLoggingMiddleware)
        app.add_middleware(RouteLoggingMiddleware)
        app.add_middleware(RouteLoggingMiddleware)
