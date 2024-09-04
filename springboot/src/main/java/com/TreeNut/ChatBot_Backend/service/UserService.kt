package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.repository.UserRepository
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service
import java.util.*

@Service
class UserService(
    private val userRepository: UserRepository,
    @Value("\${jwt.secret}") private val jwtSecret: String
) {
    private val passwordEncoder = BCryptPasswordEncoder()

    fun register(user: User): User {
        return try {
            val encodedUser = user.copy(password = passwordEncoder.encode(user.password))
            userRepository.save(encodedUser)
        } catch (e: Exception) {
            throw RuntimeException("Error during user registration", e)
        }
    }

    fun login(userid: String, password: String): User? {
        val user = userRepository.findById(userid).orElse(null) ?: return null
        return if (passwordEncoder.matches(password, user.password)) user else null
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