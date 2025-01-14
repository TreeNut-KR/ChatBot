package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Character
import com.TreeNut.ChatBot_Backend.repository.CharacterRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.UUID

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
import javax.servlet.http.HttpServletRequest

@Service
class CharacterService(
    private val characterRepository: CharacterRepository,
    private val tokenAuth: TokenAuth
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
    ): Character {
        val character = characterRepository.findByCharacterName(characterName)
            .firstOrNull() ?: throw RuntimeException("Character not found")

        val token = userToken
        val tokenUserId = tokenAuth.authGuard(token)

        // 사용자 ID 검증
        if (tokenUserId != character.userid) {
            throw RuntimeException("User is not authorized to edit this character")
        }

        val editedCharacterEntity = character.copy(
            characterName = updatedCharacter.characterName ?: character.characterName,
            description = updatedCharacter.description ?: character.description,
            greeting = updatedCharacter.greeting ?: character.greeting,
            image = updatedCharacter.image ?: character.image,
            characterSetting = updatedCharacter.characterSetting ?: character.characterSetting,
            accessLevel = updatedCharacter.accessLevel ?: character.accessLevel
        )

        return characterRepository.save(editedCharacterEntity)
    }

    fun getCharacterById(request: HttpServletRequest, characterId: Long): Character? {
        val token = request.getHeader("Authorization")?.substring(7)
        val userId = token?.let { tokenAuth.authGuard(it) }

        if (userId == null) {
            throw IllegalArgumentException("유효하지 않은 토큰입니다.")
        }

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
                "characterName" to (it.characterName ?: ""),
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
                "characterName" to (it.characterName ?: ""),
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
                "characterName" to (it.characterName ?: ""),
                "userid" to (it.userid ?: ""),
                "description" to (it.description ?: ""),
                "image" to (it.image ?: "")
            )
        }
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