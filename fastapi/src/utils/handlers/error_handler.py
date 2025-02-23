'''
파일은 FastAPI 애플리케이션에서 발생하는 예외를 처리하는 모듈입니다.
'''

import os
import logging
from logging.handlers import BaseRotatingHandler
from typing import Callable, Dict, Type, Optional
from fastapi.responses import JSONResponse
from fastapi import FastAPI, HTTPException, Request
from datetime import datetime, timedelta
import traceback
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from typing import Any

# 현재 파일의 상위 디렉토리 경로
current_directory = os.path.dirname(os.path.abspath(__file__))
parent_directory =  os.path.dirname(os.path.dirname(current_directory))

# 로그 디렉토리 및 파일 경로 설정
log_dir = os.path.join(parent_directory, "logs")

# 로그 디렉토리가 없는 경우 생성
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Logger 설정
logger = logging.getLogger("fastapi_error_handlers")
logger.setLevel(logging.DEBUG)

class DailyRotatingFileHandler(BaseRotatingHandler):
    """
    날짜별로 로그 파일을 회전시키는 핸들러.
    """
    def __init__(self, dir_path: str, date_format: str = "%Y%m%d", encoding=None):
        # 로그 파일 디렉토리와 날짜 형식을 저장
        self.dir_path = dir_path
        self.date_format = date_format
        self.current_date = datetime.now().strftime(self.date_format)
        log_file = os.path.join(self.dir_path, f"{self.current_date}.log")
        super().__init__(log_file, 'a', encoding)

    def shouldRollover(self, record):
        # 로그의 날짜가 변경되었는지 확인
        log_date = datetime.now().strftime(self.date_format)
        return log_date != self.current_date

    def doRollover(self):
        # 로그 파일의 날짜가 변경되었을 때 롤오버 수행
        self.current_date = datetime.now().strftime(self.date_format)
        self.baseFilename = os.path.join(self.dir_path, f"{self.current_date}.log")
        if self.stream:
            self.stream.close()
            self.stream = self._open()

# DailyRotatingFileHandler 설정
file_handler = DailyRotatingFileHandler(log_dir, encoding='utf-8')
file_handler.setLevel(logging.DEBUG)

# StreamHandler 설정 (터미널 출력용)
stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.DEBUG)

# 로그 포맷 설정
formatter = logging.Formatter(
    '[%(asctime)s] %(levelname)s in %(module)s: %(message)s\n'
    '%(message)s\n',
    datefmt='%Y-%m-%d %H:%M:%S',
)
file_handler.setFormatter(formatter)
stream_handler.setFormatter(formatter)

# Logger에 핸들러 추가
logger.addHandler(file_handler)
logger.addHandler(stream_handler)

# 예외 클래스 정의
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

class IPRestrictedException(HTTPException):
    def __init__(self, detail: str = "Unauthorized IP address"):
        super().__init__(status_code=403, detail=detail)

class MethodNotAllowedException(HTTPException):
    def __init__(self, detail: str = "Method Not Allowed"):
        super().__init__(status_code=405, detail=detail)

# 기존 클래스에 RouteNotFoundException 추가
class RouteNotFoundException(HTTPException):
    def __init__(self, detail: str = "Route not found"):
        super().__init__(status_code=404, detail=detail)

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
    IPRestrictedException: lambda request, exc: JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    ),
    MethodNotAllowedException: lambda request, exc: JSONResponse(
        status_code=exc.status_code,
        content={"detail": "The method used in the request is not allowed."},
    ),
}

