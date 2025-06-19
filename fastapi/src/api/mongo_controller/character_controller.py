from fastapi import APIRouter, Request, Depends, Path
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from core import dependencies
from schemas import schema
from services import mongodb_client
from utils import error_tools

character_router = APIRouter()

@character_router.post("/users/{user_id}", summary="유저 채팅방 ID 생성")
async def create_chat(
    req: Request,
    request: schema.ChatBot_Id_Request,
    user_id: str = Path(..., description="유저 ID"),
    mongo_handler: mongodb_client.MongoDBHandler = Depends(dependencies.get_mongo_handler)
):
    '''
    새로운 유저 채팅 문서(채팅 로그)를 MongoDB에 생성합니다.
    '''
    try:
        # character_idx가 양수인지 확인
        if request.character_idx <= 0:
            raise error_tools.BadRequestException("character_idx는 양수여야 합니다.")
            
        document_id = await mongo_handler.create_chatbot_collection(
            user_id=user_id,
            character=request.character_idx,
            router="chatbot"
        )
        
        if not document_id:
            raise error_tools.InternalServerErrorException(detail="채팅방을 생성할 수 없습니다.")
        
        response_data = {
            "Document ID": document_id,
            "_links": [
                {
                    "href": str(req.url),
                    "rel": "self",
                    "type": "GET",
                    "title": "유저 채팅방 ID 생성",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "GET",
                    "title": "유저 채팅 불러오기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "PUT",
                    "title": "유저 채팅 저장",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "PATCH",
                    "title": "유저 최근 채팅 업데이트",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "DELETE",
                    "title": "유저 채팅방 지우기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}/idx/{{index}}",
                    "rel": f"/users/{user_id}/documents/{document_id}/idx/",
                    "type": "DELETE",
                    "title": "유저 index까지의 채팅 일부 지우기",
                    "templated": True,
                    "description": "index 값까지의 채팅을 삭제하려는 인덱스(자연수 값: index > 0)를 URL에 교체하세요"
                },
            ]
        }
        
        return JSONResponse(response_data)
    except Exception as e:
        raise error_tools.InternalServerErrorException(detail=str(e))

@character_router.get("/users/{user_id}/documents/{document_id}", summary="유저 채팅 불러오기")
async def load_chat_log(
    req: Request,
    user_id: str = Path(..., description="유저 ID"),
    document_id: str = Path(..., description="채팅방 ID"),
    mongo_handler: mongodb_client.MongoDBHandler = Depends(dependencies.get_mongo_handler)
):
    '''
    생성된 채팅 문서의 채팅 로그를 MongoDB에서 불러옵니다.
    '''
    try:
        chat_logs, character_idx = await mongo_handler.get_chatbot_log(
            user_id=user_id,
            document_id=document_id,
            router="chatbot"
        )

        response_data = {
            "id": document_id,
            "character_idx": character_idx,
            "value": chat_logs,
            "_links": [
                {
                    "href": str(req.url),
                    "rel": "self",
                    "type": "GET",
                    "title": "유저 채팅 불러오기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}",
                    "rel": f"/users/{user_id}",
                    "type": "GET",
                    "title": "유저 채팅방 ID 생성",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "PUT",
                    "title": "유저 채팅 저장",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "PATCH",
                    "title": "유저 최근 채팅 업데이트",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "DELETE",
                    "title": "유저 채팅방 지우기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}/idx/{{index}}",
                    "rel": f"/users/{user_id}/documents/{document_id}/idx/",
                    "type": "DELETE",
                    "title": "유저 index까지의 채팅 일부 지우기",
                    "templated": True,
                    "description": "index 값까지의 채팅을 삭제하려는 인덱스(자연수 값: index > 0)를 URL에 교체하세요"
                },
            ]
        }
        
        return JSONResponse(response_data)
    except ValidationError as e:
        raise error_tools.BadRequestException(detail=str(e))
    except error_tools.NotFoundException as e:
        raise error_tools.NotFoundException(detail=str(e))
    except Exception as e:
        raise error_tools.InternalServerErrorException(detail=str(e))

