package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(private val userService: UserService) {

    @PostMapping("/register")
    fun register(@RequestBody user: User): ResponseEntity<User> {
        val registeredUser = userService.register(user)
        return ResponseEntity.ok(registeredUser)
    }

    @PostMapping("/login")
    fun login(@RequestParam id: Long, @RequestParam password: String): ResponseEntity<User?> {
        val user = userService.login(id, password) // id를 Long 타입으로 전달
        return if (user != null) {
            ResponseEntity.ok(user)
        } else {
            ResponseEntity.status(401).build()
        }
    }
}
