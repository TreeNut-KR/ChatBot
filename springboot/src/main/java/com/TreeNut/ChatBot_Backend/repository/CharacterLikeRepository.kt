package com.TreeNut.ChatBot_Backend.repository

import com.TreeNut.ChatBot_Backend.model.CharacterLike
import org.springframework.data.jpa.repository.JpaRepository

interface CharacterLikeRepository : JpaRepository<CharacterLike, Long> {
    fun countByCharacterId(characterId: Long): Int
    fun existsByCharacterIdAndUserid(characterId: Long, userid: String): Boolean
    fun findByCharacterIdAndUserid(characterId: Long, userid: String): CharacterLike?
}