package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.service.ChatroomService
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/server/chatroom")
class ChatroomController(private val chatroomService: ChatroomService, tokenAuth: TokenAuth) {

    // 채팅방 생성 (Chatbot)
    @PostMapping("/c/{characterId}")
    fun createChatbotRoom(
        @RequestHeader("Authorization") token: String,
        @PathVariable characterId: String
    ): ResponseEntity<String> {
        val userId = tokenAuth.authGuard(token)
        // FastAPI 서버로 채팅방 생성 요청을 보내는 로직
        // ...
        return ResponseEntity.ok("chatroom created with characterId: $characterId")
    }

    // 채팅방 생성 (Office GPT)
    @PostMapping("/o/gpt")
    fun createGptRoom(@RequestHeader("Authorization") token: String): ResponseEntity<String> {
        val userId = tokenAuth.authGuard(token)
        // FastAPI 서버로 GPT 채팅방 생성 요청을 보내는 로직
        // ...
        return ResponseEntity.ok("GPT chatroom created")
    }

    // 채팅 로드 (Chatbot)
    @GetMapping("/c/{characterId}/u/{chatroomId}")
    fun getChatbotLog(
        @RequestHeader("Authorization") token: String,
        @PathVariable characterId: String,
        @PathVariable chatroomId: String
    ): ResponseEntity<String> {
        val userId = tokenAuth.authGuard(token)
        // FastAPI 서버로부터 MongoDB에서 데이터를 받아오는 로직
        // ...
        return ResponseEntity.ok("chat logs for chatbot")
    }

    // 채팅 로드 (Office GPT)
    @GetMapping("/o/gpt/u/{chatroomId}")
    fun getGptLog(
        @RequestHeader("Authorization") token: String,
        @PathVariable chatroomId: String
    ): ResponseEntity<String> {
        val userId = tokenAuth.authGuard(token)
        // FastAPI 서버로부터 MongoDB에서 데이터를 받아오는 로직
        // ...
        return ResponseEntity.ok("chat logs for GPT")
    }
}