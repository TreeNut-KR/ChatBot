package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.sql.SQLIntegrityConstraintViolationException

@CrossOrigin(origins = ["http://localhost:3000"])
@RestController
@RequestMapping("/server/user")
class UserController(private val userService: UserService) {

    @PostMapping("/register")
    fun register(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        val username = body["name"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Name is required"))
        val userid = body["id"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "ID is required"))
        val email = body["email"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Email is required"))
        val password = body["pw"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Password is required"))
        
        val user = User(userid = userid, username = username, email = email, password = password)
        val registeredUser = userService.register(user)

        val token = userService.generateToken(registeredUser)
        return ResponseEntity.ok(mapOf("status" to 200, "token" to token, "name" to registeredUser.username))
    }

    @DeleteMapping("/delete/{userid}")
    fun deleteUser(@PathVariable userid: String): ResponseEntity<Map<String, Any>> {
        val isDeleted = userService.deleteUser(userid)
        return if (isDeleted) {
            ResponseEntity.ok(mapOf("status" to 200, "message" to "User deleted successfully"))
        } else {
            ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "User not found"))
        }
    }

    @PostMapping("/login")
    fun login(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        val userid = body["id"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "ID is required"))
        val password = body["pw"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Password is required"))

        val user = userService.login(userid, password)
        return if (user != null) {
            val token = userService.generateToken(user)
            ResponseEntity.ok(mapOf("token" to token, "name" to user.username))
        } else {
            ResponseEntity.status(401).body(mapOf("status" to 401, "message" to "Invalid credentials"))
        }
    }

    @GetMapping("/findmyinfo")
    fun findUserNameandEmail(@RequestHeader("Authorization") userToken:String): ResponseEntity<Map<String, Any>> {
        val userid = userService.getUserid(userToken)
        val name = userService.getUsername(userid)
        val email = userService.getUseremail(userid)
        return ResponseEntity.ok(mapOf("name" to name, "email" to email))
    }

    @PostMapping("/changeUsername")
    fun updateUserInfo(@RequestBody body: Map<String, String>, @RequestHeader("Authorization") userToken:String): ResponseEntity<Map<String, Any>> {
        val userid = userService.getUserid(userToken)
        val username = body["name"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Name is required"))
        
        return try {
            val updatedUser = userService.updateUserInfo(userid, username)
            ResponseEntity.ok(mapOf("status" to 200, "message" to "User information updated successfully"))
        } catch (e: Exception) {
            ResponseEntity.status(500).body(mapOf("status" to 500, "message" to "Internal server error"))
        }
    }
}
