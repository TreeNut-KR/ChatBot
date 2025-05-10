package com.TreeNut.ChatBot_Backend.model

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "user_eula_agreements")
data class UserEulaAgreement(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val userid: String,

    @Column(nullable = false)
    val privacy_policy: Boolean = true,

    @Column(nullable = false)
    val terms_of_service: Boolean = true,

    @Column(nullable = false)
    val agreedat: LocalDateTime = LocalDateTime.now()
)
