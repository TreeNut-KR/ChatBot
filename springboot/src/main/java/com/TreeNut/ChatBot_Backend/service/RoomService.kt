package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Chatroom
import com.TreeNut.ChatBot_Backend.model.MembershipType
import com.TreeNut.ChatBot_Backend.model.Officeroom
import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import com.TreeNut.ChatBot_Backend.repository.OfficeroomRepository
import com.TreeNut.ChatBot_Backend.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
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
    private val userRepository: UserRepository,
    private val webClient: WebClient.Builder,
    @Value("\${python.server.url:http://192.168.3.145:8001}") private val pythonServerUrl: String
) {
    private val logger = LoggerFactory.getLogger(RoomService::class.java)
/*
오피스 응답을 요청하는 메소드
*/
    fun getOffice_Response(
        inputDataSet: String,
        googleAccessSet: Boolean,
        mongodbId: String,
        userId: String,
        route: String = "Llama",
    ): Mono<String> {
        val responseBuilder = StringBuilder()
        
        return webClient.build()
            .post()
            .uri("${pythonServerUrl}/office/{route}", route) 
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.APPLICATION_JSON)
            .bodyValue(mapOf(
                "input_data" to inputDataSet,
                "google_access" to googleAccessSet,
                "db_id" to mongodbId,
                "user_id" to userId,
            ))
            .retrieve()
            .bodyToFlux(String::class.java)
            .doOnNext { chunk ->
                responseBuilder.append(chunk)
            }
            .timeout(Duration.ofMinutes(10))
            .doOnError { error ->
                logger.error("[ERROR] 스트리밍 응답 처리 중 오류 발생: ${error.message}", error)
            }
            .collectList()
            .map { 
                val output = responseBuilder.toString()
                
                // output이 따옴표로 시작하고 끝나면 따옴표 제거
                val cleanOutput = if (output.startsWith("\"") && output.endsWith("\"")) {
                    output.substring(1, output.length - 1)
                } else {
                    output
                }
                
                // 이스케이프된 따옴표를 실제 따옴표로 변환
                cleanOutput.replace("\\\"", "\"")
            }
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
            .map { 
                @Suppress("UNCHECKED_CAST")
                it as Map<String, Any> 
            }
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
            .map { 
                @Suppress("UNCHECKED_CAST")
                it as Map<String, Any> 
            }
    }

    fun saveOfficeRoom(userid: String, mongo_chatroomid: String): Officeroom {  // 필드명 변경
        val newOfficeroom = Officeroom(
            userid = userid,
            mongo_chatroomid = mongo_chatroomid  // 필드명 변경
        )
        return officeroomRepository.save(newOfficeroom)
    }

    fun findOfficeRoomUUIDByUserId(userid: String): Flux<Map<String, Any>> {
        // userid를 통해 mongo_chatroomid를 조회
        return Flux.fromIterable(
            officeroomRepository.findAll()
                .filter { it.userid == userid }
                .mapNotNull { officeroom ->
                    officeroom.mongo_chatroomid?.let { roomid ->
                        // roomid에 대한 첫 번째 채팅 메시지 조회
                        loadOfficeRoomLogs(userid, roomid)
                            .map { chatLog ->
                                val messages = chatLog["value"] as? List<Map<String, Any>> // 'value' 키로 접근
                                val title = messages?.firstOrNull { it["index"] == 1 }?.get("input_data") as? String ?: ""
    
                                // inputData의 글자 수가 10글자 이상일 경우 처리
                                val formattedTitle = if (title.length > 10) {
                                    title.substring(0, 10) + "..."
                                } else {
                                    title
                                }
    
                                // 결과 맵 생성
                                mapOf(
                                    "roomid" to roomid,
                                    "Title" to formattedTitle,
                                    "updatedAt" to officeroom.updatedAt // updatedAt을 추가
                                )
                            }.defaultIfEmpty(mapOf("roomid" to roomid, "Title" to "", "updatedAt" to ""))
                    }
                }
        ).flatMap { it }
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
            "id" to mongo_chatroomid
        )

        return webClient.build()
            .method(HttpMethod.DELETE)
            .uri("/mongo/office/delete_room")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
    }
    
    // MongoDB 채팅방 삭제와 함께 MySQL에서도 Office 채팅방 정보 삭제
    fun deleteOfficeRoomFromMySQL(userid: String, mongo_chatroomid: String): Mono<Void> {
        return Mono.fromCallable {
            val officeRooms = officeroomRepository.findAll()
                .filter { it.userid == userid && it.mongo_chatroomid == mongo_chatroomid }
            
            if (officeRooms.isNotEmpty()) {
                officeroomRepository.deleteAll(officeRooms)
                logger.info("MySQL에서 Office 채팅방 정보 삭제 완료: $mongo_chatroomid (사용자: $userid)")
            } else {
                logger.warn("MySQL에서 삭제할 Office 채팅방 정보를 찾을 수 없음: $mongo_chatroomid (사용자: $userid)")
            }
        }
        .subscribeOn(Schedulers.boundedElastic())
        .then()
    }

    fun updateOfficeRoomLog( 
        userid: String,
        mongo_chatroomid: String,  // 필드명 변경
        index: Int,
        input_data_set: String,
        google_access_set: Boolean,
        route: String
    ): Mono<Map<*, *>> {
        return getUserMembership(userid).flatMap { membership ->
            // BASIC 사용자는 "Llama" 모델만 사용할 수 있음
            val finalRoute = if (membership == MembershipType.BASIC && route != "Llama") {
                "Llama" // BASIC 멤버십은 무조건 Llama 모델만 사용
            } else {
                route // VIP 멤버십은 요청한 route 그대로 사용
            }

            // Llama 모델에 input_data_set을 보내고 응답을 받음
            getOffice_Response(
                inputDataSet = input_data_set,
                googleAccessSet = google_access_set,
                mongodbId = mongo_chatroomid,
                userId = userid,
                route = finalRoute,
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

    // 사용자의 멤버십 유형을 조회하는 메서드
    fun getUserMembership(userId: String): Mono<MembershipType> {
        return Mono.fromCallable {
            val user = userRepository.findByUserid(userId)
            user?.membership ?: MembershipType.BASIC
        }.subscribeOn(Schedulers.boundedElastic())
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
        route: String = "Llama",
    ): Mono<String> {
        val responseBuilder = StringBuilder()
        return webClient.build()
            .post()
            .uri("${pythonServerUrl}/character/{route}", route)
            .contentType(MediaType.APPLICATION_JSON)
            .accept(MediaType.APPLICATION_JSON)
            .bodyValue(mapOf(
                "input_data" to inputDataSet,
                "character_name" to characterName,
                "greeting" to greeting,
                "context" to context,
                "db_id" to mongodbId,
                "user_id" to userId,
            ))
            .retrieve()
            .bodyToFlux(String::class.java)
            .timeout(Duration.ofMinutes(10))
            .doOnNext { chunk ->
                responseBuilder.append(chunk)
            }
            .doOnError { error ->
                logger.error("[ERROR] 스트리밍 응답 처리 중 오류 발생: ${error.message}", error)
            }
            .collectList()
            .map { 
                val output = responseBuilder.toString()
                
                // output이 따옴표로 시작하고 끝나면 따옴표 제거
                val cleanOutput = if (output.startsWith("\"") && output.endsWith("\"")) {
                    output.substring(1, output.length - 1)
                } else {
                    output
                }
                
                // 이스케이프된 따옴표를 실제 따옴표로 변환
                cleanOutput.replace("\\\"", "\"")
            }
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
            .map { 
                @Suppress("UNCHECKED_CAST")
                it as Map<String, Any> 
            }
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
            .map { 
                @Suppress("UNCHECKED_CAST")
                it as Map<String, Any> 
            }
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

    fun findCharacterRoomUUIDByUserId(userid: String): Flux<Map<String, Any>> {
        // userid를 통해 mongo_chatroomid를 조회
        return Flux.fromIterable(
            chatroomRepository.findAll()
                .filter { it.userid == userid }
                .mapNotNull { it.mongo_chatroomid }
                .map { roomid ->
                    // roomid에 대한 첫 번째 채팅 메시지 조회
                    loadCharacterRoomLogs(userid, roomid)
                        .map { chatLog ->
                            val messages = chatLog["value"] as? List<Map<String, Any>> // 'value' 키로 접근
                            val Title = messages?.firstOrNull { it["index"] == 1 }?.get("input_data") as? String ?: ""

                            // inputData의 글자 수가 10글자 이상일 경우 처리
                            val formattedTitle = if (Title.length > 10) {
                                Title.substring(0, 10) + "..."
                            } else {
                                Title
                            }
                            mapOf(
                                "roomid" to roomid,
                                "Title" to formattedTitle
                            )
                        }.defaultIfEmpty(mapOf("roomid" to roomid, "Title" to ""))
                }
        ).flatMap { it }
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

    fun saveCharacterRoom(userid: String, charactersid: Int, mongo_chatroomid: String): Chatroom {
        val newCharacterRoom = Chatroom(
            userid = userid,
            charactersIdx = charactersid,
            mongo_chatroomid = mongo_chatroomid
        )
        return chatroomRepository.save(newCharacterRoom)
    }

    fun deleteCharacterRoom(userid: String, mongo_chatroomid: String): Mono<Map<*, *>> {
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_chatroomid
        )

        return webClient.build()
            .method(HttpMethod.DELETE)
            .uri("/mongo/chatbot/delete_room")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
    }

    fun deleteCharacterRoomFromMySQL(userid: String, mongo_chatroomid: String): Mono<Void> {
        return Mono.fromCallable {
            val characterRooms = chatroomRepository.findAll()
                .filter { it.userid == userid && it.mongo_chatroomid == mongo_chatroomid }
            
            if (characterRooms.isNotEmpty()) {
                chatroomRepository.deleteAll(characterRooms)
                logger.info("MySQL에서 Character 채팅방 정보 삭제 완료: $mongo_chatroomid (사용자: $userid)")
            } else {
                logger.warn("MySQL에서 삭제할 Character 채팅방 정보를 찾을 수 없음: $mongo_chatroomid (사용자: $userid)")
            }
        }
        .subscribeOn(Schedulers.boundedElastic())
        .then()
    }

    fun updateCharacterRoomLog(
        userid: String,
        mongo_chatroomid: String,
        index: Int,
        input_data_set: String,
        characterName: String,
        greeting: String,
        context: String,
        image_set: String,
        route: String
    ): Mono<Map<*, *>> {
        return getUserMembership(userid).flatMap { membership ->
            // BASIC 사용자는 "Llama" 모델만 사용할 수 있음
            val finalRoute = if (membership == MembershipType.BASIC && route != "Llama") {
                "Llama" // BASIC 멤버십은 무조건 Llama 모델만 사용
            } else {
                route // VIP 멤버십은 요청한 route 그대로 사용
            }
        
            getCharacterResponse(
                inputDataSet = input_data_set,
                characterName = characterName,
                greeting = greeting,
                context = context,
                mongodbId = mongo_chatroomid,
                userId = userid,
                route = finalRoute,
            ).flatMap { output_data_set ->
                val truncatedOutputData = output_data_set.take(8191)
                val requestBody = mapOf(
                    "user_id" to userid,
                    "id" to mongo_chatroomid,
                    "index" to index,
                    "input_data" to input_data_set,
                    "output_data" to truncatedOutputData,
                    "img_url" to image_set,
                )

                webClient.build()
                    .put()
                    .uri("/mongo/chatbot/update_log")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map::class.java)
            }
        }
    }

    fun deleteCharacterRoomLog(userid: String, mongo_chatroomid: String, index: Int): Mono<Map<*, *>> {
        val requestBody = mapOf(
            "user_id" to userid,
            "id" to mongo_chatroomid,
            "index" to index
        )

        return webClient.build()
            .method(HttpMethod.DELETE)
            .uri("/mongo/chatbot/delete_log")
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map::class.java)
    }
}