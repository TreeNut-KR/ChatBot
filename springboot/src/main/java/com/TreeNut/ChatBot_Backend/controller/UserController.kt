package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.service.UserService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.reactive.function.client.WebClient
import reactor.core.publisher.Mono

@RestController
@RequestMapping("/server/user")
class UserController(
    private val userService: UserService,
    private val webClientBuilder: WebClient.Builder,
    @Value("\${kakao.client-id}") private val kakaoClientId: String,
    @Value("\${kakao.redirect-uri}") private val kakaoRedirectUri: String
) {

    @PostMapping("/register")
    fun register(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        val username = body["name"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Name is required"))
        val userid = body["id"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "ID is required"))
        val email = body["email"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Email is required"))
        val password = body["pw"] ?: return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "Password is required"))

        val user = User(
            userid = userid,
            loginType = "local", // 기본 회원가입은 'local'로 구분
            username = username,
            email = email,
            password = password
        )
        val registeredUser = userService.register(user)

        val token = userService.generateToken(registeredUser)
        return ResponseEntity.ok(mapOf("status" to 200, "token" to token, "name" to registeredUser.username))
    }

    @PostMapping("/social/kakao/callback")
fun kakaoLogin(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
    val tokenUrl = "https://kauth.kakao.com/oauth/token"
    val userInfoUrl = "https://kapi.kakao.com/v2/user/me"

    // Step 1: Access Token 요청
    val tokenResponse = webClientBuilder.build()
        .post()
        .uri(tokenUrl)
        .header(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded")
        .bodyValue(mapOf(
            "grant_type" to "authorization_code",
            "client_id" to kakaoClientId,
            "redirect_uri" to kakaoRedirectUri,
            "code" to (body["code"] ?: "")
        ))
        .retrieve()
        .bodyToMono(Map::class.java)
        .block() ?: return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(mapOf("message" to "Failed to fetch access token"))

    val accessToken = tokenResponse["access_token"] as? String
        ?: return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(mapOf("message" to "Access token not found"))

    // Step 2: 사용자 정보 요청
    val userInfoResponse = webClientBuilder.build()
        .get()
        .uri(userInfoUrl)
        .header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken")
        .retrieve()
        .bodyToMono(Map::class.java)
        .block() ?: return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(mapOf("message" to "Failed to fetch user info"))

    val kakaoId = userInfoResponse["id"].toString()
    val nickname = (userInfoResponse["properties"] as? Map<*, *>)?.get("nickname") as? String ?: "Anonymous"
    val email = (userInfoResponse["kakao_account"] as? Map<*, *>)?.get("email") as? String ?: ""

    // Step 3: 로그인 또는 회원가입 처리
    val user = userService.loginWithKakao(kakaoId, nickname, email)
    val token = userService.generateToken(user)

    return ResponseEntity.ok(mapOf("status" to 200, "token" to token, "name" to user.username))
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
}