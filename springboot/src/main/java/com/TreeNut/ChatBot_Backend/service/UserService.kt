package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.User
import com.TreeNut.ChatBot_Backend.repository.UserRepository
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.stereotype.Service

@Service
class UserService(private val userRepository: UserRepository) {
    private val passwordEncoder = BCryptPasswordEncoder()

    fun register(user: User): User {
        val encodedUser = user.copy(password = passwordEncoder.encode(user.password)) // 비밀번호 암호화
        return userRepository.save(encodedUser)
    }

    fun login(id: Long, password: String): User? {
        val user = userRepository.findById(id).orElse(null) // ID로 사용자 찾기
        return if (user != null && passwordEncoder.matches(password, user.password)) user else null
    }
}
