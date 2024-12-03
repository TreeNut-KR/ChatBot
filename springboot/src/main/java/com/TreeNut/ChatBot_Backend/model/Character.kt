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

    @Column(name = "character_name", nullable = false, length = 30)
    val characterName: String,

    @Column(name = "character_setting", length = 255)
    val characterSetting: String? = null,

    @Column(name = "tone", length = 30)
    val tone: String? = null, // 예: "공손한", "유쾌한", "단호한"

    @Column(name = "energy_level")
    val energyLevel: Int? = null, // 에너지 수준 (1~10): 낮음(1) ~ 높음(10)

    @Column(name = "politeness")
    val politeness: Int? = null, // 공손함 (1~10): 비공손(1) ~ 매우 공손(10)

    @Column(name = "humor")
    val humor: Int? = null, // 유머 감각 (1~10): 진지(1) ~ 유머러스(10)

    @Column(name = "assertiveness")
    val assertiveness: Int? = null, // 단호함 (1~10): 온화(1) ~ 단호(10)

    @Column(name = "description", length = 255)
    val description: String? = null,

    @Column(name = "greeting", columnDefinition = "TEXT")
    val greeting: String? = null,

    @Column(name = "accessLevel")
    val accessLevel: Boolean? = true, // 공개여부 미선택 시 공개

    @Column(name = "image")
    val image: String? = null,

    @Column(name = "like_count")
    var like_count: Int = 0,

    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
)  {
    constructor() : this( // 기본 생성자 추가
        idx = null,
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