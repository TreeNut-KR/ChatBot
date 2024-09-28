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

@Service
class CharacterService(
    private val characterRepository: CharacterRepository
) {

    fun addCharacter(character: Character): Character {
        return try {
            // UUID를 자동 생성하여 할당하고, 다른 프로퍼티를 설정하여 새 캐릭터 생성
            val newCharacter = character.copy(
                uuid = UUID.randomUUID().toString(),
                useridx = character.useridx,
                createdAt = LocalDateTime.now(), // 생성 시점 설정
                updatedAt = LocalDateTime.now(), // 수정 시점 초기화
                character_name = character.character_name,
                description = character.description,
                greeting = character.greeting,
                image = character.image,
                character_setting = character.character_setting,
                accessLevel = character.accessLevel
            )
            characterRepository.save(newCharacter)

        } catch (e: Exception) {
            throw RuntimeException("Error during character addition", e)
        }
    }

    /*fun editCharacter(idx: Long, updatedCharacter: Character): Character? {
        val existingCharacter = characterRepository.findById(idx).orElse(null) ?: return null
        return try {
            val characterToUpdate = existingCharacter.copy(
                useridx = updatedCharacter.useridx,
                character_name = updatedCharacter.character_name,
                description = updatedCharacter.description,
                greeting = updatedCharacter.greeting,
                image = updatedCharacter.image,
                character_setting = updatedCharacter.character_setting,
                accessLevel = updatedCharacter.accessLevel
            )
            characterRepository.save(characterToUpdate)
        } catch (e: Exception) {
            throw RuntimeException("Error during character update", e)
        }
    }

    fun deleteCharacter(idx: Long): Boolean {
        return try {
            if (characterRepository.existsById(idx)) {
                characterRepository.deleteById(idx)
                true
            } else {
                false
            }
        } catch (e: Exception) {
            throw RuntimeException("Error during character deletion", e)
        }
    }

    fun getAllCharacters(): List<Character> {
        return characterRepository.findAll()
    }

    fun getCharacterById(idx: Long): Character? {
        return characterRepository.findById(idx).orElse(null)
    }*/
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