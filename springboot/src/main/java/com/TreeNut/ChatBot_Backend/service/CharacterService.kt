package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Character
import com.TreeNut.ChatBot_Backend.repository.CharacterRepository
import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import com.TreeNut.ChatBot_Backend.model.Chatroom
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.UUID
import org.springframework.http.ResponseEntity
import org.springframework.http.HttpStatus
import reactor.core.scheduler.Schedulers


import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.drive.Drive
import com.google.api.services.drive.model.File as DriveFile
import com.google.api.services.drive.model.Permission
import com.google.auth.http.HttpCredentialsAdapter
import com.google.auth.oauth2.GoogleCredentials
import com.google.api.client.http.FileContent
import java.io.ByteArrayInputStream
import java.nio.file.Files
import java.nio.file.Paths
import java.nio.charset.StandardCharsets
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import io.jsonwebtoken.Jwts
import jakarta.servlet.http.HttpServletRequest
import reactor.core.publisher.Mono

@Service
class CharacterService(
    private val characterRepository: CharacterRepository,
    private val chatroomRepository: ChatroomRepository,
    private val tokenAuth: TokenAuth,
    private val roomService: RoomService 
) {

    fun addCharacter(character: Character): Character {
        return try {
            val newCharacter = character.copy(
                uuid = UUID.randomUUID().toString().replace("-", ""),
                userid = character.userid,
                createdAt = LocalDateTime.now(),
                updatedAt = LocalDateTime.now(),
                characterName = character.characterName,
                description = character.description,
                greeting = character.greeting,
                image = character.image,
                characterSetting = character.characterSetting,
                accessLevel = character.accessLevel
            )
            characterRepository.save(newCharacter)
        } catch (e: Exception) {
            throw RuntimeException("Error during character addition", e)
        }
    }

    fun BllossomIntegration(character: Character): Mono<Character> {
        val savedCharacter = characterRepository.save(character)

        val inputDataSet = mapOf(
            "character_name" to character.characterName,
            "description" to character.description,
            "greeting" to character.greeting,
            "image" to character.image,
            "character_setting" to character.characterSetting,
            "access_level" to character.accessLevel,
            "tone" to character.tone,
            "energy_level" to character.energyLevel,
            "politeness" to character.politeness,
            "humor" to character.humor,
            "assertiveness" to character.assertiveness
        )

        val objectMapper = com.fasterxml.jackson.databind.ObjectMapper()
        val inputDataSetJson = objectMapper.writeValueAsString(inputDataSet)

        return roomService.getBllossomResponse(inputDataSetJson)
            .flatMap { bllossomResponse ->
                val truncatedResponse = bllossomResponse.take(255)

                val chatroom = Chatroom(
                    userid = character.userid,
                    charactersIdx = savedCharacter.idx?.toInt() ?: 0,
                    mongo_chatroomid = truncatedResponse
                )

                Mono.fromCallable { chatroomRepository.save(chatroom) }
                    .subscribeOn(Schedulers.boundedElastic())
                    .thenReturn(savedCharacter)
            }
    }

    fun editCharacter(
        characterName: String,
        updatedCharacter: Character,
        userToken: String
    ): Mono<ResponseEntity<Map<String, Any>>> {
        val character = characterRepository.findByCharacterName(characterName)
            .firstOrNull() ?: return Mono.just(
            ResponseEntity.badRequest().body(
                mapOf<String, Any>("status" to 404, "message" to "Character not found")
            )
        )

        val tokenUserId = tokenAuth.authGuard(userToken)
            ?: return Mono.just(
                ResponseEntity.badRequest().body(
                    mapOf<String, Any>("status" to 401, "message" to "유효한 토큰이 필요합니다.")
                )
            )

        if (tokenUserId != character.userid) {
            return Mono.just(
                ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                    mapOf<String, Any>("status" to 403, "message" to "User is not authorized to edit this character")
                )
            )
        }

        val editedCharacterEntity = character.copy(
            characterName = updatedCharacter.characterName ?: character.characterName,
            description = updatedCharacter.description ?: character.description,
            greeting = updatedCharacter.greeting ?: character.greeting,
            image = updatedCharacter.image ?: character.image,
            characterSetting = updatedCharacter.characterSetting ?: character.characterSetting,
            tone = updatedCharacter.tone ?: character.tone,
            energyLevel = updatedCharacter.energyLevel ?: character.energyLevel,
            politeness = updatedCharacter.politeness ?: character.politeness,
            humor = updatedCharacter.humor ?: character.humor,
            assertiveness = updatedCharacter.assertiveness ?: character.assertiveness,
            accessLevel = updatedCharacter.accessLevel ?: character.accessLevel,
            updatedAt = LocalDateTime.now()
        )

        val savedCharacter = characterRepository.save(editedCharacterEntity)

        val inputDataSet = mapOf(
            "character_name" to savedCharacter.characterName,
            "description" to savedCharacter.description,
            "greeting" to savedCharacter.greeting,
            "image" to savedCharacter.image,
            "character_setting" to savedCharacter.characterSetting,
            "access_level" to savedCharacter.accessLevel,
            "tone" to savedCharacter.tone,
            "energy_level" to savedCharacter.energyLevel,
            "politeness" to savedCharacter.politeness,
            "humor" to savedCharacter.humor,
            "assertiveness" to savedCharacter.assertiveness
        )

        val objectMapper = com.fasterxml.jackson.databind.ObjectMapper()
        val inputDataSetJson = objectMapper.writeValueAsString(inputDataSet)

        return roomService.getBllossomResponse(inputDataSetJson)
            .flatMap { bllossomResponse ->
                val chatroom = chatroomRepository.findByUserid(savedCharacter.userid)
                    ?: Chatroom(
                        userid = savedCharacter.userid,
                        charactersIdx = savedCharacter.idx?.toInt() ?: 0
                    )

                val updatedChatroom = chatroom.copy(
                    mongo_chatroomid = bllossomResponse.take(255)
                )

                Mono.fromCallable { chatroomRepository.save(updatedChatroom) }
                    .subscribeOn(Schedulers.boundedElastic())
                    .thenReturn(
                        ResponseEntity.ok(
                            mapOf<String, Any>(
                                "status" to 200,
                                "message" to "Character updated and integrated with Bllossom successfully"
                            )
                        )
                    )
            }
            .onErrorResume { e ->
                Mono.just(
                    ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                        mapOf<String, Any>(
                            "status" to 500,
                            "message" to "Error during character update: ${e.message}"
                        )
                    )
                )
            }
    }

    fun getCharacterById(request: HttpServletRequest, characterId: Long): Character? {
        val token = request.getHeader("Authorization")
        if (token == null || !token.startsWith("Bearer ")) {
            throw IllegalArgumentException("유효한 토큰이 필요합니다.")
        }
        
        val actualToken = token.substring(7)
        val userId = tokenAuth.authGuard(actualToken)
            ?: throw IllegalArgumentException("유효하지 않은 토큰입니다.")

        return characterRepository.findById(characterId).orElse(null)
    }

    fun getCharacterByName(characterName: String): List<Character> {
        return characterRepository.findByCharacterName(characterName)
    }

    fun deleteCharacter(characterName: String) {
    val character = characterRepository.findByCharacterName(characterName)
        .firstOrNull() ?: throw RuntimeException("Character not found")
    // 캐릭터 삭제
    characterRepository.delete(character)
    }

    fun openCharacterList(): List<Map<String, Any>> {
        // 모든 캐릭터를 가져온 후, AccessLevel이 True인 캐릭터의 characterName만 필터링
        return characterRepository.findAll()
            .filter { it.accessLevel == true }
            .map {
                mapOf(
                "character_name" to (it.characterName ?: ""),
                "userid" to (it.userid ?: ""),
                "description" to (it.description ?: ""),
                "image" to (it.image ?: "")
            )
        } // characterName, userid, description만 선택하여 반환
    }

    fun myCharacterList(tokenUserId: String): List<Map<String, Any>> {
    // 모든 캐릭터를 가져온 후, AccessLevel이 True인 캐릭터의 characterName만 필터링
        return characterRepository.findAll()
            .filter {it.userid == tokenUserId}
            .map {
                mapOf(
                "character_name" to (it.characterName ?: ""),
                "userid" to (it.userid ?: ""),
                "description" to (it.description ?: ""),
                "image" to (it.image ?: "")
            )
        } // characterName, userid, description만 선택하여 반환
    }

    fun searchCharacterByName(characterName: String): List<Map<String, Any>> {
    // 캐릭터 이름으로 검색하고, accessLevel이 true인 캐릭터만 필터링
    return characterRepository.findByCharacterNameContaining(characterName)
        .filter { it.accessLevel == true } // accessLevel이 true인 캐릭터만 선택
        .map {
            mapOf(
                "character_name" to (it.characterName ?: ""),
                "userid" to (it.userid ?: ""),
                "description" to (it.description ?: ""),
                "image" to (it.image ?: "")
            )
        }
    }

    fun add_like_count(like_character: Character, userid: String): String {
        // 캐릭터 이름을 추출
        val characterName = like_character.characterName

        // 캐릭터를 이름으로 검색 (List<Character> 반환)
        val characters = characterRepository.findByCharacterName(characterName)

        // 주어진 이름과 일치하는 첫 번째 캐릭터 찾기
        val character = characters.firstOrNull() ?: return "Character not found"

        // 이미 좋아요를 누른 유저인지 확인
        val likedUsers = like_character.liked_users?.split(",")?.toMutableList() ?: mutableListOf()

        if (likedUsers.contains(userid)) {
            return "You have already liked this character"
        }

        // like_count 증가
        character.like_count = (character.like_count ?: 0) + 1

        likedUsers.add(userid)
        // 쉼표로 구분하여 문자열로 변환
        character.liked_users = likedUsers.joinToString(",")

        // 변경된 캐릭터 정보를 DB에 저장
        characterRepository.save(character)

        return "Like count updated successfully for character: $characterName"
    }

    fun getCharacterDetailsByName(name: String): Map<String, Any>? {
        val character = characterRepository.findByCharacterName(name).firstOrNull() ?: return null
        return mapOf<String, Any>(
            "character_name" to (character.characterName ?: "Unknown"), // null 처리
            "description" to (character.description ?: "No description available"), // null 처리
            "image" to (character.image ?: "default_image.png"), // null 처리
            "userid" to (character.userid ?: "Unknown"), // null 처리
            "like_count" to (character.like_count ?: 0) // null 처리
        )
    }
}
//이미지 업로드 서비스를 위한 클래스
@Service
class GoogleDriveService{
    private val APPLICATION_NAME = "Chatbot Character Image"
    //Drive 객체 초기화
    private val driveService: Drive by lazy {
        val jsonKeyFilePath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
            ?: throw RuntimeException("Environment variable GOOGLE_APPLICATION_CREDENTIALS_JSON is not set")
        val jsonKey = Files.readString(Paths.get(jsonKeyFilePath))
        
        val credentials: GoogleCredentials = try {
            // JSON 문자열을 InputStream으로 변환
            val stream = ByteArrayInputStream(jsonKey.toByteArray(StandardCharsets.UTF_8))

            // GoogleCredentials 객체 생성
            GoogleCredentials.fromStream(stream).createScoped(listOf("https://www.googleapis.com/auth/drive.file"))
        } catch (e: Exception) {
            e.printStackTrace()
            throw RuntimeException("Failed to create GoogleCredentials", e)
        }

        Drive.Builder(
            GoogleNetHttpTransport.newTrustedTransport(), 
            GsonFactory.getDefaultInstance(), 
            HttpCredentialsAdapter(credentials))
            .setApplicationName(APPLICATION_NAME)
            .build()
    }

    fun uploadImageAndGetLink(imagePath: String): String {
        val fileMetadata = DriveFile().apply {
            name = "uploaded_image.jpg" // 원하는 파일 이름
            mimeType = "image/jpeg"
        }

        val filePath = java.io.File(imagePath)
        val mediaContent = FileContent("image/jpeg", filePath)

        val file: DriveFile = driveService.files().create(fileMetadata, mediaContent)
            .setFields("id")
            .execute()

        // 파일 공유 설정 (모두에게 읽기 권한 부여)
        driveService.permissions().create(file.id, com.google.api.services.drive.model.Permission().setType("anyone").setRole("reader")).execute()

        return "https://drive.google.com/uc?id=${file.id}"
    }
}