package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Chatroom
import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import java.time.LocalDateTime

@Service
class ChatroomService(
    private val chatroomRepository: ChatroomRepository,
    private val webClient: WebClient.Builder
) {
    fun createChatbotRoom(characterId: String, userId: Long): Mono<String> {
        val requestBody = mapOf("character_id" to characterId, "user_id" to userId)

        return webClient.build()
            .post()
            .uri("http://fastapi:8000/mongo/chatroom/create")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .map { response ->
                val chatroomId = response["chatroomId"] as? String ?: throw IllegalStateException("Chatroom ID가 생성되지 않았습니다.")
                val chatroom = Chatroom(
                    usersIdx = userId.toInt(),
                    charactersPk = characterId.toInt(),
                    mongoChatlog = chatroomId,
                    createdAt = LocalDateTime.now(),
                    updatedAt = LocalDateTime.now()
                )
                chatroomRepository.save(chatroom)
                chatroomId
            }
    }

    fun createOfficeRoom(userId: Long): Mono<String> {
        val requestBody = mapOf("user_id" to userId)

        return webClient.build()
            .post()
            .uri("http://fastapi:8000/mongo/office/create")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .map { response ->
                val chatroomId = response["Document ID"] as? String ?: throw IllegalStateException("Chatroom ID가 생성되지 않았습니다.")
                val chatroom = Chatroom(
                    usersIdx = userId.toInt(),
                    charactersPk = 0,
                    mongoChatlog = chatroomId,
                    createdAt = LocalDateTime.now(),
                    updatedAt = LocalDateTime.now()
                )
                chatroomRepository.save(chatroom)
                chatroomId
            }
    }
}
