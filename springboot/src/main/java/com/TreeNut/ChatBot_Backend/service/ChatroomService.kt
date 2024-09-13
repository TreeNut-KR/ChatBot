package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import org.springframework.stereotype.Service

package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@Service
class ChatroomService(
    private val chatroomRepository: ChatroomRepository,
    private val webClient: WebClient.Builder
) {
    fun createChatbotRoom(characterId: String, userId: User?): String {
        // FastAPI 서버에 채팅방 생성 요청을 보냄
        val chatroomId = "generatedChatroomIdFromFastApi"
        return chatroomId
    }

    fun createOfficeRoom(userId: User?): String {
        // FastAPI 서버의 /office/create 엔드포인트에 요청을 보냄
        val requestBody = mapOf("user_id" to userId)

        val chatroomId: String? = webClient.build()
            .post()
            .uri("http://fastapi:8000/mongo/office/create")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .map { it["Document ID"] as String }  // FastAPI에서 반환된 Document ID 사용
            .block()  // 비동기 처리

        return chatroomId ?: throw IllegalStateException("Chatroom ID가 생성되지 않았습니다.")
    }
}
