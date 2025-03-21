package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.service.CharacterService
import org.springframework.web.reactive.function.client.WebClient
import com.TreeNut.ChatBot_Backend.service.RoomService
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import com.TreeNut.ChatBot_Backend.model.MembershipType
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.media.Content
import io.swagger.v3.oas.annotations.media.Schema
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import reactor.core.publisher.Mono
import reactor.core.publisher.Flux
import org.springframework.http.MediaType

@Tag(name = "Room Controller", description = "채팅방 관련 API")
@RestController
@RequestMapping("/server/chatroom")
class RoomController(
    private val characterService: CharacterService,
    private val roomService: RoomService,
    private val tokenAuth: TokenAuth
) {
    @Operation(
        summary = "office 채팅방 생성",
        description = "새로운 office 채팅방을 생성합니다."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "채팅방 생성 성공"),
        ApiResponse(responseCode = "401", description = "토큰 인증 실패"),
        ApiResponse(responseCode = "500", description = "서버 오류")
    ])
    @GetMapping("/office")
    fun createOfficeRoom(
        @Parameter(description = "인증 토큰", required = true)
        @RequestHeader("Authorization") authorization: String?
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        return roomService.createOfficeRoom(userId)
            .flatMap { response: Map<String, Any> ->
                val id = response["Document ID"] as? String
                    ?: return@flatMap Mono.just(
                        ResponseEntity.status(500).body<Map<String, Any>>(
                            mapOf(
                                "status" to 500,
                                "message" to "id 생성 실패"
                            )
                        )
                    )

                roomService.saveOfficeRoomToMySQL(userId, id)
                    .map { savedOfficeRoom ->
                        ResponseEntity.ok(
                            mapOf<String, Any>(
                                "status" to 200,
                                "message" to "채팅방이 성공적으로 생성되었습니다.",
                                "mysql_officeroom" to savedOfficeRoom
                            )
                        )
                    }
            }
            .defaultIfEmpty(
                ResponseEntity.status(500).body(
                    mapOf(
                        "status" to 500,
                        "message" to "채팅방 생성에 실패했습니다."
                    )
                )
            )
    }

    @Operation(
        summary = "AI 응답 받기",
        description = "채팅방에서 AI 응답을 받습니다."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "응답 성공"),
        ApiResponse(responseCode = "401", description = "토큰 인증 실패")
    ])
    @PostMapping("/office/{id}/get_response")
    fun getofficeResponse(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String,
        @RequestBody inputData: Map<String, Any>
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        val inputDataSet = inputData["input_data_set"] as? String
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "input_data_set 값이 필요합니다."
                    )
                )
            )

        val routeSet = inputData["route_set"] as? String
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "route_set 값이 필요합니다."
                    )
                )
            )

        val googleAccessSet = (inputData["google_access_set"] as? String)?.toBoolean() ?: false

        // 사용자의 멤버십 정보 확인
        return roomService.getUserMembership(userId).flatMap { membership ->
            // BASIC 사용자는 "Llama" 모델만 사용할 수 있음
            val finalRoute = if (membership == MembershipType.BASIC && routeSet != "Llama") {
                "Llama" // BASIC 멤버십은 무조건 Llama 모델만 사용
            } else {
                routeSet // VIP 멤버십은 요청한 route 그대로 사용
            }

            roomService.getOfficeResponse(
                inputDataSet = inputDataSet,
                googleAccessSet = googleAccessSet,
                mongodbId = id,
                userId = userId,
                route = finalRoute
            ).flatMap { response ->
                roomService.addOfficeRoom(
                    userid = userId,
                    mongo_chatroomid = id,
                    input_data_set = inputDataSet,
                    output_data_set = response.toString()
                ).map {
                    ResponseEntity.ok(
                        mapOf(
                            "status" to 200,
                            "message" to response.toString()
                        ) as Map<String, Any>
                    )
                }
            }
            .onErrorResume { e ->
                Mono.just(
                    ResponseEntity.status(500).body(
                        mapOf(
                            "status" to 500,
                            "message" to "에러 발생: ${e.message}"
                        ) as Map<String, Any>
                    )
                )
            }
        }
    }

    @Operation(
        summary = "채팅방 조회",
        description = "사용자의의 채팅방을 조회합니다."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "채팅방 조회 성공"),
        ApiResponse(responseCode = "400", description = "채팅방 조회 실패"),
        ApiResponse(responseCode = "401", description = "토큰 인증 실패")
    ])
    @GetMapping("/office/find_my_rooms")
    fun findMyRooms(
        @Parameter(description = "인증 토큰", required = true)
        @RequestHeader("Authorization") authorization: String?
    ): Mono<ResponseEntity<Map<String, Any>>> {
        if (authorization == null) {
            return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )
        }
        val token = authorization
    
        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )
    
        return roomService.findOfficeRoomUUIDByUserId(userId)
            .collectList()
            .map { rooms ->
                ResponseEntity.ok(
                    mapOf(
                        "status" to 200,
                        "rooms" to rooms
                    )
                )
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(
                    mapOf(
                        "status" to 400,
                        "message" to "채팅방을 찾을 수 없습니다."
                    )
                )
            )
    }

    @Operation(
        summary = "채팅 로그 불러오기",
        description = "특정 채팅방의 대화 로그를 불러옵니다."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "로그 조회 성공"),
        ApiResponse(responseCode = "400", description = "로그 조회 실패"),
        ApiResponse(responseCode = "401", description = "토큰 인증 실패")
    ])
    @PostMapping("/office/{id}/load_logs")
    fun loadChatLogs(
        @Parameter(description = "인증 토큰", required = true)
        @RequestHeader("Authorization") authorization: String?,
        @Parameter(description = "채팅방 ID", required = true)
        @PathVariable id: String
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        return roomService.loadOfficeRoomLogs(userId, id)
            .map { logs ->
                ResponseEntity.ok(
                    mapOf(
                        "status" to 200,
                        "logs" to logs
                    )
                )
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(
                    mapOf(
                        "status" to 400,
                        "message" to "로그를 찾을 수 없습니다."
                    )
                )
            )
    }

    @Operation(
        summary = "채팅방 삭제",
        description = "특정 채팅방을 삭제합니다."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "채팅방 삭제 성공"),
        ApiResponse(responseCode = "400", description = "채팅방 삭제 실패"),
        ApiResponse(responseCode = "401", description = "토큰 인증 실패")
    ])
    @DeleteMapping("/office/{id}/delete_room")
    fun deleteChatRoom(
        @Parameter(description = "인증 토큰", required = true)
        @RequestHeader("Authorization") authorization: String?,
        @Parameter(description = "채팅방 ID", required = true)
        @PathVariable id: String
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        return roomService.deleteOfficeRoom(userId, id)
            .map { response ->
                ResponseEntity.ok(
                    mapOf(
                        "status" to 200,
                        "message" to "채팅방이 성공적으로 삭제되었습니다.",
                        "response" to response
                    )
                )
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(
                    mapOf(
                        "status" to 400,
                        "message" to "채팅방 삭제 실패"
                    )
                )
            )
    }
    
    @Operation(
        summary = "채팅 로그 수정",
        description = "기존 채팅 로그를 수정합니다."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "로그 수정 성공"),
        ApiResponse(responseCode = "400", description = "로그 수정 실패"),
        ApiResponse(responseCode = "401", description = "토큰 인증 실패")
    ])
    @PutMapping("/office/{id}/update_log")
    fun updateChatLog(
        @Parameter(description = "인증 토큰", required = true)
        @RequestHeader("Authorization") authorization: String?,
        @Parameter(description = "채팅방 ID", required = true)
        @PathVariable id: String,
        @Parameter(description = "입력 데이터", required = true)
        @RequestBody inputData: Map<String, Any>
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        val index = inputData["index"] as? Int
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "인덱스 값이 필요합니다."
                    )
                )
            )

        val inputDataSet = inputData["input_data_set"] as? String
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "input_data_set 값이 필요합니다."
                    )
                )
            )
        

        val routeSet = inputData["route_set"] as? String
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "route_set 값이 필요합니다."
                    )
                )
            )

        val googleAccessSet = (inputData["google_access_set"] as? String)?.toBoolean() ?: false
        // 사용자의 멤버십 정보 확인 후 업데이트 수행
        return roomService.getUserMembership(userId).flatMap { membership ->
            // BASIC 사용자는 "Llama" 모델만 사용할 수 있음
            val finalRoute = if (membership == MembershipType.BASIC && routeSet != "Llama") {
                "Llama" // BASIC 멤버십은 무조건 Llama 모델만 사용
            } else {
                routeSet // VIP 멤버십은 요청한 route 그대로 사용
            }
            
            roomService.updateOfficeRoomLog(userId, id, index, inputDataSet, googleAccessSet, finalRoute)
                .map { response ->
                    ResponseEntity.ok(
                        mapOf(
                            "status" to 200,
                            "message" to "채팅 로그가 성공적으로 수정되었습니다.",
                            "response" to response
                        )
                    )
                }
                .defaultIfEmpty(
                    ResponseEntity.status(400).body(
                        mapOf(
                            "status" to 400,
                            "message" to "채팅 로그 수정 실패"
                        )
                    )
                )
        }
    }

    @Operation(
        summary = "채팅 로그 삭제",
        description = "특정 채팅 로그를 삭제합니다."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "로그 삭제 성공"),
        ApiResponse(responseCode = "400", description = "로그 삭제 실패"),
        ApiResponse(responseCode = "401", description = "토큰 인증 실패")
    ])
    @DeleteMapping("/office/{id}/delete_log")
    fun deleteOfficeroomLog(
        @Parameter(description = "인증 토큰", required = true)
        @RequestHeader("Authorization") authorization: String?,
        @Parameter(description = "채팅방 ID", required = true)
        @PathVariable id: String,
        @Parameter(description = "로그 인덱스", required = true)
        @RequestParam index: Int
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        return roomService.deleteOfficeRoomLog(userId, id, index)
            .map { response ->
                ResponseEntity.ok(
                    mapOf(
                        "status" to 200,
                        "message" to "해당 로그가 성공적으로 삭제되었습니다.",
                        "response" to response
                    )
                )
            }
            .defaultIfEmpty(
                ResponseEntity.status(400).body(
                    mapOf(
                        "status" to 400,
                        "message" to "로그 삭제 실패"
                    )
                )
            )
    }

    @Operation(
        summary = "캐릭터 채팅방 생성",
        description = "새로운 캐릭터 채팅방을 생성합니다."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "채팅방 생성 성공"),
        ApiResponse(responseCode = "401", description = "토큰 인증 실패"),
        ApiResponse(responseCode = "500", description = "서버 오류")
    ])
    @GetMapping("/character/{idx}")
    fun createCharacterRoom(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable idx: Int
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body<Map<String, Any>>(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body<Map<String, Any>>(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        return roomService.createCharacterRoom(userId, idx)
            .flatMap { response ->
                val id = response["Document ID"] as? String
                    ?: return@flatMap Mono.just(
                        ResponseEntity.status(500).body<Map<String, Any>>(
                            mapOf(
                                "status" to 500,
                                "message" to "id 생성 실패"
                            )
                        )
                    )

                roomService.saveCharacterRoomToMySQL(userId, idx, id)
                    .map { savedRoom ->
                        ResponseEntity.ok<Map<String, Any>>(
                            mapOf(
                                "status" to 200,
                                "message" to "채팅방이 성공적으로 생성되었습니다.",
                                "mysql_characterroom" to savedRoom
                            )
                        )
                    }
            }
            .onErrorResume { e ->
                Mono.just(
                    ResponseEntity.status(500).body<Map<String, Any>>(
                        mapOf(
                            "status" to 500,
                            "message" to "에러 발생: ${e.message}"
                        )
                    )
                )
            }
            .defaultIfEmpty(
                ResponseEntity.status(500).body<Map<String, Any>>(
                    mapOf(
                        "status" to 500,
                        "message" to "채팅방 생성에 실패했습니다."
                    )
                )
            )
    }

    @Operation(
        summary = "캐릭터 AI 응답 받기",
        description = "채팅방에서 캐릭터 AI 응답을 받습니다."
    )
    @ApiResponses(value = [
        ApiResponse(responseCode = "200", description = "응답 성공"),
        ApiResponse(responseCode = "401", description = "토큰 인증 실패")
    ])
    @PostMapping("/character/{id}/get_response")
    fun getCharacterResponse(
        @RequestHeader("Authorization") authorization: String?,
        @PathVariable id: String,
        @RequestBody inputData: Map<String, Any>
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val token = authorization
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "토큰 없음"
                    )
                )
            )

        val userId = tokenAuth.authGuard(token)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 401,
                        "message" to "유효한 토큰이 필요합니다."
                    )
                )
            )

        val inputDataSet = inputData["input_data_set"] as? String
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "input_data_set 값이 필요합니다."
                    )
                )
            )

        // characterIdx 먼저 추출
        val characterIdx = roomService.loadCharacterRoomLogs(userId, id)
            .map { logs ->
                (logs["character_idx"] as? Number)?.toLong()
            }
            .block() ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "캐릭터 정보를 찾을 수 없습니다."
                    )
                )
            )

        // character 정보 가져오기
        val character = characterService.getCharacterByIdx(characterIdx)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf(
                        "status" to 400,
                        "message" to "해당 캐릭터를 찾을 수 없습니다."
                    )
                )
            )

        // 응답 생성 및 저장
        return roomService.getCharacterResponse(
            inputDataSet = inputDataSet,
            characterName = character.characterName ?: "",
            greeting = character.greeting ?: "",
            context =character.characterSetting ?: "",
            mongodbId = id,
            userId = userId,
        ).flatMap { response ->
            roomService.addCharacterRoom(
                userid = userId,
                mongo_chatroomid = id,
                input_data_set = inputDataSet,
                output_data_set = response,
                image_set = character.image ?: ""
            ).map { result ->
                ResponseEntity.ok().body(
                    mapOf(
                        "status" to 200,
                        "message" to response
                    ) as Map<String, Any>
                )
            }.onErrorResume { e ->
                Mono.just(
                    ResponseEntity.status(422).body(
                        mapOf(
                            "status" to 422,
                            "message" to "데이터 저장 실패: ${e.message}"
                        ) as Map<String, Any>
                    )
                )
            }
        }
    }
}