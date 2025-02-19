package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Chatroom
import com.TreeNut.ChatBot_Backend.model.Officeroom
import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import com.TreeNut.ChatBot_Backend.repository.OfficeroomRepository
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.http.HttpMethod
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import reactor.core.scheduler.Schedulers
import java.util.concurrent.atomic.AtomicBoolean
import java.time.Duration
import java.util.concurrent.TimeoutException

@Service
class RoomService(
    private val chatroomRepository: ChatroomRepository,
    private val officeroomRepository: OfficeroomRepository,
    private val webClient: WebClient.Builder
) {
    private val logger = LoggerFactory.getLogger(RoomService::class.java)

    fun getOfficeResponse(inputDataSet: String, googleAccessSet: Boolean): Mono<String> {
        return webClient.build()
            .post()
            .uri("http://192.168.219.100:8001/office_stream")
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.APPLICATION_JSON)
            .bodyValue(mapOf(
                "input_data" to inputDataSet,
                "google_access" to googleAccessSet
            ))
            .retrieve()
            .bodyToMono(Map::class.java)
            .timeout(Duration.ofMinutes(10))
            .map { response ->
                val responseData = response["response"] as? String
                    ?: throw IllegalArgumentException("응답 데이터에 'response' 필드가 없습니다.")
                responseData
            }
            .onErrorResume { throwable ->
                when (throwable) {
                    is TimeoutException -> Mono.error(RuntimeException("요청이 10분 시간 제한을 초과했습니다."))
                    else -> Mono.error(throwable)
                }
            }
            .doOnError { error ->
        logger.error("[ERROR] 응답 처리 중 오류 발생: ${error.message}", error)
    }
    }

    fun getCharacterResponse(inputDataSet: String): Mono<String> {
        return webClient.build()
            .post()
            .uri("http://192.168.219.100:8001/character_stream")
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.APPLICATION_JSON)
            .bodyValue(mapOf(
                "input_data" to inputDataSet
            ))
            .retrieve()
            .bodyToMono(Map::class.java)
            .timeout(Duration.ofMinutes(10))
            .map { response ->
                val responseData = response["response"] as? String
                    ?: throw IllegalArgumentException("응답 데이터에 'response' 필드가 없습니다.")
                responseData
            }
            .onErrorResume { throwable ->
                when (throwable) {
                    is TimeoutException -> Mono.error(RuntimeException("요청이 10분 시간 제한을 초과했습니다."))
                    else -> Mono.error(throwable)
                }
            }
            .doOnError { error ->
                logger.error("[ERROR] 응답 처리 중 오류 발생: ${error.message}", error)
            }
    }

    fun createOfficeroom(userid: String): Mono<Map<String, Any>> {
        val requestBody = mapOf<String, Any>(
            "user_id" to userid
        )

        return webClient.build()
            .post()
            .uri("/mongo/office/create")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .map { it as Map<String, Any> }
    }

   fun addOfficeroom(
        userid: String,
        mongo_chatroomid: String,
        input_data_set: String,
        output_data_set: String
    ): Mono<Map<String, Any>> {
        val truncatedOutputData = output_data_set.take(8191)
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_chatroomid,
            "input_data" to input_data_set,
            "output_data" to truncatedOutputData
        )

        return webClient.build()
            .put()
            .uri("/mongo/office/save_log")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .map { it as Map<String, Any> }
    }

    fun saveOfficeroom(userid: String, mongo_chatroomid: String): Officeroom {  // 필드명 변경
        val newOfficeroom = Officeroom(
            userid = userid,
            mongo_chatroomid = mongo_chatroomid  // 필드명 변경
        )
        return officeroomRepository.save(newOfficeroom)
    }

    fun loadOfficeroomLogs(userid: String, mongo_chatroomid: String): Mono<Map<*, *>> {
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_chatroomid
        )

        return webClient.build()
            .post()
            .uri("/mongo/office/load_log")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
    }

    fun deleteOfficeroom(userid: String, mongo_chatroomid: String): Mono<Map<*, *>> {  // 필드명 변경
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_chatroomid  // 필드명 변경
        )

        return webClient.build()
            .method(HttpMethod.DELETE)
            .uri("/mongo/office/delete_room")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
    }

    fun updateOfficeroomLog(
        userid: String,
        mongo_chatroomid: String,  // 필드명 변경
        index: Int,
        input_data_set: String,
        google_access_set: Boolean
    ): Mono<Map<*, *>> {

        // Llama 모델에 input_data_set을 보내고 응답을 받음
        return getOfficeResponse(input_data_set, google_access_set).flatMap { output_data_set ->
            val truncatedOutputData = output_data_set.take(8191) // output_data의 길이를 8191자로 제한
            val requestBody = mapOf(
                "user_id" to userid,
                "id" to mongo_chatroomid,  // 필드명 변경
                "index" to index,
                "input_data" to input_data_set,
                "output_data" to truncatedOutputData
            )

            webClient.build()
                .put()
                .uri("/mongo/office/update_log")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map::class.java)
        }
    }

    fun deleteOfficeroomLog(userid: String, mongo_chatroomid: String, index: Int): Mono<Map<*, *>> {  // 필드명 변경
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_chatroomid,  // 필드명 변경
            "index" to index
        )

        return webClient.build()
            .method(HttpMethod.DELETE)
            .uri("/mongo/office/delete_log")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
    }

    fun saveOfficeroomToMySQL(userid: String, mongo_chatroomid: String): Mono<Officeroom> {  // 필드명 변경
        val newOfficeroom = Officeroom(
            userid = userid,
            mongo_chatroomid = mongo_chatroomid  // 필드명 변경
        )
        return Mono.fromCallable { officeroomRepository.save(newOfficeroom) }
            .subscribeOn(Schedulers.boundedElastic())
    }

    fun saveChatroom(userid: String, charactersIdx: Int = 0, mongo_chatroomid: String): Chatroom {
        val newChatroom = Chatroom(
            userid = userid,
            charactersIdx = charactersIdx,
            mongo_chatroomid = mongo_chatroomid
        )
        return chatroomRepository.save(newChatroom)
    }
}