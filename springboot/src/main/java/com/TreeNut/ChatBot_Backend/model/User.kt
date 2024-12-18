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
    val userid: String,

    @Column(name = "username", length = 50)
    val username: String,

    @Column(name = "email", length = 100)
    val email: String,

    @Column(name = "password", length = 255)
    val password: String,

    @Column(name = "access_token", columnDefinition = "TEXT")
    val accessToken: String? = null,

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    val refreshToken: String? = null,

    @Column(name = "manager_boolean", columnDefinition = "BOOLEAN")
    val manager_boolean: Boolean? = false,

    @Column(name = "created_at", updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    // 기본 생성자 추가
    constructor() : this(null, "", "", "", "", null, null, false,LocalDateTime.now(), LocalDateTime.now())

    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}
