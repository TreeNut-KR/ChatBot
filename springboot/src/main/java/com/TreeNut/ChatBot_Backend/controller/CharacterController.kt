package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.Character
import com.TreeNut.ChatBot_Backend.repository.UserRepository
import com.TreeNut.ChatBot_Backend.service.CharacterService
import com.TreeNut.ChatBot_Backend.service.GoogleDriveService
import org.springframework.http.ResponseEntity
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.bind.annotation.*

import java.util.UUID
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import jakarta.servlet.http.HttpServletRequest
import java.sql.SQLException
import org.springframework.http.HttpStatus
import io.jsonwebtoken.Jwts
import org.springframework.beans.factory.annotation.Value
import java.time.LocalDateTime
import reactor.core.publisher.Mono

import java.io.File
import javax.imageio.ImageIO
import org.springframework.beans.factory.annotation.Autowired
import java.nio.file.Files

@RestController
@RequestMapping("/server/character")
class CharacterController(
    private val characterService: CharacterService,
    private val tokenAuth: TokenAuth,
    @Value("\${jwt.secret}") private val jwtSecret: String,
    private val googleDriveService: GoogleDriveService,
    private val userRepository: UserRepository
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
        val characterSetting = body["character_setting"] as? String
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Character setting is required" as Any)))
        val accessLevel = body["access_level"] as? Boolean
            ?: return Mono.just(ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Access level is required" as Any)))

        // 이미지 URL 설정
        val imageUrl = body["image"] as? String

        return try {
            // 캐릭터 객체 생성
            val newCharacter = Character(
                uuid = UUID.randomUUID().toString().replace("-", ""),
                userid = userid,
                characterName = characterName,
                description = description,
                greeting = greeting,
                image = imageUrl,
                characterSetting = characterSetting,
                accessLevel = accessLevel,
                createdAt = LocalDateTime.now(),
                updatedAt = LocalDateTime.now()
            )

            val registeredCharacter = characterService.addCharacter(newCharacter)
            Mono.just(ResponseEntity.ok(mapOf("status" to 200, "name" to registeredCharacter.characterName as Any)))
        } catch (e: Exception) {
            e.printStackTrace() // 예외 로그 출력
            println("Error details: ${e.message}") // 예외 메시지 출력
            Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("status" to 500, "message" to "Error during character addition: ${e.message}" as Any)))
        }
    }

    @PostMapping("/add_image")
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
        @RequestParam character_name: String,
        @RequestBody body: Map<String, Any>,
        @RequestHeader("Authorization") userToken: String
    ): ResponseEntity<Any> {
        return try {
            // 현재 캐릭터 찾기
            val character = characterService.getCharacterByName(character_name).firstOrNull()
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
                userid = tokenUserId // 직접 가져온 userid로 설정
            )

            // 업데이트 수행
            characterService.editCharacter(character_name, editedCharacterEntity, userToken)
            ResponseEntity.ok(mapOf("status" to 200, "message" to "Character updated successfully"))
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("status" to 401, "message" to "Authorization error: ${e.message}"))
        }
    }

    @DeleteMapping("/delete")
    fun deleteCharacter(
        @RequestParam character_name: String,
        @RequestHeader("Authorization") userToken: String
    ): ResponseEntity<Any> {
        return try {
            // 현재 캐릭터 찾기
            val character = characterService.getCharacterByName(character_name).firstOrNull()
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
            characterService.deleteCharacter(character_name)
            ResponseEntity.ok(mapOf("status" to 200, "message" to "Character deleted successfully"))
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("status" to 401, "message" to "Authorization error: ${e.message}"))
        }
    }

    @PutMapping("/manage_character_private")
    fun manage_character_private(
        @RequestParam character_name: String,
        @RequestBody body: Map<String, Any>,
        @RequestHeader("Authorization") userToken: String
    ): ResponseEntity<Any> {
        return try {
            // 현재 캐릭터 찾기
            val character = characterService.getCharacterByName(character_name).firstOrNull()
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 404, "message" to "Character not found"))

            // JWT에서 사용자 ID 추출
            val tokenUserId = tokenAuth.authGuard(userToken)
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다."))

            val user = userRepository.findByUserid(tokenUserId.toString())

            if(user?.manager_boolean != true)
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(mapOf("status" to 403, "message" to "권한이 없습니다. 관리자만 접근할 수 있습니다."))

            // 캐릭터를 업데이트하기 위한 객체 생성
            val editedCharacterEntity = character.copy(
                characterName = character.characterName,
                description = character.description,
                greeting = character.greeting,
                image = character.image,
                characterSetting = character.characterSetting,
                accessLevel = body["access_level"] as? Boolean ?: character.accessLevel,
                userid = character.userid
            )

            // 업데이트 수행
            characterService.editCharacter(character_name, editedCharacterEntity, userToken)
            ResponseEntity.ok(mapOf("status" to 200, "message" to "Character updated successfully"))
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("status" to 401, "message" to "Authorization error: ${e.message}"))
        }
    }

    @GetMapping("/open_character_list")
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

    @GetMapping("/my_character_list")
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
    fun searchCharacter(@RequestParam("character_name") characterName: String): ResponseEntity<List<Map<String, Any>>> {
        val characters = characterService.searchCharacterByName(characterName)
        return if (characters.isNotEmpty()) {
            ResponseEntity.ok(characters)
        } else {
            ResponseEntity.ok(emptyList()) // 검색 결과가 없을 경우 빈 리스트 반환
        }
    }

    @GetMapping("/add_like_count")
    fun AddLikeCount(
        @RequestParam character_name: String,
        @RequestHeader("Authorization") userToken: String
    ): ResponseEntity<Any> {
        return try {
            // 현재 캐릭터 찾기
            val character = characterService.getCharacterByName(character_name).firstOrNull()
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 404, "message" to "Character not found"))

            // 토큰 확인
            val token = userToken
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음"))

            // JWT에서 사용자 ID 추출
            val tokenUserId = tokenAuth.authGuard(token)
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다."))


            // 캐릭터 좋아요 추가 수행 수행
            characterService.add_like_count(character, tokenUserId)
            ResponseEntity.ok(mapOf("status" to 200, "message" to "Character add like successfully"))
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("status" to 401, "message" to "Authorization error: ${e.message}"))
        }
    }

    @GetMapping("/details/{name}")
    fun getCharacterDetailsByName(@PathVariable name: String): ResponseEntity<Map<String, Any>> {
        val character = characterService.getCharacterDetailsByName(name)
            ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("message" to "Character not found"))
        return ResponseEntity.ok(character)
    }

    @GetMapping("/details/idx/{idx}")
    fun getCharacterDetailsByIdx(
        @PathVariable idx: Long
    ): ResponseEntity<Any> {
        return try {
            val character = characterService.getCharacterByIdx(idx)
                ?: return ResponseEntity.status(HttpStatus.NOT_FOUND).body(mapOf("status" to 404, "message" to "Character not found"))

            ResponseEntity.ok(character)
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf("status" to 500, "message" to "Error retrieving character details: ${e.message}"))
        }
    }

    // 추가 테스트 엔드포인트
    @GetMapping("/test")
    fun testEndpoint(): ResponseEntity<Map<String, Any>> {
        println("CharacterController - /test 엔드포인트 호출됨")
        return ResponseEntity.ok(mapOf(
            "status" to "success",
            "message" to "API is working",
            "timestamp" to System.currentTimeMillis()
        ))
    }

    @PostMapping("/upload_image")
    fun uploadCharacterImage(
        @RequestParam("file") file: MultipartFile,
        @RequestHeader("Authorization") authorization: String?
    ): ResponseEntity<Map<String, Any>> {
        val token = authorization?.substringAfter("Bearer ")
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음"))

        // JWT에서 사용자 ID 추출
        val userid = tokenAuth.authGuard(token)
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다."))

        // 파일 확장자 확인
        if (file.contentType != "image/png") {
            return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Only PNG files are allowed"))
        }

        // 임시 파일 생성
        val tempFile = File.createTempFile("upload", ".png")
        file.inputStream.use { inputStream ->
            tempFile.outputStream().use { outputStream ->
                inputStream.copyTo(outputStream)
            }
        }

        return try {
            // Google Drive에 이미지 업로드
            val imageUrl = googleDriveService.uploadImageAndGetLink(tempFile.absolutePath)
            // 임시 파일 삭제
            tempFile.delete()
            ResponseEntity.ok(mapOf("status" to "success", "url" to imageUrl))
        } catch (e: Exception) {
            ResponseEntity.status(500).body(mapOf("status" to "error", "message" to (e.message ?: "An error occurred")))
        }
    }

    @PostMapping("/upload_png_image")
    fun uploadCharacterImage(
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<Map<String, Any>> {
        return try {
            // 임시 파일로 저장
            val tempFile = Files.createTempFile("upload_", ".png").toFile()
            file.transferTo(tempFile)
            // 구글 드라이브 업로드
            val imageUrl = googleDriveService.uploadImageAndGetLink(tempFile.absolutePath)
            tempFile.delete() // 임시 파일 삭제
            ResponseEntity.ok(mapOf("status" to "success", "url" to imageUrl))
        } catch (e: Exception) {
            ResponseEntity.status(500).body(mapOf("status" to "fail", "message" to (e.message ?: "이미지 업로드 실패")))
        }
    }

    @GetMapping("/public")
    fun getAllPublicCharacters(): ResponseEntity<Any> {
        return try {
            val publicCharacters = characterService.getAllPublicCharacters()
            if (publicCharacters.isEmpty()) {
                ResponseEntity.ok(mapOf(
                    "status" to 200,
                    "message" to "No public characters found",
                    "data" to emptyList<Map<String, Any>>()
                ))
            } else {
                // CharacterChat 페이지에서 사용할 데이터 형식으로 변환
                val characterData = publicCharacters.map { character ->
                    val username = userRepository.findByUserid(character["userid"] as String)?.username ?: "Unknown"
                    mapOf(
                        "characterName" to character["character_name"],
                        "description" to character["description"],
                        "image" to character["image"],
                        "creator" to username, // username을 반환
                        "uuid" to character["uuid"],
                        "idx" to character["idx"],
                    )
                }
                ResponseEntity.ok(mapOf(
                    "status" to 200,
                    "message" to "Public characters retrieved successfully",
                    "data" to characterData
                ))
            }
        } catch (e: Exception) {
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("status" to 500, "message" to "Error retrieving public characters: ${e.message}"))
        }
    }
}