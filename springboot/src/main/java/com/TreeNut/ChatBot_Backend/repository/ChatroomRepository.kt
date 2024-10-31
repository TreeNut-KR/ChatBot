package com.TreeNut.ChatBot_Backend.repository

import com.TreeNut.ChatBot_Backend.model.Chatroom
import com.TreeNut.ChatBot_Backend.model.Officeroom
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ChatroomRepository : JpaRepository<Chatroom, Long> {
    fun findByUserid(userId: String): Chatroom? // 수정된 메소드 이름

}
