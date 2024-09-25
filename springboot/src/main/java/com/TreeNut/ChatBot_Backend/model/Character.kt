package com.TreeNut.ChatBot_Backend.model

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "characters")
data class Character(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val idx: Long? = null,

    @Column(name = "uuid", unique = true, nullable = false, length = 36)
    val uuid: String = UUID.randomUUID().toString(),

    @Column(name = "userid", length = 50)
    val userid: String, // 외래 키로 설정될 수 있음

    @Column(name = "characterName", nullable = false, length = 30)
    val characterName: String,

    @Column(name = "characterSetting", length = 255)
    val characterSetting: String? = null,

    @Column(name = "description", length = 255)
    val description: String? = null,

    @Column(name = "greeting", columnDefinition = "TEXT")
    val greeting: String? = null,

    @Column(name = "accesslevel")
    val accessLevel: Boolean? = null,

    @Column(name = "image")
    val image: String? = null,

    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
