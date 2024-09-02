package com.TreeNut.ChatBot_Backend.model

import jakarta.persistence.Entity
import jakarta.persistence.Table
import jakarta.persistence.Id
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Column


@Entity
@Table(name = "users")
data class User(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long? = null, // ID 필드
    val username: String,
    val email: String,
    val password: String,
    val accessToken: String? = null,
    val refreshToken: String? = null,
    @Column(name = "created_at", updatable = false)
    val createdAt: java.time.LocalDateTime = java.time.LocalDateTime.now(),
    @Column(name = "updated_at")
    var updatedAt: java.time.LocalDateTime = java.time.LocalDateTime.now()
)
