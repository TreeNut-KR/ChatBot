package com.TreeNut.ChatBot_Backend.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "liked_characters")
data class CharacterLike(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(name = "character_id", nullable = false)
    val characterId: Long,

    @Column(name = "userid", nullable = false)
    val userid: String,
)