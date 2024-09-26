package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.service.ChatroomService
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/server/chatroom")
class ChatroomController(
    private val chatroomService: ChatroomService,
    private val tokenAuth: TokenAuth
) {

    @GetMapping("/test")
    fun testRoom(
        @RequestHeader("Authorization") authorization: String?
    ): ResponseEntity<Map<Any, Any>> {
        val token = authorization
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음"))
        
        val userId = tokenAuth.authGuard(token)
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다."))

        return ResponseEntity.ok(mapOf("status" to 200, "user_id" to userId))
    }
    @GetMapping("/gpt")
    fun createGptRoom(
        @RequestHeader("Authorization") authorization: String?
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음")))

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다.")))

        // FastAPI 서버에 요청하고 결과를 받아 채팅방을 생성하는 로직
        return chatroomService.createOfficeroom(userId)
            .map { response ->
                // 응답을 그대로 반환
                ResponseEntity.ok(mapOf(
                    "status" to 200,
                    "message" to "채팅방이 성공적으로 생성되었습니다.",
                    "chatroom" to response // FastAPI에서 받은 응답
                ))
            }
            .defaultIfEmpty(
                ResponseEntity.status(500).body(mapOf(
                    "status" to 500,
                    "message" to "채팅방 생성에 실패했습니다."
                ))
            )
    }

}
