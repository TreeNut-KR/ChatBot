package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.Character
import com.TreeNut.ChatBot_Backend.service.CharacterService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import javax.servlet.http.HttpServletRequest
import java.sql.SQLException
import org.springframework.http.HttpStatus
import io.jsonwebtoken.Jwts


@RestController
@RequestMapping("/server/character")
class CharacterController(
    private val characterService: CharacterService,
    private val tokenAuth: TokenAuth
) {

    @PostMapping("/add")
    fun addCharacter(
        @RequestBody body: Map<String, Any>,
        @RequestHeader("Authorization") authorization: String?
    ): ResponseEntity<Map<String, Any>> {
        val token = authorization
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "토큰 없음"))

        val userid = tokenAuth.authGuard(token)
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다."))

        val characterName = body["character_name"] as? String
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Character name is required"))
        val description = body["description"] as? String
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Description is required"))
        val greeting = body["greeting"] as? String
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Greeting are required"))
        val image = body["image"] as? String
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Image is required"))
        val characterSetting = body["character_setting"] as? String
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Character setting is required"))
        val accessLevel = body["accessLevel"] as? Boolean
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Access level is required"))

        // 캐릭터 객체 생성
        val newCharacter = Character(
            uuid = UUID.randomUUID().toString(),
            userid = userid,
            characterName = characterName,
            description = description,
            greeting = greeting,
            image = image,
            characterSetting = characterSetting,
            accessLevel = accessLevel
        )

        return try {
            // 캐릭터 추가
            val registeredCharacter = characterService.addCharacter(newCharacter)
            ResponseEntity.ok(mapOf("status" to 200, "name" to registeredCharacter.characterName))
        } catch (e: SQLException) {
            // SQL 관련 오류 처리
            ResponseEntity.status(500).body(mapOf("status" to 500, "message" to "SQL 오류: ${e.message}"))
        } catch (e: Exception) {
            // 일반 오류 처리
            ResponseEntity.status(500).body(mapOf("status" to 500, "message" to "캐릭터 추가 중 오류가 발생했습니다: ${e}"))
        }
    }

    @PutMapping("/edit")
    fun editCharacter(
        @RequestParam characterName: String,
        @RequestBody updatedCharacter: Character,
        @RequestHeader("Authorization") userToken: String
    ): ResponseEntity<Any> {
        return try {
            // 현재 캐릭터 찾기
            val character = characterService.getCharacterByName(characterName).firstOrNull()
                ?: return ResponseEntity.badRequest().body(mapOf("status" to 404, "message" to "Character not found"))

            // 사용자 토큰에서 userid 추출
            val claims = Jwts.parser()
                .setSigningKey("your-secret-key".toByteArray())
                .parseClaimsJws(userToken)
                .body
            val tokenUserId = claims["userId"] as String? ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "User ID is required"))

            // 캐릭터를 업데이트하기 위한 객체 생성
            val editedCharacterEntity = character.copy(
                characterName = updatedCharacter.characterName ?: character.characterName,
                description = updatedCharacter.description ?: character.description,
                greeting = updatedCharacter.greeting ?: character.greeting,
                image = updatedCharacter.image ?: character.image,
                characterSetting = updatedCharacter.characterSetting ?: character.characterSetting,
                accessLevel = updatedCharacter.accessLevel ?: character.accessLevel,
                userid = tokenUserId // 직접 가져온 userid로 설정
            )

            // 업데이트 수행
            characterService.editCharacter(characterName, editedCharacterEntity, userToken)

            ResponseEntity.ok(mapOf("status" to 200, "message" to "Character updated successfully"))
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(mapOf("status" to 401, "message" to "Authorization error: ${e.message}"))
        }
    }
}
/* 
    @DeleteMapping("/delete")
    fun deleteCharacter(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        // 구현 예정
    }
    
}*/
