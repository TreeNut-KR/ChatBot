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

@Service
class UserService(
    private val userRepository: UserRepository,
    @Value("\${jwt.secret}") private val jwtSecret: String
) {
    private val passwordEncoder = BCryptPasswordEncoder()

    @Transactional
    fun register(user: User): User {
        return try {
            val encodedUser = user.copy(
                password = passwordEncoder.encode(user.password),
                loginType = "local" // 기본 회원가입은 'local'로 구분
            )
            userRepository.save(encodedUser)
        } catch (e: Exception) {
            throw RuntimeException("Error during user registration", e)
        }
    }

    @Transactional
    fun loginWithKakao(kakaoId: String, username: String, email: String): User {
        val user = userRepository.findByUserid("KAKAO_$kakaoId")
        return if (user != null) {
            user // 이미 존재하면 그대로 반환
        } else {
            val newUser = User(
                userid = "KAKAO_$kakaoId",
                loginType = "KAKAO",
                username = username,
                email = email,
                password = null // 소셜 로그인은 비밀번호 없음
            )
            userRepository.save(newUser) // 신규 사용자 저장
        }
    }

    @Transactional//(readOnly = true)
    fun login(userid: String, password: String): User? {
        val user = userRepository.findByUserid(userid) ?: return null
        return if (passwordEncoder.matches(password, user.password)) user else null
    }

    fun generateToken(user: User): String {
        return Jwts.builder()
            .setSubject(user.userid) // userid를 사용하여 토큰 생성
            .setIssuedAt(Date())
            .setExpiration(Date(System.currentTimeMillis() + 86400000)) // 1일 후 만료
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
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