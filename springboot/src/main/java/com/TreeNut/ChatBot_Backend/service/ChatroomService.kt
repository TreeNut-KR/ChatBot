package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.repository.ChatroomRepository
import org.springframework.stereotype.Service

@Service
class ChatroomService(private val chatroomRepository: ChatroomRepository) {

    fun findChatroomPkByUsersIdx(usersIdx: Int): Int? {
        val chatroom = chatroomRepository.findByUsersIdx(usersIdx)
        return chatroom?.chatroomPk
    }
}
