package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.service.UserService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.util.LinkedMultiValueMap
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.BodyInserters

@RestController
@RequestMapping("/server/user")
class UserController(
    private val userService: UserService,
    private val webClientBuilder: WebClient.Builder,
    @Value("\${spring.security.oauth2.client.registration.kakao.client-id}") private val kakaoClientId: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.client-secret}") private val kakaoClientSecret: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.redirect_uri}") private val kakaoRedirectUri: String,
    @Value("\${kakao.token.url}") private val kakaoTokenUrl: String,
    @Value("\${kakao.user-info.url}") private val kakaoUserInfoUrl: String,
    @Value("\${kakao.auth.grant-type}") private val kakaoGrantType: String,
    @Value("\${kakao.auth.scope}") private val kakaoScope: String
    ) {

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

   @PostMapping("/social/kakao/login")
fun kakaoLogin(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
    val code = body["code"]
    if (code.isNullOrEmpty()) {
        println("❌ 카카오 로그인 실패: 인가 코드 없음")
        return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "인가 코드 없음"))
    }

    return try {
        println("✅ 카카오 로그인 요청 - 인가 코드: $code")
        
        val formData = LinkedMultiValueMap<String, String>().apply {
            add("grant_type", kakaoGrantType)
            add("client_id", kakaoClientId)
            add("client_secret", kakaoClientSecret)
            add("redirect_uri", kakaoRedirectUri)
            add("code", code)
            add("scope", kakaoScope)
        }

        val tokenResponse = webClientBuilder.build()
            .post()
            .uri(kakaoTokenUrl)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(BodyInserters.fromFormData(formData))
            .retrieve()
            .bodyToMono(Map::class.java)
            .block() ?: throw RuntimeException("토큰 응답이 null입니다")

        val accessToken = tokenResponse["access_token"] as String
        
        val userInfoResponse = webClientBuilder.build()
            .get()
            .uri(kakaoUserInfoUrl)
            .header("Authorization", "Bearer $accessToken")
            .retrieve()
            .bodyToMono(Map::class.java)
            .block() ?: throw RuntimeException("사용자 정보 응답이 null입니다")

        val kakaoAccount = userInfoResponse["kakao_account"] as Map<*, *>
        /* val email = kakaoAccount["email"] as? String 비즈니스 계정이 아니라 email 권한이 없어서 임시로 막아둠*/
        val profile = kakaoAccount["profile"] as Map<*, *>
        val nickname = profile["nickname"] as String
        val kakaoId = userInfoResponse["id"].toString()

        val user = userService.registerKakaoUser(kakaoId, nickname, null)
        val token = userService.generateToken(user)

        ResponseEntity.ok(mapOf(
            "status" to 200,
            "token" to token,
            "message" to "카카오 로그인 성공"
        ))
    } catch (e: Exception) {
        println("❌ 카카오 로그인 처리 중 에러 발생: ${e.message}")
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(mapOf("status" to 500, "message" to "서버 오류: ${e.message}"))
    }
}
}