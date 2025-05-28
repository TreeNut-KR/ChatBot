package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Character
import com.TreeNut.ChatBot_Backend.model.CharacterLike
import com.TreeNut.ChatBot_Backend.repository.CharacterRepository
import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import com.TreeNut.ChatBot_Backend.repository.CharacterLikeRepository
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
import java.io.File 
import java.nio.file.Paths
import java.nio.charset.StandardCharsets
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import io.jsonwebtoken.Jwts
import jakarta.servlet.http.HttpServletRequest
import reactor.core.publisher.Mono
import org.springframework.beans.factory.annotation.Value

@Service
class CharacterService(
    private val characterRepository: CharacterRepository,
    private val chatroomRepository: ChatroomRepository,
    private val characterLikeRepository: CharacterLikeRepository,
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
            accessLevel = updatedCharacter.accessLevel ?: character.accessLevel,
            updatedAt = LocalDateTime.now()
        )

        val savedCharacter = characterRepository.save(editedCharacterEntity)

        val inputDataSet= mapOf(
            "character_name" to savedCharacter.characterName,
            "description" to savedCharacter.description,
            "greeting" to savedCharacter.greeting,
            "image" to savedCharacter.image,
            "character_setting" to savedCharacter.characterSetting,
            "access_level" to savedCharacter.accessLevel
        )

        val objectMapper = com.fasterxml.jackson.databind.ObjectMapper()
        val inputDataSetJson = objectMapper.writeValueAsString(inputDataSet)

        return Mono.just(ResponseEntity.ok(inputDataSet as Map<String, Any>))
    }

    fun updateAccessLevel(character: Character, accessLevel: Boolean) {
        val updatedCharacter = character.copy(accessLevel = accessLevel)
        characterRepository.save(updatedCharacter)
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

    fun getCharacterByIdx(idx: Long): Character? {
        return characterRepository.findById(idx).orElse(null)
    }

    fun deleteCharacter(characterName: String) {
        val character = characterRepository.findByCharacterName(characterName)
            .firstOrNull() ?: throw RuntimeException("Character not found")
        // 캐릭터 삭제
        characterRepository.delete(character)
    }

    fun myCharacterList(tokenUserId: String): List<Map<String, Any>> {
        // 모든 캐릭터를 가져온 후, AccessLevel이 True인 캐릭터의 characterName만 필터링
        return characterRepository.findAll()
            .filter { it.userid == tokenUserId }
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

        // 캐릭터의 PK(idx)를 id로 사용
        val characterId = character.idx ?: return "Character id not found"

        // 이미 좋아요를 누른 유저인지 확인
        if (characterLikeRepository.existsByCharacterIdAndUserid(characterId, userid)) {
            return "You have already liked this character"
        }

        // 좋아요 추가
        characterLikeRepository.save(CharacterLike(characterId = characterId, userid = userid))

        // like_count 증가 및 저장
        val newLikeCount = (character.like_count ?: 0) + 1
        val updatedCharacter = character.copy(like_count = newLikeCount)
        characterRepository.save(updatedCharacter)
        return "Like count updated successfully for character: ${character.characterName}"
    }

    fun getLikeCount(character: Character): Int {
        val characterId = character.idx ?: return 0
        return characterLikeRepository.countByCharacterId(characterId)
    }

    fun getCharacterDetailsByName(name: String): Map<String, Any>? {
        val character = characterRepository.findByCharacterName(name).firstOrNull() ?: return null
        val likeCount = getLikeCount(character)
        return mapOf(
            "character_name" to (character.characterName ?: "Unknown"),
            "description" to (character.description ?: "No description available"),
            "image" to (character.image ?: "default_image.png"),
            "userid" to (character.userid ?: "Unknown"),
            "like_count" to likeCount
        )
    }

    fun getAllPublicCharacters(): List<Map<String, Any>> {
        // accessLevel이 true인 모든 캐릭터를 가져옴
        return characterRepository.findAll()
            .filter { it.accessLevel == true }
            .map {
                mapOf(
                    "idx" to (it.idx ?: 0),
                    "uuid" to (it.uuid ?: ""),
                    "character_name" to (it.characterName ?: ""),
                    "userid" to (it.userid ?: ""),
                    "description" to (it.description ?: ""),
                    "image" to (it.image ?: ""),
                    "like_count" to (it.like_count ?: 0),
                    "created_at" to (it.createdAt?.toString() ?: "")
                )
            }
    }
}

//이미지 업로드 서비스를 위한 클래스
@Service
class GoogleDriveService(
    @Value("\${GOOGLE_APPLICATION_CREDENTIALS_JSON_CONTENT}") private val jsonKeyContent: String
) {
    private val APPLICATION_NAME = "Chatbot Character Image"

    private val driveService: Drive by lazy {
        val jsonString = if (
            jsonKeyContent.trim().startsWith("{")
        ) {
            jsonKeyContent
        } else {
            java.nio.file.Files.readString(java.nio.file.Paths.get(jsonKeyContent.trim()))
        }

        val credentials: GoogleCredentials = try {
            val stream = ByteArrayInputStream(jsonString.toByteArray(StandardCharsets.UTF_8))
            GoogleCredentials.fromStream(stream).createScoped(listOf("https://www.googleapis.com/auth/drive.file"))
        } catch (e: Exception) {
            e.printStackTrace()
            throw RuntimeException("Failed to create GoogleCredentials from env content", e)
        }

        Drive.Builder(
            GoogleNetHttpTransport.newTrustedTransport(),
            GsonFactory.getDefaultInstance(),
            HttpCredentialsAdapter(credentials)
        ).setApplicationName(APPLICATION_NAME).build()
    }

    fun uploadImageAndGetLink(imagePath: String): String {
        val fileMetadata = DriveFile().apply {
            name = "uploaded_image.jpg"
            mimeType = "image/jpeg"
        }
    
        val filePath = java.io.File(imagePath)
        val mediaContent = FileContent("image/jpeg", filePath)
    
        val file: DriveFile = driveService.files().create(fileMetadata, mediaContent)
            .setFields("id")
            .execute()
    
        val permission = Permission()
            .setType("anyone") // ← 모든 사용자에게 공개
            .setRole("reader")

        driveService.permissions()
            .create(file.id, permission)
            .setSendNotificationEmail(false)
            .execute()
    
        return "https://lh3.googleusercontent.com/d/${file.id}=s220?authuser=0"
    }
}
