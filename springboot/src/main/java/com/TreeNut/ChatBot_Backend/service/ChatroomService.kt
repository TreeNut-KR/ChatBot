package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Chatroom
import com.TreeNut.ChatBot_Backend.model.Officeroom
import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import com.TreeNut.ChatBot_Backend.repository.OfficeroomRepository
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@Service
class ChatroomService(
    private val chatroomRepository: ChatroomRepository,
    private val officeroomRepository: OfficeroomRepository, // OfficeroomRepository 추가
    private val webClient: WebClient.Builder
) {

    fun createOfficeroom(userid: String): Mono<Map<*, *>> {
        val requestBody = mapOf(
            "user_id" to userid
        )

        return webClient.build()
            .post()
            .uri("/mongo/office/create")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
    }

    fun saveOfficeroom(userid: String, documentId: String): Officeroom {
        val newOfficeroom = Officeroom(
            userid = userid,
            mongoChatlog = documentId
        )
        return officeroomRepository.save(newOfficeroom) // OfficeroomRepository를 사용하여 저장
    }

    fun saveChatroom(userid: String, charactersIdx: Int = 0, documentId: String): Chatroom {
        val newChatroom = Chatroom(
            userid = userid,
            charactersIdx = charactersIdx,
            mongoChatlog = documentId
        )
        return chatroomRepository.save(newChatroom) // ChatroomRepository를 사용하여 저장
    }
}
