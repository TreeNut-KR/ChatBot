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
import org.slf4j.LoggerFactory

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
    @Value("\${spring.security.oauth2.client.registration.google.scope}") private val googleScope: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.redirect-uri}") private val kakaoRedirectUri: String
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
    val redirectUri = body["redirect_uri"] ?: kakaoRedirectUri // 프론트에서 전달받은 값 우선 사용
    if (code.isNullOrEmpty()) {
        return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "인가 코드 없음"))
    }

    return try {
        val response = userService.kakaoLogin(code, redirectUri)
        ResponseEntity.ok(response)
    } catch (e: Exception) {
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(mapOf("status" to 500, "message" to "서버 오류: ${e.message}"))
        }
    }

    @GetMapping("/social/kakao/redirect")
    fun kakaoCallback(
        @RequestParam code: String,
    ): ResponseEntity<Map<String, Any>> {
        return kakaoLogin(mapOf("code" to code, "redirect_uri" to kakaoRedirectUri))
    }

    @PostMapping("/social/google/login")
    fun googleLogin(@RequestBody body: Map<String, String>): ResponseEntity<Map<String, Any>> {
        val code = body["code"]
        val redirectUri = body["redirect_uri"] ?: googleRedirectUri // 프론트에서 전달받은 값 우선 사용
        if (code.isNullOrEmpty()) {
            return ResponseEntity.badRequest().body(mapOf("status" to 400, "message" to "인가 코드 없음"))
        }

        return try {
            val formData = LinkedMultiValueMap<String, String>().apply {
                add("grant_type", googleGrantType)
                add("client_id", googleClientId)
                add("client_secret", googleClientSecret)
                add("redirect_uri", redirectUri) // 여기서 postmessage 가능
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
            val email = userInfoResponse["email"] as String?

            logger.info("Google 유저 정보 수신:")
            logger.info("이름: $nickname")
            logger.info("Google ID: $googleId")
            logger.info("이메일: $email")

            val user = userService.registerGoogleUser(googleId, nickname, email)
            val token = tokenAuth.generateToken(user.userid)

            ResponseEntity.ok(mapOf(
                "status" to 200,
                "token" to token,
                "message" to "구글 로그인 성공"
            ))
        } catch (e: Exception) {
            println("Google Login Error: ${e.message}")
            e.printStackTrace()
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