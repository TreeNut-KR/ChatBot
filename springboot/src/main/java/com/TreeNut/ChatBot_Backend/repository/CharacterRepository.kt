package com.TreeNut.ChatBot_Backend.repository

import com.TreeNut.ChatBot_Backend.model.Character
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface CharacterRepository : JpaRepository<Character, Long> {
    fun findByCharacterName(characterName: String): List<Character>
    fun findByCharacterNameContaining(characterName: String): List<Character>
}
