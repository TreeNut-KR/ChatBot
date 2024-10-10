package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Character
import com.TreeNut.ChatBot_Backend.repository.CharacterRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.UUID
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
    return characterRepository.findByCharacterName(characterName)
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