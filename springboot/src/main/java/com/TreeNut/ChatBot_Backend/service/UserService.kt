package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.repository.UserRepository
import com.TreeNut.ChatBot_Backend.middleware.TokenAuth
import io.jsonwebtoken.Jwts
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*
import com.TreeNut.ChatBot_Backend.model.LoginType
import com.TreeNut.ChatBot_Backend.model.MembershipType
import io.jsonwebtoken.security.Keys
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.util.LinkedMultiValueMap
import org.springframework.http.MediaType
import org.springframework.web.reactive.function.BodyInserters
import javax.crypto.SecretKey
import org.springframework.dao.DataIntegrityViolationException
import java.sql.SQLIntegrityConstraintViolationException
import org.slf4j.LoggerFactory

@Service
class UserService(
    private val userRepository: UserRepository,
    private val webClientBuilder: WebClient.Builder,
    private val tokenAuth: TokenAuth,
    @Value("\${jwt.secret}") private val jwtSecret: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.client-id}") private val kakaoClientId: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.client-secret}") private val kakaoClientSecret: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.redirect-uri}") private val kakaoRedirectUri: String,
    @Value("\${spring.security.oauth2.client.provider.kakao.token-uri}") private val kakaoTokenUrl: String,
    @Value("\${spring.security.oauth2.client.provider.kakao.user-info-uri}") private val kakaoUserInfoUrl: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.authorization-grant-type}") private val kakaoGrantType: String,
    @Value("\${spring.security.oauth2.client.registration.kakao.scope}") private val kakaoScope: String,
    /* @Value("\${spring.security.oauth2.client.registration.naver.client-id}") private val naverClientId: String,
    @Value("\${spring.security.oauth2.client.registration.naver.client-secret}") private val naverClientSecret: String,
    @Value("\${spring.security.oauth2.client.registration.naver.redirect-uri}") private val naverRedirectUri: String,
    @Value("\${spring.security.oauth2.client.provider.naver.token-uri}") private val naverTokenUrl: String,
    @Value("\${spring.security.oauth2.client.provider.naver.user-info-uri}") private val naverUserInfoUrl: String,
    @Value("\${spring.security.oauth2.client.registration.naver.authorization-grant-type}") private val naverGrantType: String,
    @Value("\${spring.security.oauth2.client.registration.naver.scope}") private val naverScope: String */
) {
    // logger 추가
    private val logger = LoggerFactory.getLogger(UserService::class.java)
    
    private val passwordEncoder = BCryptPasswordEncoder()

    @Transactional
    fun register(user: User): User {
        if (userRepository.findByUserid(user.userid) != null) {
            throw IllegalArgumentException("이미 존재하는 ID입니다.")
        }
        val encodedUser = user.copy(password = passwordEncoder.encode(user.password))
        return userRepository.save(encodedUser)
    }

    @Transactional(readOnly = true)
    fun login(userid: String, password: String): User? {
        val user = userRepository.findByUserid(userid) ?: return null
        return if (passwordEncoder.matches(password, user.password)) user else null
    }

    @Transactional
    fun isFirstLogin(userid: String): Boolean {
        return userRepository.findByUserid(userid) == null
    }

    @Transactional
    fun registerGoogleUser(googleId: String, username: String, email: String?): User {
        logger.info("Google 회원가입 시작: id=GOOGLE_$googleId")
        
        return try {
            val userId = "GOOGLE_$googleId"
            userRepository.findByUserid(userId)?.also { 
                logger.info("기존 회원 발견: $userId")
            } ?: userRepository.save(User(
                userid = userId,
                username = username,
                email = email ?: "",
                loginType = LoginType.GOOGLE
            )).also {
                logger.info("신규 회원 저장 성공: $userId")
                // 트랜잭션 커밋 확인을 위한 추가 조회
                userRepository.flush()
                userRepository.findByUserid(userId) 
                    ?: throw RuntimeException("사용자 저장 실패")
            }
        } catch (e: Exception) {
            logger.error("Google 회원가입 실패", e)
            throw e
        }
    }

    @Transactional
    fun registerKakaoUser(kakaoId: String, username: String, email: String?): User {
        val existingUser = userRepository.findByUserid("KAKAO_$kakaoId")
        return existingUser ?: userRepository.save(User(
            userid = "KAKAO_$kakaoId",
            username = username,
            email = email ?: "",
            loginType = LoginType.KAKAO,
            password = null
        ))
    }

    @Transactional(readOnly = true)
    fun findUserByUserid(userid: String): User? {
        return userRepository.findByUserid(userid)
    }

    @Transactional
    fun deleteUser(userid: String): Boolean {
        val user = userRepository.findByUserid(userid)
        return if (user != null) {
            userRepository.deleteByUserid(userid)
            true
        } else {
            false
        }
    }

    fun kakaoLogin(code: String): Map<String, Any> {
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
            .header("Content-type", "application/x-www-form-urlencoded;charset=utf-8")
            .retrieve()
            .bodyToMono(Map::class.java)
            .block() ?: throw RuntimeException("사용자 정보 응답이 null입니다")

        val kakaoAccount = userInfoResponse["kakao_account"] as Map<*, *>
        val profile = kakaoAccount["profile"] as Map<*, *>
        val nickname = profile["nickname"] as String
        val kakaoId = userInfoResponse["id"].toString()

        val user = registerKakaoUser(kakaoId, nickname, null)
        val token = tokenAuth.generateToken(user.userid)

        return mapOf(
            "status" to 200,
            "token" to token,
            "message" to "카카오 로그인 성공"
        )
    }

    /* fun naverLogin(code: String, state: String): Map<String, Any> {
        val formData = LinkedMultiValueMap<String, String>().apply {
            add("grant_type", naverGrantType)
            add("client_id", naverClientId)
            add("client_secret", naverClientSecret)
            add("redirect_uri", naverRedirectUri)
            add("code", code)
            add("state", state)
        }

        val tokenResponse = webClientBuilder.build()
            .post()
            .uri(naverTokenUrl)
            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
            .body(BodyInserters.fromFormData(formData))
            .retrieve()
            .bodyToMono(Map::class.java)
            .block() ?: throw RuntimeException("토큰 응답이 null입니다")

        val accessToken = tokenResponse["access_token"] as String
        
        val userInfoResponse = webClientBuilder.build()
            .get()
            .uri(naverUserInfoUrl)
            .header("Authorization", "Bearer $accessToken")
            .retrieve()
            .bodyToMono(Map::class.java)
            .block() ?: throw RuntimeException("사용자 정보 응답이 null입니다")

        val response = userInfoResponse["response"] as Map<*, *>
        val nickname = response["nickname"] as String
        val naverId = response["id"].toString()

        val user = registerNaverUser(naverId, nickname, null)
        val token = generateToken(user)

        return mapOf(
            "status" to 200,
            "token" to token,
            "message" to "네이버 로그인 성공"
        )
    }

    @Transactional
    fun registerNaverUser(naverId: String, username: String, email: String?): User {
        val existingUser = userRepository.findByUserid("NAVER_$naverId")
        return existingUser ?: userRepository.save(User(
            userid = "NAVER_$naverId",
            username = username,
            email = email ?: "",
            loginType = LoginType.NAVER,
            password = null
        ))
    } */

    fun getUserid(token: String): String {
        return tokenAuth.authGuard(token) ?: throw RuntimeException("Invalid token")
    }

    fun getUsername(userid: String): String {
        val user = userRepository.findByUserid(userid)
        return user?.username ?: ""
    }

    fun getUseremail(userid: String): String {
        val user = userRepository.findByUserid(userid)
        return user?.email ?: ""
    }

    fun updateUserInfo(userid: String, username: String): User {
        return try {
            // 기존 사용자 조회
            val existingUser = userRepository.findByUserid(userid)
                ?: throw RuntimeException("User not found")

            // 기존 사용자 정보를 업데이트
            val updatedUser = existingUser.copy(
                username = username
            )

            // 업데이트된 사용자 정보 저장
            userRepository.save(updatedUser)
        } catch (e: DataIntegrityViolationException) {
            throw RuntimeException("Duplicate userid", e)
        } catch (e: Exception) {
            throw RuntimeException("Error during user information update", e)
        }
    }

    @Transactional
    fun updateUserAgreement(userid: String, chatlogAgree: Boolean, userSettingAgree: Boolean): User {
        val user = userRepository.findByUserid(userid)
            ?: throw RuntimeException("User not found")
        val updatedUser = user.copy(
            chatlog_agree = chatlogAgree,
            user_setting_agree = userSettingAgree
        )
        return userRepository.save(updatedUser)
    }

    @Transactional(readOnly = true)
    fun getMembership(userid: String): String {
        val user = userRepository.findByUserid(userid)
            ?: throw RuntimeException("User not found")
        return user.membership.name
    }

    @Transactional
    fun updateMembership(userid: String, membership: String): User {
        val user = userRepository.findByUserid(userid)
            ?: throw RuntimeException("User not found")
        val updatedUser = user.copy(membership = MembershipType.valueOf(membership.uppercase()))
        return userRepository.save(updatedUser)
    }
}