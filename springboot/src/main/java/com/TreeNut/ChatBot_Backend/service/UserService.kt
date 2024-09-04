package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.repository.UserRepository
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import java.util.*

@Service
class UserService(private val userRepository: UserRepository) {
    private val passwordEncoder = BCryptPasswordEncoder()
    private val jwtSecret = "your_jwt_secret" // 환경 변수 또는 설정 파일에서 가져오는 것이 좋습니다.

    fun register(user: User): User {
        val encodedUser = user.copy(password = passwordEncoder.encode(user.password)) // 비밀번호 암호화
        return userRepository.save(encodedUser)
    }

    fun login(id: Long, password: String): User? {
        val user = userRepository.findById(id).orElse(null) // ID로 사용자 찾기
        return if (user != null && passwordEncoder.matches(password, user.password)) user else null
    }

    fun generateToken(user: User): String {
        return Jwts.builder()
            .setSubject(user.username)
            .setIssuedAt(Date())
            .setExpiration(Date(System.currentTimeMillis() + 86400000)) // 1일 후 만료
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact()
    }
}