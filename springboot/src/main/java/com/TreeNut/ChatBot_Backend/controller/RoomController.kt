package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.service.RoomService
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono
import reactor.core.publisher.Flux
import org.springframework.http.MediaType

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
            ?: return ResponseEntity.badRequest().body(
                mapOf(
                    "status" to 401,
                    "message" to "토큰 없음"
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return ResponseEntity.badRequest().body(
                mapOf(
                    "status" to 401,
                    "message" to "유효한 토큰이 필요합니다."
                )
            )

        return ResponseEntity.ok(
            mapOf(
                "status" to 200,
                "user_id" to userId
            )
        )
    }

    @GetMapping("/office")
    fun createGptRoom(
        @RequestHeader("Authorization") authorization: String?
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        return roomService.createOfficeroom(userId)
            .flatMap { response ->
                val id = response["Document ID"] as? String
                    ?: return@flatMap Mono.just(
                        ResponseEntity.status(500).body<Map<String, Any>>(
                            mapOf(
                                "status" to 500,
                                "message" to "id 생성 실패"
                            )
                        )
                    )

                roomService.saveOfficeroomToMySQL(userId, id)
                    .map { savedOfficeroom ->
                        ResponseEntity.ok(
                            mapOf<String, Any>(
                                "status" to 200,
                                "message" to "채팅방이 성공적으로 생성되었습니다.",
                                "mysql_officeroom" to savedOfficeroom
                            )
                        )
                    }
            }
            .defaultIfEmpty(
                ResponseEntity.status(500).body(
                    mapOf(
                        "status" to 500,
                        "message" to "채팅방 생성에 실패했습니다."
                    )
                )
            )
    }
    
    @PostMapping("/office/{id}/get_response", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun getGptResponse(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String,
        @RequestBody inputData: Map<String, Any>
    ): Flux<String> {
        val token = authorization
            ?: return Flux.just("토큰 없음")

        val userId = tokenAuth.authGuard(token)
            ?: return Flux.just("유효한 토큰이 필요합니다.")

        val inputDataSet = inputData["input_data_set"] as? String ?: ""
        val googleAccessSet = (inputData["google_access_set"] as? String)?.toBoolean() ?: false

        return roomService.addOfficeroom(userId, id, inputDataSet, googleAccessSet)
            .flatMapMany { addResponse ->
                roomService.getLlamaResponse(inputDataSet, googleAccessSet)
            }
    }

    @PostMapping("/office/{id}/load_logs")
    fun loadChatLogs(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        return roomService.loadOfficeroomLogs(userId, id)
            .map { logs ->
                ResponseEntity.ok(
                    mapOf(
                        "status" to 200,
                        "logs" to logs
                    )
                )
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(
                    mapOf(
                        "status" to 400,
                        "message" to "로그를 찾을 수 없습니다."
                    )
                )
            )
    }

    @DeleteMapping("/office/{id}/delete_room")
    fun deleteChatRoom(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        return roomService.deleteOfficeroom(userId, id)
            .map { response ->
                ResponseEntity.ok(
                    mapOf(
                        "status" to 200,
                        "message" to "채팅방이 성공적으로 삭제되었습니다.",
                        "response" to response
                    )
                )
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(
                    mapOf(
                        "status" to 400,
                        "message" to "채팅방 삭제 실패"
                    )
                )
            )
    }

    @PutMapping("/office/{id}/save_log")
    fun saveChatLog(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String,
        @RequestBody inputData: Map<String, Any>
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        val inputDataSet = inputData["input_data_set"]
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "input_data_set이 필요합니다."
                    )
                )
            )

        val googleAccessSet = (inputData["google_access_set"] as? String)?.toBoolean() ?: false
        
        return roomService.addOfficeroom(userId, id, inputDataSet as String, googleAccessSet)
            .flatMap { addResponse ->
                roomService.saveOfficeroomToMySQL(userId, id)
                    .map { savedOfficeroom ->
                        ResponseEntity.ok(
                            mapOf<String, Any>(
                                "status" to 200,
                                "message" to "채팅방이 성공적으로 생성되었고 로그가 저장되었습니다.",
                                "add_log_response" to addResponse,
                                "mysql_officeroom" to savedOfficeroom
                            )
                        )
                    }
            }
            .defaultIfEmpty(
                ResponseEntity.status(500).body(
                    mapOf(
                        "status" to 500,
                        "message" to "채팅 로그 저장에 실패했습니다."
                    )
                )
            )
    }

    @PutMapping("/office/{id}/update_log")
    fun updateChatLog(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String,
        @RequestBody inputData: Map<String, Any>
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        val index = inputData["index"] as? Int
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "인덱스 값이 필요합니다."
                    )
                )
            )

        val inputDataSet = inputData["input_data_set"] as? String
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "input_data_set 값이 필요합니다."
                    )
                )
            )

        val googleAccessSet = (inputData["google_access_set"] as? String)?.toBoolean() ?: false
        
        return roomService.updateOfficeroomLog(userId, id, index, inputDataSet, googleAccessSet)
            .map { response ->
                ResponseEntity.ok(
                    mapOf(
                        "status" to 200,
                        "message" to "채팅 로그가 성공적으로 수정되었습니다.",
                        "response" to response

                    )
                )
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(
                    mapOf(
                        "status" to 400,
                        "message" to "채팅 로그 수정 실패"
                    )
                )
            )
    }

    @DeleteMapping("/office/{id}/delete_log")
    fun deleteOfficeroomLog(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String,
        @RequestParam index: Int
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        return roomService.deleteOfficeroomLog(userId, id, index)
            .map { response ->
                ResponseEntity.ok(
                    mapOf(
                        "status" to 200,
                        "message" to "해당 로그가 성공적으로 삭제되었습니다.",
                        "response" to response
                    )
                )
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(
                    mapOf(
                        "status" to 400,
                        "message" to "로그 삭제 실패"
                    )
                )
            )
    }
}