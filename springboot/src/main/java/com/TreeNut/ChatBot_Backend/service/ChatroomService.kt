package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.stereotype.Service

@Service
class ChatroomService(
    private val chatroomRepository: ChatroomRepository,
    private val webClient: WebClient.Builder  // 이미 주입받고 있음
) {
    fun createChatbotRoom(characterId: String, useridx: Long?): String {
        val chatroomId = "generatedChatroomIdFromFastApi"
        return chatroomId
    }

    fun createOfficeRoom(useridx: Long?): String {
        val requestBody = mapOf("user_id" to useridx)

        val chatroomId: String? = webClient.build()
            .post()
            .uri("http://fastapi:8000/mongo/office/create")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .map { it["Document ID"] as String }
            .block()  // 비동기 처리

        return chatroomId ?: throw IllegalStateException("Chatroom ID가 생성되지 않았습니다.")
    }
}
