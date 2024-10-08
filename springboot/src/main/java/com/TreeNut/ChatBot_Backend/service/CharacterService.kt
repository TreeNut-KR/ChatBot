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
                uuid = UUID.randomUUID().toString(),
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

        // // JWT 사용자 ID 추출
        // val claims = Jwts.parser()
        //     .setSigningKey(tokenAuth.getJwtSecret().toByteArray())  // tokenAuth에서 jwtSecret 가져오기
        //     .parseClaimsJws(userToken)
        //     .body

        // val tokenUserId = claims.subject // subject를 사용하여 사용자 ID 가져오기

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
}
