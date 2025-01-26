package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.repository.UserRepository
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*
import com.TreeNut.ChatBot_Backend.model.LoginType
import io.jsonwebtoken.security.Keys
import javax.crypto.SecretKey

@Service
class UserService(
    private val userRepository: UserRepository,
    @Value("\${jwt.secret}") private val jwtSecret: String
) {
    private val passwordEncoder = BCryptPasswordEncoder()

    @Transactional
    fun register(user: User): User {
        return try {
            // 중복 체크
            if (userRepository.findByUserid(user.userid) != null) {
                throw IllegalArgumentException("이미 존재하는 ID입니다.")
            }
            val encodedUser = user.copy(password = passwordEncoder.encode(user.password))
            userRepository.save(encodedUser)
        } catch (e: Exception) {
            throw RuntimeException("회원가입 중 오류 발생", e)
        }
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

    fun generateToken(user: User): String {
    val key: SecretKey = Keys.hmacShaKeyFor(jwtSecret.toByteArray()) // ✅ 안전한 키 생성
    return Jwts.builder()
        .setSubject(user.userid)
        .setIssuedAt(Date())
        .setExpiration(Date(System.currentTimeMillis() + 86400000)) // 1일 후 만료
        .signWith(key, SignatureAlgorithm.HS512)
        .compact()
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
}