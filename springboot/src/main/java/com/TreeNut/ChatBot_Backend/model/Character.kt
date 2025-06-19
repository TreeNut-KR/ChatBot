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
    val userid: String,

    @Column(name = "character_name", nullable = false, length = 30)
    val characterName: String,

    @Column(name = "character_setting", columnDefinition = "LONGTEXT")
    val characterSetting: String? = null,

    @Column(name = "description", columnDefinition = "LONGTEXT")
    val description: String? = null,

    @Column(name = "greeting", columnDefinition = "LONGTEXT")
    val greeting: String? = null,

    @Column(name = "access_level")
    val accessLevel: Boolean? = true, // 공개여부 미선택 시 공개

    @Column(name = "image", columnDefinition = "TEXT")
    val image: String? = null,

    @Column(name = "like_count")
    var like_count: Int = 0,

    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    constructor() : this(
        idx = null,
        userid = "",
        characterName = "",
        characterSetting = null,
        description = null,
        greeting = null,
        accessLevel = true,
        image = null,
        like_count = 0,
        createdAt = LocalDateTime.now(),
        updatedAt = LocalDateTime.now()
    )

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}