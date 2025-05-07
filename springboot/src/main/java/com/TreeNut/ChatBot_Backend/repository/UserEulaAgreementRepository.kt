package com.TreeNut.ChatBot_Backend.repository

import com.TreeNut.ChatBot_Backend.model.UserEulaAgreement
import org.springframework.data.jpa.repository.JpaRepository

interface UserEulaAgreementRepository : JpaRepository<UserEulaAgreement, Long> {
    fun existsByUseridAndAgreement(userid: String, agreement: String): Boolean
}
