package com.TreeNut.ChatBot_Backend.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "chatroom")
data class Chatroom(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idx")
    val idx: Long? = null,

    @Column(name = "userid", nullable = false, length = 100)
    val userid: String, // 외래 키로 설정될 수 있음

    @Column(name = "characters_idx", nullable = false)
    val charactersIdx: Int, // 외래 키로 설정될 수 있음

    @Column(name = "mongo_chatroomid", length = 512)
    val mongo_chatroomid: String? = null,

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