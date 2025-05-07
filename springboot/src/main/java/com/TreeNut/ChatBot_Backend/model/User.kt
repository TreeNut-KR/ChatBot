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
    val password: String? = null,

    @Column(name = "access_token", columnDefinition = "TEXT")
    val accessToken: String? = null,

    @Column(name = "refresh_token", columnDefinition = "TEXT")
    val refreshToken: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "login_type", nullable = false)
    val loginType: LoginType = LoginType.LOCAL,

    @Column(name = "manager_boolean", nullable = false)
    val manager_boolean: Boolean = false,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "membership", nullable = false)
    val membership: MembershipType = MembershipType.BASIC,

    // @Column(name = "chatlog_agree", nullable = false)
    // val chatlog_agree: Boolean = true,

    // @Column(name = "user_setting_agree", nullable = false)
    // val user_setting_agree: Boolean = true,

    @Column(name = "created_at")
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at")
    var updatedAt: LocalDateTime = LocalDateTime.now()
) {
    // constructor() : this(null, "", "", "", null, null, null, LoginType.LOCAL, false, MembershipType.BASIC, true, true, LocalDateTime.now(), LocalDateTime.now())
    constructor() : this(null, "", "", "", null, null, null, LoginType.LOCAL, false, MembershipType.BASIC, LocalDateTime.now(), LocalDateTime.now())
    @PreUpdate
    fun onUpdate() {
        updatedAt = LocalDateTime.now()
    }
}

enum class LoginType {
    LOCAL,
    KAKAO,
    GOOGLE
}

enum class MembershipType {
    BASIC,
    VIP
}