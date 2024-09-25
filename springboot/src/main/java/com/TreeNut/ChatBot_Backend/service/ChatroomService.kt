package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Chatroom
import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@Service
class ChatroomService(
    private val chatroomRepository: ChatroomRepository,
    private val webClient: WebClient.Builder // WebClient 주입
) {

    fun createChatroom(userid: String): Mono<Map<*, *>> {
        // FastAPI 서버에 보낼 요청 데이터 수정
        val requestBody = mapOf(
            "user_id" to userid
        )

        return webClient.build()
            .post()
            .uri("/mongo/office/create")
            .contentType(MediaType.APPLICATION_JSON) // Content-Type 명시
            .bodyValue(requestBody)  // 요청 데이터 전송
            .retrieve()
            .bodyToMono(Map::class.java) // 응답이 JSON 형태의 Map으로 반환
    }

    fun saveChatroom(userid: String, charactersIdx: Int = 0, documentId: String): Chatroom {
        // charactersIdx가 없을 경우 기본값 0으로 저장
        val newChatroom = Chatroom(
            userid = userid,
            charactersIdx = charactersIdx, // 기본값으로 0 사용 가능
            mongoChatlog = documentId
        )
        return chatroomRepository.save(newChatroom)
    }
}