@character_router.put("/users/{user_id}/documents/{document_id}", summary="유저 채팅 저장")
async def save_chat_log(
    req: Request,
    request: schema.ChatBot_Create_Request,
    user_id: str = Path(..., description="유저 ID"),
    document_id: str = Path(..., description="채팅방 ID"),
    mongo_handler: mongodb_client.MongoDBHandler = Depends(dependencies.get_mongo_handler)
):
    '''
    생성된 채팅 문서에 유저의 채팅 데이터를 저장합니다.
    '''
    try:
        request_data = request.model_dump()
        filtered_data = {key: value for key, value in request_data.items() if key != 'id'}
        
        # output_data가 비어있거나 None인 경우 대체 문장 설정
        if not filtered_data.get("output_data"):
            filtered_data["output_data"] = "서버 에러가 있습니다. 다시 시도해주세요."
        
        response_message = await mongo_handler.add_chatbot_log(
            user_id=user_id,
            document_id=document_id,
            new_data=filtered_data
        )
        response_data = {
            "Result": response_message,
            "_links": [
                {
                    "href": str(req.url),
                    "rel": "self",
                    "type": "PUT",
                    "title": "유저 채팅 저장",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}",
                    "rel": f"/users/{user_id}",
                    "type": "GET",
                    "title": "유저 채팅방 ID 생성",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "GET",
                    "title": "유저 채팅 불러오기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "PATCH",
                    "title": "유저 최근 채팅 업데이트",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "DELETE",
                    "title": "유저 채팅방 지우기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}/idx/{{index}}",
                    "rel": f"/users/{user_id}/documents/{document_id}/idx/",
                    "type": "DELETE",
                    "title": "유저 index까지의 채팅 일부 지우기",
                    "templated": True,
                    "description": "index 값까지의 채팅을 삭제하려는 인덱스(자연수 값: index > 0)를 URL에 교체하세요"
                },
            ]
        }
        
        return JSONResponse(response_data)
    except ValidationError as e:
        raise error_tools.BadRequestException(detail=str(e))
    except error_tools.NotFoundException as e:
        raise error_tools.NotFoundException(detail=str(e))
    except Exception as e:
        raise  error_tools.InternalServerErrorException(detail=str(e))

@character_router.patch("/users/{user_id}/documents/{document_id}", summary="유저 최근 채팅 업데이트")
async def update_chat_log(
    req: Request,
    request: schema.ChatBot_Update_Request,
    user_id: str = Path(..., description="유저 ID"),
    document_id: str = Path(..., description="채팅방 ID"),
    mongo_handler: mongodb_client.MongoDBHandler = Depends(dependencies.get_mongo_handler)
):
    '''
    기존 채팅 문서에 유저의 채팅 데이터를 수정합니다.
    '''
    try:
        request_data = request.model_dump()
        filtered_data = {key: value for key, value in request_data.items() if key != 'id'}
    
        # output_data가 비어있거나 None인 경우 대체 문장 설정
        if not filtered_data.get("output_data"):
            filtered_data["output_data"] = "서버 에러가 있습니다. 다시 시도해주세요."
        
        response_message = await mongo_handler.update_chatbot_log(
            user_id=user_id,
            document_id=document_id,
            new_Data=filtered_data
        ) 
        response_data = {
            "Result": response_message,
            "_links": [
                {
                    "href": str(req.url),
                    "rel": "self",
                    "type": "PATCH",
                    "title": "유저 최근 채팅 업데이트",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}",
                    "rel": f"/users/{user_id}",
                    "type": "GET",
                    "title": "유저 채팅방 ID 생성",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "GET",
                    "title": "유저 채팅 불러오기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "PUT",
                    "title": "유저 채팅 저장",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "DELETE",
                    "title": "유저 채팅방 지우기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}/idx/{{index}}",
                    "rel": f"/users/{user_id}/documents/{document_id}/idx/",
                    "type": "DELETE",
                    "title": "유저 index까지의 채팅 일부 지우기",
                    "templated": True,
                    "description": "index 값까지의 채팅을 삭제하려는 인덱스(자연수 값: index > 0)를 URL에 교체하세요"
                },
            ]
        }
        
        return JSONResponse(response_data)
    except ValidationError as e:
        raise error_tools.BadRequestException(detail=str(e))
    except error_tools.NotFoundException as e:
        raise error_tools.NotFoundException(detail=str(e))
    except Exception as e:
        raise error_tools.InternalServerErrorException(detail=str(e))

