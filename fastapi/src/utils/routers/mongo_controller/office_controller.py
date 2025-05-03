from fastapi import APIRouter
from pydantic import ValidationError

from .. import ChatModel, ChatError, MongoDBHandler

mongo_handler = MongoDBHandler()  # MongoDB 핸들러 초기화
office_router = APIRouter() # Office 관련 라우터 정의

@office_router.post("/create", summary="유저 채팅방 ID 생성")
async def create_chat(request: ChatModel.Office_Id_Request):
    '''
    새로운 유저 채팅 문서(채팅 로그)를 MongoDB에 생성합니다.
    '''
    try:
        document_id = await mongo_handler.create_office_collection(
            user_id=request.user_id,
            router="office"
        )
        return {"Document ID": document_id}
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))

@office_router.put("/save_log", summary="유저 채팅 저장")
async def save_chat_log(request: ChatModel.Office_Create_Request):
    '''
    생성된 채팅 문서에 유저의 채팅 데이터를 저장합니다.
    '''
    try:
        request_data = request.model_dump()
        filtered_data = {key: value for key, value in request_data.items() if key != 'id'}
        
        # output_data가 비어있거나 None인 경우 대체 문장 설정
        if not filtered_data.get("output_data"):
            filtered_data["output_data"] = "서버 에러가 있습니다. 다시 시도해주세요."
        
        response_message = await mongo_handler.add_office_log(
            user_id=request.user_id,
            document_id=request.id,
            new_data=filtered_data
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
@office_router.put("/update_log", summary="유저 채팅 업데이트")
async def update_chat_log(request: ChatModel.Office_Update_Request):
    '''
    기존 채팅 문서에 유저의 채팅 데이터를 수정합니다.
    '''
    try:
        request_data = request.model_dump()
        filtered_data = {key: value for key, value in request_data.items() if key != 'id'}
        
        # output_data가 비어있거나 None인 경우 대체 문장 설정
        if not filtered_data.get("output_data"):
            filtered_data["output_data"] = "서버 에러가 있습니다. 다시 시도해주세요."
        
        response_message = await mongo_handler.update_office_log(
            user_id=request.user_id,
            document_id=request.id,
            new_Data=filtered_data
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    

@office_router.post("/load_log", response_model=ChatModel.Office_Response, summary="유저 채팅 불러오기")
async def load_chat_log(request: ChatModel.Identifier_Request) -> ChatModel.Office_Response:
    '''
    생성된 채팅 문서의 채팅 로그를 MongoDB에서 불러옵니다.
    '''
    try:
        chat_logs = await mongo_handler.get_offic_log(
            user_id=request.user_id,
            document_id=request.id,
            router="office"
        )

        response_data = ChatModel.Office_Response(
            id=request.id,
            value=chat_logs
        )
        
        return response_data
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
@office_router.delete("/delete_log", summary="유저 채팅 일부 지우기")
async def delete_chat_log(request: ChatModel.Log_Delete_Request):
    '''
    최신 대화 ~ 선택된 채팅을 로그에서 삭제합니다.
    '''
    try:
        response_message = await mongo_handler.remove_log(
            user_id=request.user_id,
            document_id=request.id,
            selected_count=request.index,
            router="office"
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    
@office_router.delete("/delete_room", summary="유저 채팅 지우기")
async def delete_chat_room(request: ChatModel.Room_Delete_Request):
    '''
    유저의 채팅방을 삭제합니다.
    '''
    try:
        response_message = await mongo_handler.remove_collection(
            user_id=request.user_id,
            document_id=request.id,
            router="office"
        )
        return {"Result": response_message}
    except ValidationError as e:
        raise ChatError.BadRequestException(detail=str(e))
    except ChatError.NotFoundException as e:
        raise ChatError.NotFoundException(detail=str(e))
    except Exception as e:
        raise ChatError.InternalServerErrorException(detail=str(e))
    