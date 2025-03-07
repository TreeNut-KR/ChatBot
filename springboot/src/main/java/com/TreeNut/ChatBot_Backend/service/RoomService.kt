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
import reactor.core.publisher.Flux
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
/*
오피스 응답을 요청하는 메소드
*/
    fun getOfficeResponse(
        inputDataSet: String,
        googleAccessSet: Boolean,
        mongodbId: String,
        userId: String,
    ): Mono<String> {
        val responseBuilder = StringBuilder()
        
        return webClient.build()
            .post()
            .uri("http://192.168.219.100:8001/office_stream")
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.TEXT_EVENT_STREAM)  // SSE 스트림 형식으로 변경
            .bodyValue(mapOf(
                "input_data" to inputDataSet,
                "google_access" to googleAccessSet,
                "db_id" to mongodbId,
                "user_id" to userId,
            ))
            .retrieve()
            .bodyToFlux(String::class.java)  // Flux로 받아서 처리
            .timeout(Duration.ofMinutes(10))
            .doOnNext { chunk ->
                // 각 청크를 StringBuilder에 추가
                responseBuilder.append(chunk)
            }
            .doOnError { error ->
                logger.error("[ERROR] 스트리밍 응답 처리 중 오류 발생: ${error.message}", error)
            }
            // 모든 스트리밍 데이터를 받은 후 하나의 문자열로 변환
            .collectList()
            .map { responseBuilder.toString() }
            .onErrorResume { throwable ->
                when (throwable) {
                    is TimeoutException -> Mono.error(RuntimeException("요청이 10분 시간 제한을 초과했습니다."))
                    else -> Mono.error(throwable)
                }
            }
    }

    fun createOfficeRoom(userid: String): Mono<Map<String, Any>> {
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

   fun addOfficeRoom(
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

    fun saveOfficeRoom(userid: String, mongo_chatroomid: String): Officeroom {  // 필드명 변경
        val newOfficeroom = Officeroom(
            userid = userid,
            mongo_chatroomid = mongo_chatroomid  // 필드명 변경
        )
        return officeroomRepository.save(newOfficeroom)
    }

    fun loadOfficeRoomLogs(userid: String, mongo_chatroomid: String): Mono<Map<*, *>> {
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

    fun deleteOfficeRoom(userid: String, mongo_chatroomid: String): Mono<Map<*, *>> {  // 필드명 변경
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

    fun updateOfficeRoomLog(
        userid: String,
        mongo_chatroomid: String,  // 필드명 변경
        index: Int,
        input_data_set: String,
        google_access_set: Boolean
    ): Mono<Map<*, *>> {

        // Llama 모델에 input_data_set을 보내고 응답을 받음
        return getOfficeResponse(
            inputDataSet = input_data_set,
            googleAccessSet = google_access_set,
            mongodbId = mongo_chatroomid,
            userId = userid
        ).flatMap { output_data_set ->
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

    fun deleteOfficeRoomLog(userid: String, mongo_chatroomid: String, index: Int): Mono<Map<*, *>> {  // 필드명 변경
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

    fun saveOfficeRoomToMySQL(userid: String, mongo_chatroomid: String): Mono<Officeroom> {  // 필드명 변경
        val newOfficeroom = Officeroom(
            userid = userid,
            mongo_chatroomid = mongo_chatroomid  // 필드명 변경
        )
        return Mono.fromCallable { officeroomRepository.save(newOfficeroom) }
            .subscribeOn(Schedulers.boundedElastic())
    }

/*
캐릭터 응답을 요청하는 메소드
*/
    fun getCharacterResponse(
        inputDataSet: String,
        characterName: String,
        greeting: String,
        context: String,
        mongodbId: String,
        userId: String,
    ): Mono<String> {
        val responseBuilder = StringBuilder()
        return webClient.build()
            .post()
            .uri("http://192.168.219.100:8001/character_stream")
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.TEXT_EVENT_STREAM)  // SSE 스트림 형식으로 변경
            .bodyValue(mapOf(
                "input_data" to inputDataSet,
                "character_name" to characterName,
                "greeting" to greeting,
                "context" to context,
                "db_id" to mongodbId,
                "user_id" to userId,
            ))
            .retrieve()
            .bodyToFlux(String::class.java)  // Flux로 받아서 처리
            .timeout(Duration.ofMinutes(10))
            .doOnNext { chunk ->
                // 각 청크를 StringBuilder에 추가
                responseBuilder.append(chunk)
            }
            .doOnError { error ->
                logger.error("[ERROR] 스트리밍 응답 처리 중 오류 발생: ${error.message}", error)
            }
            // 모든 스트리밍 데이터를 받은 후 하나의 문자열로 변환
            .collectList()
            .map { responseBuilder.toString() }
            .onErrorResume { throwable ->
                when (throwable) {
                    is TimeoutException -> Mono.error(RuntimeException("요청이 10분 시간 제한을 초과했습니다."))
                    else -> Mono.error(throwable)
                }
            }
    }

    fun createCharacterRoom(userid: String, characterIdx: Int): Mono<Map<String, Any>> {
        val requestBody = mapOf<String, Any>(
            "user_id" to userid,
            "character_idx" to characterIdx
        )

        return webClient.build()
            .post()
            .uri("/mongo/chatbot/create")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .map { it as Map<String, Any> }
    }

    fun addCharacterRoom(
        userid: String,
        mongo_chatroomid: String,
        input_data_set: String,
        output_data_set: String,
        image_set: String,
    ): Mono<Map<String, Any>> {
        val truncatedOutputData = output_data_set.take(8191)
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_chatroomid,
            "input_data" to input_data_set,
            "output_data" to truncatedOutputData,
            "img_url" to image_set,
        )

        return webClient.build()
            .put()
            .uri("/mongo/chatbot/save_log")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .map { it as Map<String, Any> }
    }

    fun saveCharacterRoomToMySQL(
        userid: String,
        charactersid: Int,
        mongo_chatroomid: String
    ): Mono<Chatroom> {
        return Mono.fromCallable {
            // 새로운 채팅방 생성
            val newCharacterroom = Chatroom(
                userid = userid,
                charactersIdx = charactersid,
                mongo_chatroomid = mongo_chatroomid
            )
            chatroomRepository.save(newCharacterroom)
        }.subscribeOn(Schedulers.boundedElastic())
        .onErrorResume { error ->
            // 외래 키 제약 조건 위반 시 에러 처리
            if (error.message?.contains("foreign key constraint fails") == true) {
                Mono.error(RuntimeException("선택한 캐릭터가 존재하지 않습니다: $charactersid"))
            } else {
                Mono.error(error)
            }
        }
    }
    
    fun loadCharacterRoomLogs(
        userid: String,
        mongo_chatroomid: String
    ): Mono<Map<String, Any>> {
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_chatroomid
        )

        return webClient.build()
            .post()
            .uri("/mongo/chatbot/load_log")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
            .map { response -> 
                @Suppress("UNCHECKED_CAST")
                response as Map<String, Any>
            }
            .onErrorMap { e ->
                RuntimeException("채팅 로그 로드 실패: ${e.message}")
            }
    }
}