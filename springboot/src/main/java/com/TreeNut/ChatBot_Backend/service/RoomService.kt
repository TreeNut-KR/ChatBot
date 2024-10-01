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
class RoomService(
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

    fun addOfficeroom(
            userid: String,
            mongo_chatroomid: String,
            input_data_set: String,
            output_data_set: String = "TESTING⚠️TESTING⚠️TESTING" // AI Model 도입 전임으로 임시로 설정
        ): Mono<Map<*, *>> {

        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_chatroomid,
            "input_data" to input_data_set,
            "output_data" to output_data_set
        )

        return webClient.build()
            .put()
            .uri("/mongo/office/save_log")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
    }

    fun saveOfficeroom(userid: String, mongo_chatroomid: String): Officeroom {
        val newOfficeroom = Officeroom(
            userid = userid,
            mongo_chatroomid = mongo_chatroomid
        )
        return officeroomRepository.save(newOfficeroom) // OfficeroomRepository를 사용하여 저장
    }

    fun saveChatroom(userid: String, charactersIdx: Int = 0, mongo_chatroomid: String): Chatroom {
        val newChatroom = Chatroom(
            userid = userid,
            charactersIdx = charactersIdx,
            mongo_chatroomid = mongo_chatroomid
        )
        return chatroomRepository.save(newChatroom) // ChatroomRepository를 사용하여 저장
    }

    fun loadOfficeroomLogs(userid: String, mongo_chatroomid: String): Mono<Map<*, *>> {
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_chatroomid
        )

        return webClient.build()
            .post()
            .uri("/mongo/office/load_log")  // FastAPI 서버에서 로그를 불러오는 엔드포인트
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
    }
}
