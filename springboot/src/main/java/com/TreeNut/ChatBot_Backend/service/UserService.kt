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
import org.springframework.dao.DataIntegrityViolationException
import java.sql.SQLIntegrityConstraintViolationException

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

    fun getUserid(token: String): String {
        val userid = Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token).body.subject
        return userid
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
}