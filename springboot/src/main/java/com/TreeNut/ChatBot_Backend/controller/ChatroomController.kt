package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.service.ChatroomService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/server/chatroom")
class ChatroomController(private val chatroomService: ChatroomService) {

    @PostMapping("/list")
    fun getChatroomPkByUserIdx(@RequestParam("users_idx") usersIdx: Int): ResponseEntity<Map<String, Any>> {
        val chatroomPk: Int? = chatroomService.findChatroomPkByUsersIdx(usersIdx)
        return if (chatroomPk != null) {
            ResponseEntity.ok(mapOf("chatroom_pk" to chatroomPk))
        } else {
            ResponseEntity.status(404).body(mapOf("error" to "Chatroom not found"))
        }
    }
}
