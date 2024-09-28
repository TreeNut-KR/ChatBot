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
    val uuid: String? = UUID.randomUUID().toString(),

    @Column(name = "userid", length = 50)
    val userid: String = "", // 기본 생성자에서 빈 문자열로 초기화

    @Column(name = "character_name", nullable = false, length = 30)
    val characterName: String = "", // 기본 생성자에서 빈 문자열로 초기화

    @Column(name = "character_setting", length = 255)
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
    constructor() : this( // 기본 생성자 추가
        idx = null,
        uuid = null,
        userid = "",
        characterName = "",
        characterSetting = null,
        description = null,
        greeting = null,
        accessLevel = null,
        image = null,
        createdAt = LocalDateTime.now(),
        updatedAt = LocalDateTime.now()
    )

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}