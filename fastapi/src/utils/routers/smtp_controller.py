from fastapi import APIRouter
from starlette.responses import JSONResponse
from . import ChatError, ChatModel, SMTPHandler, mysql_handler

smtp_handler = SMTPHandler()
smtp_router = APIRouter()

@smtp_router.post("/send-verification", summary="이메일 인증 코드 전송")
async def send_verification_email(request: ChatModel.Email_Request):
    '''
    사용자 이메일로 인증 코드를 전송합니다.
    '''
    try:
        membership = await mysql_handler.get_membership_by_userid(request.user_id)
        if membership == "VIP":
            return {"status": "exception", "message": "이미 인증된 계정입니다."}

        code = smtp_handler.generate_verification_code()
        await mysql_handler.create_verification_code(code, request.user_id)
        success = await smtp_handler.send_verification_email(code, request.email)
        if success:
            return {"status": "success", "message": "인증 코드가 전송되었습니다. 이메일을 확인해주세요."}
        else:
            raise ChatError.InternalServerErrorException(detail="이메일 전송에 실패했습니다.")
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))

@smtp_router.post("/verify-code", summary="이메일 인증 코드 확인")
async def verify_email_code(request: ChatModel.Verification_Request):
    '''
    사용자로부터 받은 인증 코드를 검증합니다.
    '''
    try:
        result = await mysql_handler.code_verification(request.code, request.user_id, request.email)
        if result == "success":
            return {
                "status": "success",
                "message": "인증이 완료되었습니다."
            }

        elif result == "code is expired":
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "detail": "인증 코드가 만료되었습니다.",
                    "code": "expired_verification_code"
                }
            )
        elif result == "code is different":
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "detail": "인증 코드가 일치하지 않습니다.",
                    "code": "invalid_verification_code"
                }
            )
        else:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "detail": "인증 코드가 존재하지 않습니다.",
                    "code": "not_found_verification_code"
                }
            )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "detail": str(e),
                "code": "verification_error"
            }
        )
