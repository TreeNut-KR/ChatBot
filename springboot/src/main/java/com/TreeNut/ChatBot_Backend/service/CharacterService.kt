package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.Character
import com.TreeNut.ChatBot_Backend.repository.CharacterRepository
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.UUID

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
