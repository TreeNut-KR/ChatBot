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
        @RequestBody inputData: Map<String, String>
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음")))

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다.")))

        val inputDataSet = inputData["input_data_set"]

        return roomService.createOfficeroom(userId)
            .flatMap { response ->
                val documentId = response["Document ID"] as? String
                    ?: return@flatMap Mono.just(ResponseEntity.status(500).body(mapOf<String, Any>("status" to 500, "message" to "documentId 생성 실패")))

                roomService.addOfficeroom(userId, documentId, inputDataSet ?: "")
                    .flatMap { addResponse ->
                        roomService.saveOfficeroomToMySQL(userId, documentId)
                            .map { savedOfficeroom ->
                                ResponseEntity.ok(mapOf(
                                    "status" to 200,
                                    "message" to "채팅방이 성공적으로 생성되었고 로그가 저장되었습니다.",
                                    "add_log_response" to addResponse,
                                    "mysql_officeroom" to savedOfficeroom
                                ))
                            }
                    }
            }
            .defaultIfEmpty(
                ResponseEntity.status(500).body(mapOf(
                    "status" to 500,
                    "message" to "채팅방 생성에 실패했습니다."
                ))
            )
    }

    @PostMapping("/office/{id}/load_logs")
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

    @DeleteMapping("/office/{id}/delete_room")
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

    @PutMapping("/office/{id}/save_log")
    fun saveChatLog(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String, // MongoDB에서 사용되는 document ID
        @RequestBody inputData: Map<String, String> // 입력 데이터
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음")))

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다.")))

        val inputDataSet = inputData["input_data_set"]
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "input_data_set이 필요합니다.")))

        return roomService.addOfficeroom(userId, id, inputDataSet)
            .map { response ->
                ResponseEntity.ok(mapOf(
                    "status" to 200,
                    "message" to "채팅 로그가 성공적으로 저장되었습니다.",
                    "response" to response
                ))
            }
            .defaultIfEmpty(
                ResponseEntity.status(500).body(mapOf(
                    "status" to 500,
                    "message" to "채팅 로그 저장에 실패했습니다."
                ))
            )
    }

    @PutMapping("/office/{id}/update_log")
    fun updateChatLog(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String,
        @RequestBody requestData: Map<String, Any> // 요청 데이터는 Map 형태로 받음
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음")))

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다.")))

        val index = requestData["index"] as? Int
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "인덱스 값이 필요합니다.")))

        val inputDataSet = requestData["input_data_set"] as? String
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "input_data_set 값이 필요합니다.")))

        return roomService.updateOfficeroomLog(userId, id, index, inputDataSet)
            .map { response ->
                ResponseEntity.ok(mapOf(
                    "status" to 200,
                    "message" to "채팅 로그가 성공적으로 수정되었습니다.",
                    "response" to response
                ))
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(mapOf("status" to 400, "message" to "채팅 로그 수정 실패"))
            )
    }

    @DeleteMapping("/office/{id}/delete_log")
    fun deleteOfficeroomLog(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String,
        @RequestParam index: Int // 요청 파라미터로 index를 받음
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음")))

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다.")))

        return roomService.deleteOfficeroomLog(userId, id, index)
            .map { response ->
                ResponseEntity.ok(mapOf("status" to 200, "message" to "해당 로그가 성공적으로 삭제되었습니다.", "response" to response))
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(mapOf("status" to 400, "message" to "로그 삭제 실패"))
            )
    }
}
