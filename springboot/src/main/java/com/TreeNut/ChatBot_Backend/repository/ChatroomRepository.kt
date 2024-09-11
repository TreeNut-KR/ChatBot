package com.TreeNut.ChatBot_Backend.repository

import com.TreeNut.ChatBot_Backend.model.Chatroom
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ChatroomRepository : JpaRepository<Chatroom, Long> {
    fun findByUsersIdx(usersIdx: Int): Chatroom?
}
