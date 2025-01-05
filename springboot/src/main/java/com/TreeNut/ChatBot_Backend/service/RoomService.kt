package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Chatroom
import com.TreeNut.ChatBot_Backend.model.Officeroom
import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import com.TreeNut.ChatBot_Backend.repository.OfficeroomRepository
import org.springframework.http.MediaType
import org.springframework.http.HttpMethod
import org.springframework.stereotype.Service
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono
import reactor.core.scheduler.Schedulers
import reactor.core.publisher.Flux
import java.util.concurrent.atomic.AtomicBoolean
import java.time.Duration

@Service
class RoomService(
    private val chatroomRepository: ChatroomRepository,
    private val officeroomRepository: OfficeroomRepository,
    private val webClient: WebClient.Builder
) {
    // streamingComplete 변수 초기화
    private val streamingComplete = AtomicBoolean(true)

    fun getLlamaResponse(inputDataSet: String, google_access_set: Boolean): Mono<String> {
        return Mono.just(streamingComplete.get()).flatMap {
            streamingComplete.set(false) // 스트리밍 시작 시 완료 상태 설정을 false로 변경

            val llamaRequestBody = mapOf(
                "input_data" to inputDataSet,
                "google_access_set" to google_access_set
            )

            webClient.build()
                .post()
                .uri("http://192.168.219.100:8001/Llama_stream")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(llamaRequestBody)
                .retrieve()
                .bodyToFlux(String::class.java)
                .reduce { acc, next -> acc + next } // 스트리밍 데이터를 하나의 문자열로 결합
                .timeout(Duration.ofMinutes(10)) // 타임아웃 설정을 10분으로 조정
                .doOnTerminate {
                    streamingComplete.set(true) // 스트리밍이 끝나면 완료 상태로 설정
                }
                .map { response ->
                    response.ifEmpty { "Llama 응답 실패" }
                }
        }
    }

    fun getBllossomResponse(inputDataSet: String): Mono<String> {
        return Mono.just(streamingComplete.get()).flatMap {
            streamingComplete.set(false) // 스트리밍 시작 시 완료 상태 설정을 false로 변경

            val bllossomRequestBody = mapOf(
                "input_data" to inputDataSet
            )

            webClient.build()
                .post()
                .uri("http://192.168.219.100:8001/Bllossom_stream")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(bllossomRequestBody)
                .retrieve()
                .bodyToFlux(String::class.java)
                .collectList() // 전체 스트리밍 데이터를 모아서 처리
                .map { it.joinToString("") } // 각 조각을 이어서 최종 응답 생성
                .timeout(Duration.ofMinutes(10)) // 타임아웃 설정을 10분으로 조정
                .doOnTerminate {
                    streamingComplete.set(true) // 스트리밍이 끝나면 완료 상태로 설정
                }
                .map { response ->
                    println("Bllossom Response Length: ${response.length}")
                    val truncatedResponse = response.take(512)
                    response.ifEmpty { "Bllossom 응답 실패" }
                }
        }
    }

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
        mongo_officeroomid: String,
        input_data_set: String,
        google_access_set: Boolean
    ): Mono<Map<*, *>> {

        // Llama 모델에 input_data_set을 보내고 응답을 받음
        return getLlamaResponse(input_data_set, google_access_set).flatMap { output_data_set ->
            val truncatedOutputData = output_data_set.take(500) // output_data의 길이를 500자로 제한
            val requestBody = mapOf(
                "user_id" to userid,
                "id" to mongo_officeroomid,
                "input_data" to input_data_set,
                "output_data" to truncatedOutputData
            )

            webClient.build()
                .put()
                .uri("/mongo/office/save_log")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .onStatus({ status -> status.is4xxClientError || status.is5xxServerError }) { clientResponse ->
                    clientResponse.bodyToMono(String::class.java).flatMap { errorBody ->
                        Mono.error(RuntimeException("Error response from server: $errorBody"))
                    }
                }
                .bodyToMono(Map::class.java)
        }
    }

    fun saveOfficeroom(userid: String, mongo_officeroomid: String): Officeroom {
        val newOfficeroom = Officeroom(
            userid = userid,
            mongo_officeroomid = mongo_officeroomid
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

    fun deleteOfficeroom(userid: String, mongo_officeroomid: String): Mono<Map<*, *>> {
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_officeroomid
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
        mongo_officeroomid: String,
        index: Int,
        input_data_set: String,
        google_access_set: Boolean
    ): Mono<Map<*, *>> {

        // Llama 모델에 input_data_set을 보내고 응답을 받음
        return getLlamaResponse(input_data_set, google_access_set).flatMap { output_data_set ->
            val truncatedOutputData = output_data_set.take(500) // output_data의 길이를 500자로 제한
            val requestBody = mapOf(
                "user_id" to userid,
                "id" to mongo_officeroomid,
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

    fun deleteOfficeroomLog(userid: String, mongo_officeroomid: String, index: Int): Mono<Map<*, *>> {
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_officeroomid,
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

    fun saveOfficeroomToMySQL(userid: String, mongo_chatroomid: String): Mono<Officeroom> {
        val newOfficeroom = Officeroom(
            userid = userid,
            mongo_officeroomid = mongo_chatroomid
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
