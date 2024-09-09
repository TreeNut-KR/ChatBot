package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.Character
import com.TreeNut.ChatBot_Backend.service.CharacterService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import javax.servlet.http.HttpServletRequest
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

    val useridx = tokenAuth.authGuard(token)
        ?: return ResponseEntity.badRequest().body(mapOf("status" to 401, "message" to "유효한 토큰이 필요합니다."))

    val characterName = body["character_name"] as? String
        ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Character name is required"))
    val description = body["description"] as? String
        ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Description is required"))
    val greetings = body["greetings"] as? String
        ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Greetings are required"))
    val image = body["image"] as? String
        ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Image is required"))
    val characterSetting = body["character_setting"] as? String
        ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Character setting is required"))
    val accessLevel = body["accessLevel"] as? Int
        ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Access level is required"))

    // 캐릭터 객체 생성
    val newCharacter = Character(
        uuid = UUID.randomUUID().toString(),
        useridx = useridx,
        character_name = characterName,
        description = description,
        greetings = greetings,
        image = image,
        character_setting = characterSetting,
        accessLevel = accessLevel
    )

    return try {
        // 캐릭터 추가
        val registeredCharacter = characterService.addCharacter(newCharacter)

        // 성공 응답 반환
        ResponseEntity.ok(mapOf("status" to 200, "name" to registeredCharacter.character_name))
    } catch (e: Exception) {
        // 예외 발생 시 오류 메시지 반환
        ResponseEntity.status(500).body(mapOf("status" to 500, "message" to "캐릭터 추가 중 오류가 발생했습니다: ${e.message}"))
    }
}


    // 추후 구현 예정
    /*
    @PostMapping("/edit")
    fun editCharacter(@RequestBody body: Map<String, Any>): ResponseEntity<Map<String, Any>> {
        // 구현 예정
    }

    @DeleteMapping("/delete")
    fun deleteCharacter(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        // 구현 예정
    }
    */
}
