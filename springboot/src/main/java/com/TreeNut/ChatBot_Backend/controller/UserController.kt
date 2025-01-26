package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.service.UserService
import org.slf4j.LoggerFactory
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
import jakarta.servlet.http.HttpServletRequest

@RestController
@RequestMapping("/server/user")
class UserController(
    private val userService: UserService,
    private val webClientBuilder: WebClient.Builder,
    @Value("\${spring.security.oauth2.client.registration.kakao.client-id}") private val kakaoClientId: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.client-secret}") private val kakaoClientSecret: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.redirect-uri}") private val kakaoRedirectUri: String,
    @Value("\${spring.security.oauth2.client.provider.kakao.token-uri}") private val kakaoTokenUrl: String,
    @Value("\${spring.security.oauth2.client.provider.kakao.user-info-uri}") private val kakaoUserInfoUrl: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.authorization-grant-type}") private val kakaoGrantType: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.scope}") private val kakaoScope: String
) {
    private val log = LoggerFactory.getLogger(this::class.java)

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
     log.error("전체 요청 본문: $body")
        val code = body["code"]
        if (code.isNullOrEmpty()) {
            log.error("❌ 카카오 로그인 실패: 인가 코드 없음")
            return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "인가 코드 없음"))
        }

        return try {
            log.info("✅ 카카오 로그인 요청 - 인가 코드: $code")
            
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
                
            log.info("✅ 액세스 토큰 응답: $tokenResponse")

            val accessToken = tokenResponse["access_token"] as String
            
            val userInfoResponse = webClientBuilder.build()
                .get()
                .uri(kakaoUserInfoUrl)
                .header("Authorization", "Bearer $accessToken")  // Bearer 토큰 형식으로 변경
                .header("Content-type", "application/x-www-form-urlencoded;charset=utf-8")
                .retrieve()
                .bodyToMono(Map::class.java)
                .block() ?: throw RuntimeException("사용자 정보 응답이 null입니다")
                
            log.info("✅ 사용자 정보 응답: $userInfoResponse")

            val kakaoAccount = userInfoResponse["kakao_account"] as Map<*, *>
            val profile = kakaoAccount["profile"] as Map<*, *>
            val nickname = profile["nickname"] as String
            val kakaoId = userInfoResponse["id"].toString()
            log.info("✅ 사용자 정보 획득 - 닉네임: $nickname, 카카오 ID: $kakaoId")

            val user = userService.registerKakaoUser(kakaoId, nickname, null)
            val token = userService.generateToken(user)
            log.info("✅ 카카오 로그인 성공 - 사용자: $nickname, ID: $kakaoId")

            ResponseEntity.ok(mapOf(
                "status" to 200,
                "token" to token,
                "message" to "카카오 로그인 성공"
            ))
        } catch (e: Exception) {
            log.error("❌ 카카오 로그인 처리 중 에러 발생: ${e.message}", e)
            ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(mapOf("status" to 500, "message" to "서버 오류: ${e.message}"))
        }
    }

    @GetMapping("/oauth/callback/kakao")
    fun kakaoCallback(
        @RequestParam code: String,
        request: HttpServletRequest
    ): ResponseEntity<Map<String, Any>> {
        log.info("=== 카카오 콜백 디버그 로그 ===")
        log.info("요청 URL: ${request.requestURL}")
        log.info("전체 URI: ${request.requestURI}")
        log.info("인가 코드: $code")
        log.info("쿼리 스트링: ${request.queryString}")
        log.info("요청 메소드: ${request.method}")
        request.headerNames.asIterator().forEach { headerName ->
            log.info("$headerName: ${request.getHeader(headerName)}")
        }
        log.info("========================")
        
        return kakaoLogin(mapOf("code" to code))
    }
}