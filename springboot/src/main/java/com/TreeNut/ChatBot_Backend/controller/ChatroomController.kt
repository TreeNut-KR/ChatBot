package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.service.ChatroomService
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import org.springframework.web.reactive.function.server.ServerResponse
import reactor.core.publisher.Mono
import java.net.URI

@RestController
@RequestMapping("/server/chatroom")
class ChatroomController(
    private val chatroomService: ChatroomService,
    private val tokenAuth: TokenAuth
) {

    @PostMapping("/c/{characterId}")
    fun createChatbotRoom(
        @RequestHeader("Authorization") token: String,
        @PathVariable characterId: String
    ): Mono<ServerResponse> {
        val userId = tokenAuth.authGuard(token) ?: return ServerResponse.badRequest().build()

        return chatroomService.createChatbotRoom(characterId, userId)
            .flatMap { chatroomId -> 
                ServerResponse.temporaryRedirect(URI("/chatroom/c/$characterId/u/$chatroomId")).build()
            }
            .onErrorResume {
                ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
            }
    }

    @PostMapping("/o/gpt")
    fun createGptRoom(@RequestHeader("Authorization") token: String): Mono<ServerResponse> {
        val userId = tokenAuth.authGuard(token) ?: return ServerResponse.badRequest().build()

        return chatroomService.createOfficeRoom(userId)
            .flatMap { chatroomId -> 
                ServerResponse.temporaryRedirect(URI("/chatroom/o/gpt/u/$chatroomId")).build()
            }
            .onErrorResume {
                ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
            }
    }

    // 채팅 로드 (Chatbot)
    @GetMapping("/c/{characterId}/u/{chatroomId}")
    fun getChatbotLog(
        @RequestHeader("Authorization") token: String,
        @PathVariable characterId: String,
        @PathVariable chatroomId: String
    ): Mono<ServerResponse> {
        val userId = tokenAuth.authGuard(token) ?: return ServerResponse.badRequest().build()

        // FastAPI 서버로부터 MongoDB에서 데이터를 받아오는 로직
        return chatroomService.getChatbotLog(characterId, chatroomId, userId)
            .flatMap { chatLogs ->
                ServerResponse.ok().bodyValue(chatLogs)
            }
            .onErrorResume {
                ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
            }
    }

    // 채팅 로드 (Office GPT)
    @GetMapping("/o/gpt/u/{chatroomId}")
    fun getGptLog(
        @RequestHeader("Authorization") token: String,
        @PathVariable chatroomId: String
    ): Mono<ServerResponse> {
        val userId = tokenAuth.authGuard(token) ?: return ServerResponse.badRequest().build()

        // FastAPI 서버로부터 MongoDB에서 데이터를 받아오는 로직
        return chatroomService.getGptLog(chatroomId, userId)
            .flatMap { chatLogs ->
                ServerResponse.ok().bodyValue(chatLogs)
            }
            .onErrorResume {
                ServerResponse.status(HttpStatus.INTERNAL_SERVER_ERROR).build()
            }
    }
}
