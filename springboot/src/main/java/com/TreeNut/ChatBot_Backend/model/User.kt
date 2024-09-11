package com.TreeNut.ChatBot_Backend.model

import jakarta.persistence.Entity
import jakarta.persistence.Table
import jakarta.persistence.Id
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Column
import java.time.LocalDateTime

@Entity
@Table(name = "users")
data class User(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val idx: Long? = null,
    val userid: String,
    val username: String,
    val email: String,
    val password: String,
    val accessToken: String? = null,
    val refreshToken: String? = null,
    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    // 기본 생성자 추가
    constructor() : this(null, "", "", "", "", null, null, LocalDateTime.now(), LocalDateTime.now())
}