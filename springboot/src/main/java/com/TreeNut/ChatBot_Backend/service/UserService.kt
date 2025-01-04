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

@Service
class UserService(
    private val userRepository: UserRepository,
    @Value("\${jwt.secret}") private val jwtSecret: String
) {
    private val passwordEncoder = BCryptPasswordEncoder()

    @Transactional
    fun register(user: User): User {
        return try {
            val encodedUser = user.copy(password = passwordEncoder.encode(user.password))
            userRepository.save(encodedUser)
        } catch (e: Exception) {
            throw RuntimeException("Error during user registration", e)
        }
    }

    @Transactional//(readOnly = true)
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
        val newUser = User(
            userid = "KAKAO_$kakaoId",
            username = username,
            email = email ?: "",
            loginType = LoginType.KAKAO,
            password = null // 소셜 로그인 사용자는 비밀번호가 없음
        )
        return userRepository.save(newUser)
    }

    @Transactional(readOnly = true)
    fun findUserByUserid(userid: String): User? {
        return userRepository.findByUserid(userid)
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