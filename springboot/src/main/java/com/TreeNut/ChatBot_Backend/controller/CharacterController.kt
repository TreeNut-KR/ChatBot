package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.Character
import com.TreeNut.ChatBot_Backend.service.CharacterService
import com.TreeNut.ChatBot_Backend.service.GoogleDriveService
import org.springframework.http.ResponseEntity
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.bind.annotation.*

import java.util.UUID
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import javax.servlet.http.HttpServletRequest
import java.sql.SQLException
import org.springframework.http.HttpStatus
import io.jsonwebtoken.Jwts
import org.springframework.beans.factory.annotation.Value
import java.time.LocalDateTime
import reactor.core.publisher.Mono

import java.io.File

@RestController
@RequestMapping("/server/character")
class CharacterController(
    private val characterService: CharacterService,
    private val tokenAuth: TokenAuth,
    @Value("\${jwt.secret}") private val jwtSecret: String,
    private val googleDriveService: GoogleDriveService
) {

    @PostMapping("/add")
    fun addCharacter(
        @RequestBody body: Map<String, Any>,
        @RequestHeader("Authorization") authorization: String?
    ): Mono<ResponseEntity<Map<String, Any>>> {
        // 토큰 확인
        val token = authorization?.substringAfter("Bearer ")
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음" as Any)))

        // JWT에서 사용자 ID 추출
        val userid = tokenAuth.authGuard(token)
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다." as Any)))

        // 요청 본문에서 캐릭터 속성 추출
        val characterName = body["character_name"] as? String
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Character name is required" as Any)))
        val description = body["description"] as? String
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Description is required" as Any)))
        val greeting = body["greeting"] as? String
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Greeting is required" as Any)))
        val image = body["image"] as? String
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Image is required" as Any)))
        val characterSetting = body["character_setting"] as? String
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Character setting is required" as Any)))
        val accessLevel = body["access_level"] as? Boolean
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Access level is required" as Any)))
        val tone = body["tone"] as? String
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Tone is required" as Any)))
        val energyLevel = (body["energy_level"] as? Number)?.toInt()
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Energy Level is required" as Any)))
        val politeness = (body["politeness"] as? Number)?.toInt()
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Politeness is required" as Any)))
        val humor = (body["humor"] as? Number)?.toInt()
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Humor is required" as Any)))
        val assertiveness = (body["assertiveness"] as? Number)?.toInt()
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Assertiveness is required" as Any)))

        // 캐릭터 객체 생성
        val newCharacter = Character(
            uuid = UUID.randomUUID().toString().replace("-", ""),
            userid = userid,
            characterName = characterName,
            description = description,
            greeting = greeting,
            image = image,
            characterSetting = characterSetting,
            tone = tone,
            energyLevel = energyLevel,
            politeness = politeness,
            humor = humor,
            assertiveness = assertiveness,
            accessLevel = accessLevel,
            createdAt = LocalDateTime.now(),
            updatedAt = LocalDateTime.now()
        )

        return try {
            val registeredCharacter = characterService.addCharacter(newCharacter)
        // ResponseEntity의 타입을 명확하게 지정
            Mono.just(ResponseEntity.ok(mapOf("status" to 200, "name" to registeredCharacter.characterName as Any)))
        } catch (e: Exception) {
        // ResponseEntity의 타입을 명확하게 지정
            Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("status" to 500, "message" to "Error during character addition" as Any)))
    }
    }

    @PostMapping("/addimage")
    fun addCharacterImage(
        @RequestParam("file") file: MultipartFile,
        @RequestHeader("Authorization") authorization : String?
        ): ResponseEntity<Map<String, Any>> {
            val token = authorization
            ?:return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음"))

        // 임시 파일 생성
        val tempFile = File.createTempFile("upload", file.originalFilename)
        ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Image File is required"))

        // 파일을 임시 파일로 복사
        file.inputStream.use { inputStream ->
            tempFile.outputStream().use { outputStream ->
                inputStream.copyTo(outputStream)
            }
        }

        return try {
            // GCS에 이미지 업로드
            val imageUrl = googleDriveService.uploadImageAndGetLink(tempFile.absolutePath)
            // 임시 파일 삭제
            tempFile.delete()
            ResponseEntity.ok(mapOf("status" to "success", "url" to imageUrl))
        } catch (e: Exception) {
            ResponseEntity.status(500).body(mapOf("status" to "error", "message" to (e.message ?: "An error occurred")))
        }
    }

    @PutMapping("/edit")
    fun editCharacter(
        @RequestParam characterName: String,
        @RequestBody body: Map<String, Any>,
        @RequestHeader("Authorization") userToken: String
    ): ResponseEntity<Any> {
        return try {
            // 현재 캐릭터 찾기
            val character = characterService.getCharacterByName(characterName).firstOrNull()
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 404, "message" to "Character not found"))

            // JWT에서 사용자 ID 추출
            val tokenUserId = tokenAuth.authGuard(userToken)
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다."))

            // 캐릭터를 업데이트하기 위한 객체 생성
            val editedCharacterEntity = character.copy(
                characterName = body["character_name"] as? String ?: character.characterName,
                description = body["description"] as? String ?: character.description,
                greeting = body["greeting"] as? String ?: character.greeting,
                image = body["image"] as? String ?: character.image,
                characterSetting = body["character_setting"] as? String ?: character.characterSetting,
                accessLevel = body["access_level"] as? Boolean ?: character.accessLevel,
                tone = body["tone"] as? String ?: character.tone,
                energyLevel = (body["energy_level"] as? Number)?.toInt() ?: character.energyLevel,
                politeness = (body["politeness"] as? Number)?.toInt() ?: character.politeness,
                humor = (body["humor"] as? Number)?.toInt() ?: character.humor,
                assertiveness = (body["assertiveness"] as? Number)?.toInt() ?: character.assertiveness,
                userid = tokenUserId // 직접 가져온 userid로 설정
            )

            // 업데이트 수행
            characterService.editCharacter(characterName, editedCharacterEntity, userToken)
            ResponseEntity.ok(mapOf("status" to 200, "message" to "Character updated successfully"))
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("status" to 401, "message" to "Authorization error: ${e.message}"))
        }
    }
    @DeleteMapping("/delete")
    fun deleteCharacter(
        @RequestParam characterName: String,
        @RequestHeader("Authorization") userToken: String
    ): ResponseEntity<Any> {
        return try {
            // 현재 캐릭터 찾기
            val character = characterService.getCharacterByName(characterName).firstOrNull()
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 404, "message" to "Character not found"))

            // 토큰 확인
            val token = userToken
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음"))

            // JWT에서 사용자 ID 추출
            val tokenUserId = tokenAuth.authGuard(token)
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다."))

            // 사용자 ID 검증
            if (tokenUserId != character.userid) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("status" to 403, "message" to "User is not authorized to delete this character"))
            }

            // 캐릭터 삭제 수행
            characterService.deleteCharacter(characterName)
            ResponseEntity.ok(mapOf("status" to 200, "message" to "Character deleted successfully"))
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("status" to 401, "message" to "Authorization error: ${e.message}"))
        }
    }

    @GetMapping("/OpenCharacterList")
    fun getOpenCharacterList(
    ): ResponseEntity<List<Map<String, Any>>> {
        return try {
            // 접근 가능한 캐릭터의 이름 목록 가져오기
            val accessibleCharacterNames = characterService.openCharacterList()
            ResponseEntity.ok(accessibleCharacterNames)
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(emptyList())
        }
    }

    @GetMapping("/MyCharacterList")
    fun getOpenCharacterList(
        @RequestHeader("Authorization") userToken: String
    ): ResponseEntity<Any> {
        return try {
            // 토큰 확인
            val token = userToken
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음"))

            // JWT에서 사용자 ID 추출
            val tokenUserId = tokenAuth.authGuard(token)
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다."))

            // 접근 가능한 캐릭터의 이름 목록 가져오기
            val myCharacterNames = characterService.myCharacterList(tokenUserId)
            ResponseEntity.ok(myCharacterNames)
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("status" to 401, "message" to "Authorization error: ${e.message}"))
        }
    }
    
    @GetMapping("/search")
    fun searchCharacter(@RequestParam("characterName") characterName: String): ResponseEntity<List<Map<String, Any>>> {
        val characters = characterService.searchCharacterByName(characterName)
        return if (characters.isNotEmpty()) {
            ResponseEntity.ok(characters)
        } else {
            ResponseEntity.ok(emptyList()) // 검색 결과가 없을 경우 빈 리스트 반환
        }
    }
}
