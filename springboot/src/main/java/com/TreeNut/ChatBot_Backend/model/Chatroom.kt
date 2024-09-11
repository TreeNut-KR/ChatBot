package com.TreeNut.ChatBot_Backend.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "chatroom")
data class Chatroom(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chatroom_pk")
    val chatroomPk: Int? = null, // 자동 증가 ID 필드
    
    @Column(name = "users_idx", nullable = false)
    val usersIdx: Int, // 유저 ID
    
    @Column(name = "characters_pk", nullable = false)
    val charactersPk: Int, // 캐릭터의 ID
    
    @Column(name = "mongo_chatlog")
    val mongoChatlog: String? = null, // MongoDB 채팅 로그
    
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

