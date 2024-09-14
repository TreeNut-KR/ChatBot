package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.service.ChatroomService
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.servlet.view.RedirectView

@RestController
@RequestMapping("/server/chatroom")
class ChatroomController(
    private val chatroomService: ChatroomService,
    private val tokenAuth: TokenAuth // private 키워드 추가
) {

    // 채팅방 생성 (Chatbot)
    @PostMapping("/c/{characterId}")
    fun createChatbotRoom(
        @RequestHeader("Authorization") token: String,
        @PathVariable characterId: String
    ): RedirectView {
        val useridx = tokenAuth.authGuard(token)

        // FastAPI 서버로 채팅방 생성 요청을 보내는 로직 (예: POST 요청을 보내 MongoDB에 방 생성)
        // FastAPI 서버로부터 채팅방 고유번호를 반환받았다고 가정
        val chatroomId = chatroomService.createChatbotRoom(characterId, useridx)

        // 채팅방 페이지로 리디렉션
        return RedirectView("/chatroom/c/$characterId/u/$chatroomId")
    }

    // 채팅방 생성 (Office GPT)
    @PostMapping("/o/gpt")
    fun createGptRoom(@RequestHeader("Authorization") token: String): RedirectView {
        val useridx = tokenAuth.authGuard(token)
        // FastAPI 서버로 GPT 채팅방 생성 요청을 보내는 로직 (예: POST 요청을 보내 MongoDB에 방 생성)
        val chatroomId = chatroomService.createOfficeRoom(useridx)
        // GPT 채팅방 페이지로 리디렉션
        return RedirectView("/chatroom/o/gpt/u/$chatroomId")
    }

    // 채팅 로드 (Chatbot)
    @GetMapping("/c/{characterId}/u/{chatroomId}")
    fun getChatbotLog(
        @RequestHeader("Authorization") token: String,
        @PathVariable characterId: String,
        @PathVariable chatroomId: String
    ): ResponseEntity<String> {
        val useridx = tokenAuth.authGuard(token)
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
        val useridx = tokenAuth.authGuard(token)
        // FastAPI 서버로부터 MongoDB에서 데이터를 받아오는 로직
        // ...
        return ResponseEntity.ok("chat logs for GPT")
    }
}
