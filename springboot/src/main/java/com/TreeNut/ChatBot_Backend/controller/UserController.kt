package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.service.UserService
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.reactive.function.client.WebClient
import org.slf4j.LoggerFactory

@RestController
@RequestMapping("/server/user")
class UserController(
    private val userService: UserService,
    private val tokenAuth: TokenAuth,
    private val webClientBuilder: WebClient.Builder,
    // @Value("\${spring.security.oauth2.client.registration.google.client-id}") private val googleClientId: String,
    // @Value("\${spring.security.oauth2.client.registration.google.client-secret}") private val googleClientSecret: String,
    @Value("\${spring.security.oauth2.client.registration.google.redirect-uri}") private val googleRedirectUri: String,
    // @Value("\${spring.security.oauth2.client.provider.google.token-uri}") private val googleTokenUrl: String,
    // @Value("\${spring.security.oauth2.client.provider.google.user-info-uri}") private val googleUserInfoUrl: String,
    // @Value("\${spring.security.oauth2.client.registration.google.authorization-grant-type}") private val googleGrantType: String,
    // @Value("\${spring.security.oauth2.client.registration.google.scope}") private val googleScope: String
) {
    // logger 추가
    private val logger = LoggerFactory.getLogger(UserController::class.java)

    @PostMapping("/register")
    fun register(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        val username = body["name"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Name is required"))
        val userid = body["id"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "ID is required"))
        val email = body["email"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Email is required"))
        val password = body["pw"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Password is required"))
        val privacyPolicy = body["privacy_policy"]?.toBooleanStrictOrNull()
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Privacy policy is required"))
        val termsOfService = body["terms_of_service"]?.toBooleanStrictOrNull()
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Terms of service is required"))

        if (!privacyPolicy || !termsOfService) {
            return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "모든 필수 약관에 동의해야 합니다."))
        }

        val user = User(userid = userid, username = username, email = email, password = password)
        val registeredUser = userService.register(user)

        userService.updateUserEulaAgreement(userid, privacyPolicy, termsOfService)

        val token = tokenAuth.generateToken(registeredUser.userid)
        return ResponseEntity.ok(mapOf("status" to 200, "token" to token, "name" to registeredUser.username))
    } 

    @DeleteMapping("/{userid}")
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
            val token = tokenAuth.generateToken(user.userid)
            ResponseEntity.ok(mapOf("token" to token, "name" to user.username))
        } else {
            ResponseEntity.status(401).body(mapOf("status" to 401, "message" to "Invalid credentials"))
        }
    }

    @PostMapping("/social/kakao/login")
    fun kakaoLogin(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        val code = body["code"]
        if (code.isNullOrEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "인가 코드 없음"))
        }

        return try {
            val response = userService.kakaoLogin(code)
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("status" to 500, "message" to "서버 오류: ${e.message}"))
        }
    }

    @GetMapping("/oauth/callback/kakao")
    fun kakaoCallback(
        @RequestParam code: String,
    ): ResponseEntity<Map<String, Any>> {
        return kakaoLogin(mapOf("code" to code))
    }

    @PostMapping("/social/google/login")
    fun googleLogin(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        val code = body["code"]
        val redirectUri = body["redirect_uri"] ?: googleRedirectUri
        if (code.isNullOrEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "인가 코드 없음"))
        }
        return try {
            val response = userService.googleLogin(code, redirectUri)
            ResponseEntity.ok(response)
        } catch (e: Exception) {
            println("Google Login Error: ${e.message}")
            e.printStackTrace()
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("status" to 500, "message" to "서버 오류: ${e.message}"))
        }
    }

    @GetMapping("/social/google/redirect")
    fun googleCallback(@RequestParam code: String): ResponseEntity<Map<String, Any>> {
        return googleLogin(mapOf("code" to code))
    }
    
    @GetMapping("/findmyinfo")
    fun findUserNameandEmail(@RequestHeader("Authorization") userToken:String): ResponseEntity<Map<String, Any>> {
        val userid = userService.getUserid(userToken)
        val name = userService.getUsername(userid)
        val email = userService.getUseremail(userid)
        return ResponseEntity.ok(mapOf("name" to name, "userid" to userid,"email" to email))
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

    @GetMapping("/membership")
    fun getMembership(@RequestHeader("Authorization") userToken: String): ResponseEntity<Map<String, Any>> {
        val userid = userService.getUserid(userToken)
        val membership = userService.getMembership(userid)
        return ResponseEntity.ok(mapOf("status" to 200, "membership" to membership))
    }

    @PostMapping("/email/Verification")
    fun emailVerification(
        @RequestBody body: Map<String, String>,
        @RequestHeader("Authorization") userToken: String
    ): ResponseEntity<Map<String, Any>> {
        val userid = userService.getUserid(userToken)
        val email = body["email"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Email is required"))
        val result = userService.requestEmailVerification(email, userid)
        return ResponseEntity.ok(result)
    }

    @PostMapping("/email/verify-code")
    fun verifyEmailCode(
        @RequestBody body: Map<String, String>,
        @RequestHeader("Authorization") userToken: String
    ): ResponseEntity<Map<String, Any>> {
        val userid = userService.getUserid(userToken)
        val email = body["email"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Email is required"))
        val code = body["code"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Code is required"))
        val result = userService.verifyEmailCode(userid, email, code)
        return ResponseEntity.ok(result)
    }
}