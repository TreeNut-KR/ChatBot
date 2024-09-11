package com.TreeNut.ChatBot_Backend.model

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "characters")
data class Character(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // 자동 생성 설정
    @Column(name = "idx")
    val idx: Long? = null,

    val uuid: String = UUID.randomUUID().toString(), // UUID 자동 생성
    val useridx: Long, // 사용자의 ID
    val character_name: String, // 캐릭터 이름
    val description: String, // 캐릭터 한줄 설명
    val greeting: String, // 첫 인사말
    val image: String, // 이미지 링크
    val character_setting: String, // 캐릭터 설정
    val accessLevel: Boolean, // 접근 가능 여부

    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(), // 생성 일시

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now() // 수정 일시
) {
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now() // 수정 시점 업데이트
    }
}
