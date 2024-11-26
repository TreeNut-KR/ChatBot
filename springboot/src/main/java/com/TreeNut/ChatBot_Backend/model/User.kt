package com.TreeNut.ChatBot_Backend.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val idx: Long? = null,

    @Column(name = "userid", unique = true, nullable = false, length = 50)
    val userid: String, // 플랫폼 ID 포함 (예: KAKAO_123456)

    @Column(name = "login_type", nullable = false, length = 50)
    val loginType: String, // 플랫폼 구분 (KAKAO, GOOGLE 등)

    @Column(name = "username", length = 50)
    val username: String,

    @Column(name = "email", length = 100)
    val email: String,

    @Column(name = "password", length = 255, nullable = true)
    val password: String? = null, // 소셜 로그인은 NULL 가능

    @Column(name = "access_token", columnDefinition = "TEXT")
    val accessToken: String? = null,

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    val refreshToken: String? = null,

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