package com.TreeNut.ChatBot_Backend.controller

import com.TreeNut.ChatBot_Backend.service.AuthService
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@CrossOrigin("*")
class LoginController(private val authService: AuthService) {

    @Value("\${google.client.id}")
    lateinit var googleClientId: String

    @GetMapping("/api/v1/oauth2/code/google")
    fun loginByGoogle(): String {  // 함수 이름 변경
        val reqUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=$googleClientId" +
                     "&redirect_uri=http://localhost/api/v1/oauth2/google/callback&response_type=code&scope=email%20profile%20openid&access_type=offline"
        return "redirect:$reqUrl"  // 구글 OAuth URL로 리다이렉트
    }

    @GetMapping("/api/v1/oauth2/google/callback")
    fun googleCallback(@RequestParam("code") code: String): Map<String, Any> {
        // 받은 code로 사용자 정보를 가져오기
        val userInfo = authService.loginByGoogle(code)
        return userInfo  // 사용자 정보를 JSON 형태로 반환
    }
}