@character_router.delete("/users/{user_id}/documents/{document_id}", summary="유저 채팅방 지우기")
async def delete_chat_room(
    req: Request,
    user_id: str = Path(..., description="유저 ID"),
    document_id: str = Path(..., description="채팅방 ID"),
    mongo_handler: mongodb_client.MongoDBHandler = Depends(dependencies.get_mongo_handler)
):
    '''
    유저의 채팅방을 삭제합니다.
    '''
    try:
        response_message = await mongo_handler.remove_collection(
            user_id=user_id,
            document_id=document_id,
            router="chatbot"
        )
        response_data = {
            "Result": response_message,
            "_links": [
                {
                    "href": str(req.url),
                    "rel": "self",
                    "type": "DELETE",
                    "title": "유저 채팅방 지우기",
                },
                {
                    "href": f"/users/{user_id}",
                    "rel": f"/users/{user_id}",
                    "type": "GET",
                    "title": "유저 채팅방 ID 생성",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}",
                    "rel": f"/users/{user_id}",
                    "type": "GET",
                    "title": "유저 채팅방 ID 생성",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "GET",
                    "title": "유저 채팅 불러오기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "PUT",
                    "title": "유저 채팅 저장",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "PATCH",
                    "title": "유저 최근 채팅 업데이트",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}/idx/{{index}}",
                    "rel": f"/users/{user_id}/documents/{document_id}/idx/",
                    "type": "DELETE",
                    "title": "유저 index까지의 채팅 일부 지우기",
                    "templated": True,
                    "description": "index 값까지의 채팅을 삭제하려는 인덱스(자연수 값: index > 0)를 URL에 교체하세요"
                },
            ]
        }
        
        return JSONResponse(response_data)
    except ValidationError as e:
        raise error_tools.BadRequestException(detail=str(e))
    except error_tools.NotFoundException as e:
        raise error_tools.NotFoundException(detail=str(e))
    except Exception as e:
        raise error_tools.InternalServerErrorException(detail=str(e))

@character_router.delete("/users/{user_id}/documents/{document_id}/idx/{index}", summary="유저 index까지의 채팅 일부 지우기")
async def delete_chat_log(
    req: Request,
    user_id: str = Path(..., description="유저 ID"),
    document_id: str = Path(..., description="채팅방 ID"),
    index: int = Path(..., description="삭제를 시작할할 채팅 로그의 인덱스"),
    mongo_handler: mongodb_client.MongoDBHandler = Depends(dependencies.get_mongo_handler)
):
    '''
    최신 대화 ~ 선택된 채팅을 로그에서 삭제합니다.
    '''
    try:
        response_message = await mongo_handler.remove_log(
            user_id=user_id,
            document_id=document_id,
            selected_count=index,
            router="chatbot"
        )
        response_data = {
            "Result": response_message,
            "_links": [
                {
                    "href": str(req.url),
                    "rel": "self",
                    "type": "DELETE",
                    "title": "유저 index까지의 채팅 일부 지우기",
                    "templated": True,
                    "description": "index 값까지의 채팅을 삭제하려는 인덱스(자연수 값: index > 0)를 URL에 교체하세요"
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}",
                    "rel": f"/users/{user_id}",
                    "type": "GET",
                    "title": "유저 채팅방 ID 생성",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "GET",
                    "title": "유저 채팅 불러오기",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "PUT",
                    "title": "유저 채팅 저장",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "PATCH",
                    "title": "유저 최근 채팅 업데이트",
                },
                {
                    "href": f"{str(req.base_url)}mongo/characters/users/{user_id}/documents/{document_id}",
                    "rel": f"/users/{user_id}/documents/{document_id}",
                    "type": "DELETE",
                    "title": "유저 채팅방 지우기",
                },
            ]
        }
        
        return JSONResponse(response_data)
    except ValidationError as e:
        raise error_tools.BadRequestException(detail=str(e))
    except error_tools.NotFoundException as e:
        raise error_tools.NotFoundException(detail=str(e))
    except Exception as e:
        raise error_tools.InternalServerErrorException(detail=str(e))
