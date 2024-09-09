package com.TreeNut.ChatBot_Backend.model

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "characters")
data class Character(
    @Id
    @Column(name = "idx", columnDefinition = "CHAR(36)")
    val idx: String = UUID.randomUUID().toString(), // UUID로 자동 생성되는 ID 필드
    val creater: Int, // 사용자의 ID
    val name: String, // 캐릭터 이름
    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(), // 생성 일시
    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now() // 수정 일시
) {
    // 추가적인 메서드나 로직이 필요하면 여기에 작성
}
