package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.Character
import com.TreeNut.ChatBot_Backend.service.CharacterService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/server/character")
class CharacterController(private val characterService: CharacterService) {

    @PostMapping("/add")
    fun addCharacter(@RequestBody body: Map<String, Any>): ResponseEntity<Map<String, Any>> {
        val useridx = (body["useridx"] as? Number)?.toInt()
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "User ID is required"))
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
        val accessLevel = body["accessLevel"] as? String
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Access level is required"))

        val uuid = UUID.randomUUID().toString()

        // 캐릭터 객체 생성
        val newCharacter = Character(
            uuid = uuid,
            useridx = useridx,
            character_name = characterName,
            description = description,
            greetings = greetings,
            image = image,
            character_setting = characterSetting,
            accessLevel = accessLevel
        )

        // 캐릭터 추가
        val registeredCharacter = characterService.addCharacter(newCharacter)

        // 성공 응답 반환
        return ResponseEntity.ok(mapOf("status" to 200, "name" to registeredCharacter.character_name))
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
