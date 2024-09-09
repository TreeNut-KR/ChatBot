package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.Character
import org.springframework.http.ResponseEntity
import com.TreeNut.ChatBot_Backend.service.CharacterService
import org.springframework.web.bind.annotation.*
import javax.servlet.http.HttpServletResponse

@RestController
@RequestMapping("/server/character")
class CharacterController(private val characterService: CharacterService) {

    @PostMapping("/add")
    fun addCharacter(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        // 캐릭터 추가 로직 구현
        return ResponseEntity.ok(mapOf("message" to "캐릭터가 추가되었습니다."))
    }

    @PostMapping("/edit")
    fun editCharacter(@RequestBody body: Map<String, String>, response: HttpServletResponse): ResponseEntity<Map<String, Any>> {
        // 캐릭터 추가 로직 구현
        return ResponseEntity.ok(mapOf("message" to "캐릭터가 수정되었습니다."))
    }

    @DeleteMapping("/delete")
    fun deleteCharacter(@RequestBody body: Map<String, String>, response: HttpServletResponse): ResponseEntity<Map<String, Any>> {
        // 캐릭터 추가 로직 구현
        return ResponseEntity.ok(mapOf("message" to "캐릭터가 삭제되었습니다."))
    }
}
