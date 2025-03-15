package com.TreeNut.ChatBot_Backend.repository

import com.TreeNut.ChatBot_Backend.model.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.transaction.annotation.Transactional

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun findByUserid(userid: String): User?
    fun deleteByUserid(userid: String)
}