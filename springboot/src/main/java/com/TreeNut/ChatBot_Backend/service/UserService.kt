// package com.TreeNut.ChatBot_Backend.service

// import com.TreeNut.ChatBot_Backend.model.User
// import com.TreeNut.ChatBot_Backend.repository.UserRepository
// import io.jsonwebtoken.Jwts
// import io.jsonwebtoken.SignatureAlgorithm
// import org.springframework.beans.factory.annotation.Value
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
// import org.springframework.stereotype.Service
// import org.springframework.transaction.annotation.Transactional
// import java.util.*

// @Service
// class UserService(
//     private val userRepository: UserRepository,
//     @Value("\${jwt.secret}") private val jwtSecret: String
// ) {
//     private val passwordEncoder = BCryptPasswordEncoder()

//     @Transactional
//     fun register(user: User): User {
//         return try {
//             val encodedUser = user.copy(password = passwordEncoder.encode(user.password))
//             userRepository.save(encodedUser)
//         } catch (e: Exception) {
//             throw RuntimeException("Error during user registration", e)
//         }
//     }

//     @Transactional//(readOnly = true)
//     fun login(userid: String, password: String): User? {
//         val user = userRepository.findByUserid(userid) ?: return null
//         return if (passwordEncoder.matches(password, user.password)) user else null
//     }

//     fun generateToken(user: User): String {
//         return Jwts.builder()
//             .setSubject(user.userid) // userid를 사용하여 토큰 생성
//             .setIssuedAt(Date())
//             .setExpiration(Date(System.currentTimeMillis() + 86400000)) // 1일 후 만료
//             .signWith(SignatureAlgorithm.HS512, jwtSecret)
//             .compact()
//     }
    
//     @Transactional
//     fun deleteUser(userid: String): Boolean {
//         val user = userRepository.findByUserid(userid)
//         return if (user != null) {
//             userRepository.deleteByUserid(userid)
//             true
//         } else {
//             false
//         }
//     }

    
// }

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

    // 사용자 등록 (회원가입)
    @Transactional
    fun register(user: User): User {
        return try {
            val encodedUser = user.copy(password = passwordEncoder.encode(user.password))
            userRepository.save(encodedUser)
        } catch (e: Exception) {
            throw RuntimeException("Error during user registration", e)
        }
    }

    // 사용자 로그인
    @Transactional
    fun login(userid: String, password: String): User? {
        val user = userRepository.findByUserid(userid) ?: return null
        return if (passwordEncoder.matches(password, user.password)) user else null
    }

    // JWT 토큰 생성
    fun generateToken(user: User): String {
        return Jwts.builder()
            .setSubject(user.userid) // userid를 사용하여 토큰 생성
            .setIssuedAt(Date())
            .setExpiration(Date(System.currentTimeMillis() + 86400000)) // 1일 후 만료
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact()
    }

    // 사용자 삭제
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

    // **사용자 조회 by ID**
    @Transactional(readOnly = true)
    fun findByUserId(userid: String): User? {
        return userRepository.findByUserid(userid)
    }

    // **토큰 업데이트**
    @Transactional
    fun updateTokens(userId: Long, accessToken: String?, refreshToken: String?) {
        val user = userRepository.findById(userId).orElseThrow { RuntimeException("User not found") }
        val updatedUser = user.copy(
            accessToken = accessToken,
            refreshToken = refreshToken
        )
        userRepository.save(updatedUser)
    }

    // **모든 사용자 목록 조회**
    @Transactional(readOnly = true)
    fun findAllUsers(): List<User> {
        return userRepository.findAll()
    }

    // **패스워드 변경**
    @Transactional
    fun changePassword(userid: String, newPassword: String): Boolean {
        val user = userRepository.findByUserid(userid) ?: return false
        val updatedUser = user.copy(password = passwordEncoder.encode(newPassword))
        userRepository.save(updatedUser)
        return true
    }

    // **Access Token 검증**
    fun validateToken(token: String): Boolean {
        return try {
            val claims = Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token)
            val expirationDate = claims.body.expiration
            expirationDate.after(Date())
        } catch (e: Exception) {
            false
        }
    }

    // **사용자 정보 업데이트**
    @Transactional
    fun updateUser(userid: String, updatedUser: User): User? {
        val existingUser = userRepository.findByUserid(userid) ?: return null
        val userToUpdate = existingUser.copy(
            username = updatedUser.username,
            email = updatedUser.email,
            password = updatedUser.password.let { passwordEncoder.encode(it) }
        )
        return userRepository.save(userToUpdate)
    }
}
