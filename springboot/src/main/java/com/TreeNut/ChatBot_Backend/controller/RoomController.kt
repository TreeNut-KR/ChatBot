package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.service.RoomService
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/server/chatroom")
class RoomController(
    private val roomService: RoomService,
    private val tokenAuth: TokenAuth
) {

    @GetMapping("/test")
    fun testRoom(
        @RequestHeader("Authorization") authorization: String?
    ): ResponseEntity<Map<String, Any>> {
        val token = authorization
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음"))

        val userId = tokenAuth.authGuard(token)
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다."))

        return ResponseEntity.ok(mapOf("status" to 200, "user_id" to userId))
    }

    @PostMapping("/office")
    fun createGptRoom(
        @RequestHeader("Authorization") authorization: String?,
        @RequestBody inputData: Map<String, String> // 수정된 부분
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음")))

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다.")))

        val inputDataSet = inputData["input_data_set"] // JSON의 "input_data_set" 키 값 사용

        // createOfficeroom으로 documentId 생성
        return roomService.createOfficeroom(userId)
            .flatMap { response ->
                val documentId = response["Document ID"] as? String
                    ?: return@flatMap Mono.just(ResponseEntity.status(500).body(mapOf<String, Any>("status" to 500, "message" to "documentId 생성 실패")))

                // documentId 생성 후 addOfficeroom 호출
                roomService.addOfficeroom(userId, documentId, inputDataSet ?: "")
                    .map { addResponse ->
                        ResponseEntity.ok(mapOf(
                            "status" to 200,
                            "message" to "채팅방이 성공적으로 생성되었고 로그가 저장되었습니다.",
                            "add_log_response" to addResponse
                        ))
                    }
            }
            .defaultIfEmpty(
                ResponseEntity.status(500).body(mapOf(
                    "status" to 500,
                    "message" to "채팅방 생성에 실패했습니다."
                ))
            )
    }

    @PostMapping("/office/load_logs/{id}")
    fun loadChatLogs(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String 
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음")))

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다.")))

        return roomService.loadOfficeroomLogs(userId, id) // id는 mongo_chatroomid에 해당
            .map { logs ->
                ResponseEntity.ok(mapOf(
                    "status" to 200,
                    "logs" to logs
                ))
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(mapOf(
                    "status" to 400,
                    "message" to "로그를 찾을 수 없습니다."
                ))
            )
    }

     @DeleteMapping("/office/delete_room/{id}")
    fun deleteChatRoom(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음")))

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다.")))

        // FastAPI로 DELETE 요청 전송
        return roomService.deleteOfficeroom(userId, id)
            .map { response ->
                ResponseEntity.ok(mapOf("status" to 200, "message" to "채팅방이 성공적으로 삭제되었습니다.", "response" to response))
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(mapOf("status" to 400, "message" to "채팅방 삭제 실패"))
            )
    }
}
