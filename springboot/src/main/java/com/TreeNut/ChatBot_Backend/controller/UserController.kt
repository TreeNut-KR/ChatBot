package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.service.UserService
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.util.LinkedMultiValueMap
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.BodyInserters
import jakarta.servlet.http.HttpServletRequest
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import org.springframework.web.reactive.function.client.WebClientResponseException

@RestController
@RequestMapping("/server/user")
class UserController(
    private val userService: UserService,
    private val tokenAuth: TokenAuth,
    private val webClientBuilder: WebClient.Builder,
    @Value("\${spring.security.oauth2.client.registration.google.client-id}") private val googleClientId: String,
    @Value("\${spring.security.oauth2.client.registration.google.client-secret}") private val googleClientSecret: String,
    @Value("\${spring.security.oauth2.client.registration.google.redirect-uri}") private val googleRedirectUri: String,
    @Value("\${spring.security.oauth2.client.provider.google.token-uri}") private val googleTokenUrl: String,
    @Value("\${spring.security.oauth2.client.provider.google.user-info-uri}") private val googleUserInfoUrl: String,
    @Value("\${spring.security.oauth2.client.registration.google.authorization-grant-type}") private val googleGrantType: String,
    @Value("\${spring.security.oauth2.client.registration.google.scope}") private val googleScope: String
) {
    @PostMapping("/register")
    fun register(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        val username = body["name"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Name is required"))
        val userid = body["id"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "ID is required"))
        val email = body["email"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Email is required"))
        val password = body["pw"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Password is required"))

        val user = User(userid = userid, username = username, email = email, password = password)
        val registeredUser = userService.register(user)

        val token = tokenAuth.generateToken(registeredUser.userid)
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
        if (code.isNullOrEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "인가 코드 없음"))
        }

        return try {
            val formData = LinkedMultiValueMap<String, String>().apply {
                add("grant_type", googleGrantType)
                add("client_id", googleClientId)
                add("client_secret", googleClientSecret)
                add("redirect_uri", googleRedirectUri)
                add("code", code)
                add("scope", "https://www.googleapis.com/auth/userinfo.email profile openid")
            }

            val tokenResponse = webClientBuilder.build()
                .post()
                .uri(googleTokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData(formData))
                .retrieve()
                .bodyToMono(Map::class.java)
                .block() ?: throw RuntimeException("토큰 응답이 null입니다")

            val accessToken = tokenResponse["access_token"] as String
            
            val userInfoResponse = webClientBuilder.build()
                .get()
                .uri(googleUserInfoUrl)
                .header("Authorization", "Bearer $accessToken")
                .header("Content-type", "application/x-www-form-urlencoded;charset=utf-8")
                .retrieve()
                .bodyToMono(Map::class.java)
                .block() ?: throw RuntimeException("사용자 정보 응답이 null입니다")
                
            val nickname = userInfoResponse["name"] as String
            val googleId = userInfoResponse["sub"].toString()

            val user = userService.registerGoogleUser(googleId, nickname, null)
            val token = tokenAuth.generateToken(user.userid)

            ResponseEntity.ok(mapOf(
                "status" to 200,
                "token" to token,
                "message" to "구글 로그인 성공"
            ))
        } catch (e: Exception) {
            if (e is WebClientResponseException) {
                val statusCode = e.rawStatusCode
                val statusText = e.statusText
                val responseBody = e.responseBodyAsString
            }
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("status" to 500, "message" to "서버 오류: ${e.message}"))
        }
    }

    @GetMapping("/oauth/callback/google")
    fun googleCallback(
        @RequestParam code: String,
    ): ResponseEntity<Map<String, Any>> {
        return googleLogin(mapOf("code" to code))
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

    @GetMapping("/membership")
    fun getMembership(@RequestHeader("Authorization") userToken: String): ResponseEntity<Map<String, Any>> {
        val userid = userService.getUserid(userToken)
        val membership = userService.getMembership(userid)
        return ResponseEntity.ok(mapOf("status" to 200, "membership" to membership))
    }

    @PostMapping("/membership/update")
    fun updateMembership(
        @RequestHeader("Authorization") userToken: String,
        @RequestBody body: Map<String, String>
    ): ResponseEntity<Map<String, Any>> {
        val userid = userService.getUserid(userToken)
        val newMembership = body["membership"]
            ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Membership is required"))

        return try {
            val updatedUser = userService.updateMembership(userid, newMembership)
            ResponseEntity.ok(mapOf("status" to 200, "message" to "Membership updated successfully", "membership" to updatedUser.membership))
        } catch (e: IllegalArgumentException) {
            ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Invalid membership type"))
        } catch (e: Exception) {
            ResponseEntity.status(500).body(mapOf("status" to 500, "message" to "Internal server error"))
        }
    }
}