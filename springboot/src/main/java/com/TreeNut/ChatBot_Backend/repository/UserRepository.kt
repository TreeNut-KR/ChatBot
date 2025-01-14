package com.TreeNut.ChatBot_Backend.repository

import com.TreeNut.ChatBot_Backend.model.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun findByUserid(userid: String): User?
    fun deleteByUserid(userid: String)
}