# 기본 예외 처리기
async def generic_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    FastAPI 애플리케이션에서 발생한 HTTPException을 처리하며,
    요청 정보와 예외에 대한 상세한 정보를 로그에 기록합니다.
    """
    handler = exception_handlers.get(type(exc), None)

    try:
        # 요청 본문 읽기
        body = await request.body()
        body_text = body.decode("utf-8") if body else ""
    except Exception as e:
        body_text = f"Failed to read request body: {str(e)}"

    # 클라이언트 IP 주소 가져오기
    client_ip = request.client.host if request.client else "Unknown"
    
    # 요청 쿼리 파라미터 가져오기
    query_params = dict(request.query_params)

    # 상세 로그 데이터 구성
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "error_code": exc.status_code,
        "error_type": exc.__class__.__name__,
        "error_detail": exc.detail,
        "request": {
            "url": str(request.url),
            "method": request.method,
            "client_ip": client_ip,
            "headers": dict(request.headers),
            "query_params": query_params,
            "body": body_text
        }
    }

    # 로그 메시지 포맷팅
    log_message = (
        f"\n{'='*80}\n"
        f"Error Event Details:\n"
        f"Timestamp: {log_data['timestamp']}\n"
        f"Error Code: {log_data['error_code']}\n"
        f"Error Type: {log_data['error_type']}\n"
        f"Error Detail: {log_data['error_detail']}\n"
        f"Request URL: {log_data['request']['url']}\n"
        f"Method: {log_data['request']['method']}\n"
        f"Client IP: {log_data['request']['client_ip']}\n"
        f"Query Parameters: {log_data['request']['query_params']}\n"
        f"Headers: {log_data['request']['headers']}\n"
        f"Body: {log_data['request']['body']}\n"
        f"{'='*80}"
    )

    # 에러 심각도에 따른 로그 레벨 설정
    if exc.status_code >= 500:
        logger.error(log_message, exc_info=True)
    elif exc.status_code >= 400:
        logger.warning(log_message)
    else:
        logger.info(log_message)

    # 정의된 핸들러가 있을 경우 호출, 없으면 기본 500 응답
    if handler:
        return handler(request, exc)
    else:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An unexpected error occurred.",
                "error_type": exc.__class__.__name__,
                "timestamp": datetime.now().isoformat()
            },
        )

# ErrorLoggingMiddleware 클래스 추가
class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Any) -> Any:
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            logger.error(f"Uncaught exception: {str(exc)}")
            logger.error(traceback.format_exc())
            raise exc

# ValidationErrorHandler 함수 추가
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    요청 데이터 검증 실패시 발생하는 오류를 처리합니다.
    """
    error_details = []
    for error in exc.errors():
        error_details.append({
            "location": error["loc"],
            "message": error["msg"],
            "type": error["type"]
        })

    log_data = {
        "timestamp": datetime.now().isoformat(),
        "error_type": "ValidationError",
        "error_details": error_details,
        "request": {
            "url": str(request.url),
            "method": request.method,
            "client_ip": request.client.host if request.client else "Unknown",
            "headers": dict(request.headers)
        }
    }

    log_message = (
        f"\n{'='*80}\n"
        f"Validation Error Details:\n"
        f"Timestamp: {log_data['timestamp']}\n"
        f"Error Type: {log_data['error_type']}\n"
        f"Error Details: {log_data['error_details']}\n"
        f"Request URL: {log_data['request']['url']}\n"
        f"Method: {log_data['request']['method']}\n"
        f"Client IP: {log_data['request']['client_ip']}\n"
        f"Headers: {log_data['request']['headers']}\n"
        f"{'='*80}"
    )

    logger.warning(log_message)

    return JSONResponse(
        status_code=422,
        content={
            "detail": error_details,
            "message": "입력 데이터 검증에 실패했습니다."
        }
    )

# DatabaseErrorHandler 함수 추가
async def database_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    데이터베이스 관련 오류를 처리합니다.
    """
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "error_type": "DatabaseError",
        "error_message": str(exc),
        "traceback": traceback.format_exc(),
        "request": {
            "url": str(request.url),
            "method": request.method,
            "client_ip": request.client.host if request.client else "Unknown"
        }
    }

    log_message = (
        f"\n{'='*80}\n"
        f"Database Error Details:\n"
        f"Timestamp: {log_data['timestamp']}\n"
        f"Error Type: {log_data['error_type']}\n"
        f"Error Message: {log_data['error_message']}\n"
        f"Request URL: {log_data['request']['url']}\n"
        f"Method: {log_data['request']['method']}\n"
        f"Client IP: {log_data['request']['client_ip']}\n"
        f"Traceback:\n{log_data['traceback']}\n"
        f"{'='*80}"
    )

    logger.error(log_message)

    return JSONResponse(
        status_code=503,
        content={
            "detail": "데이터베이스 오류가 발생했습니다.",
            "message": "시스템 관리자에게 문의하세요."
        }
    )

# 라우트 관련 로깅을 위한 미들웨어 추가
class RouteLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Any) -> Any:
        try:
            response = await call_next(request)
            
            # 404 응답 로깅
            if response.status_code == 404:
                log_data = {
                    "timestamp": datetime.now().isoformat(),
                    "status_code": response.status_code,
                    "path": request.url.path,
                    "method": request.method,
                    "client_ip": request.client.host if request.client else "Unknown",
                    "user_agent": request.headers.get("user-agent", "Unknown")
                }

                log_message = (
                    f"\n{'='*80}\n"
                    f"Route Not Found:\n"
                    f"Timestamp: {log_data['timestamp']}\n"
                    f"Status Code: {log_data['status_code']}\n"
                    f"Path: {log_data['path']}\n"
                    f"Method: {log_data['method']}\n"
                    f"Client IP: {log_data['client_ip']}\n"
                    f"User Agent: {log_data['user_agent']}\n"
                    f"{'='*80}"
                )
                
                logger.warning(log_message)

            return response
            
        except Exception as exc:
            logger.error(f"Route processing error: {str(exc)}")
            logger.error(traceback.format_exc())
            raise exc

# add_exception_handlers 함수 수정
def add_exception_handlers(app: FastAPI):
    """
    FastAPI 애플리케이션에 모든 예외 핸들러를 추가합니다.
    """
    # 기존 예외 핸들러 등록
    for exc_type in exception_handlers:
        app.add_exception_handler(exc_type, generic_exception_handler)
    
    # 추가 예외 핸들러 등록
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(SQLAlchemyError, database_error_handler)
    app.add_exception_handler(RouteNotFoundException, generic_exception_handler)
    
    # 미들웨어 추가
    app.add_middleware(ErrorLoggingMiddleware)
    app.add_middleware(RouteLoggingMiddleware)