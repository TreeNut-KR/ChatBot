package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import javax.servlet.http.HttpServletResponse

@RestController
@RequestMapping("/server/character")
class UserController(private val userService: UserService) {

    @PutMapping("/add")
    fun character_add(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        
        val token = userService.generateToken(registeredUser)
        return ResponseEntity.ok(mapOf("status" to 200, "token" to token, "name" to registeredUser.username))
    }

    @PostMapping("/edit")
    fun character_edit(@RequestBody body: Map<String, String>, response: HttpServletResponse): ResponseEntity<Map<String, Any>> {

        
        return if (user != null) {
            val token = userService.generateToken(user)
            ResponseEntity.ok(mapOf("token" to token, "name" to user.username))
        } else {
            ResponseEntity.status(401).body(mapOf("status" to 401, "message" to "Invalid credentials"))
        }
    }

     @DeleteMapping("/delete")
    fun character_delete(@RequestBody body: Map<String, String>, response: HttpServletResponse): ResponseEntity<Map<String, Any>> {

        return if (user != null) {
            val token = userService.generateToken(user)
            ResponseEntity.ok(mapOf("token" to token, "name" to user.username))
        } else {
            ResponseEntity.status(401).body(mapOf("status" to 401, "message" to "Invalid credentials"))
        }
    }
}