// springboot\src\main\java\com\TreeNut\ChatBot_Backend\controller\webController.kt
// webController.kt
package com.TreeNut.ChatBot_Backend.controller

import org.springframework.beans.factory.annotation.Value
import org.springframework.core.ParameterizedTypeReference
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.ui.Model
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.client.RestTemplate
import org.springframework.web.util.UriComponentsBuilder

@Controller
class WebController {

    @GetMapping("/")
    fun home(): String {
        return "index" // templates/index.html 반환
    }

    @GetMapping("/naverLogin")
    fun naverLogin(): String {
        return "naverLogin" // templates/naverLogin.html 반환
    }

    @GetMapping("/googleLogin")
    fun googleLogin(): String {
        return "googleLogin" // googleLogin.html 반환
    }

    @GetMapping("/callBack")
    fun callBack(): String {
        return "callBack" // templates/callBack.html 반환
    }
}


//테스트 커밋

/*

싹 밀기전 예전버전import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.client.RestTemplate

@Controller
class WebController {

    @Value("\${spring.security.oauth2.client.registration.naver.client-id}")
    lateinit var naverClientId: String

    // @Value("\${spring.security.oauth2.client.registration.google.client-id}")
    // lateinit var googleClientId: String

    // @Value("\${spring.security.oauth2.client.registration.google.client-secret}")
    // lateinit var googleClientSecret: String

    @Value("\${spring.security.oauth2.client.registration.google.client-secret}")
    lateinit var googleClientSecret: String

    @Value("\${spring.security.oauth2.client.registration.google.redirect-uri}")
    lateinit var googleRedirectUri: String

    @GetMapping("/")
    fun home(): String = "index"

    @GetMapping("/naverLogin")
    fun naverLogin(): String = "naverLogin"

    @GetMapping("/googleLogin")
    fun googleLogin(): String = "googleLogin"

    @GetMapping("/callBack")
    fun callBack(@RequestParam code: String, model: Model): String {
        model.addAttribute("message", "This route needs implementation.")
        return "callBack"
    }

    @GetMapping("/login/oauth2/code/google/callback")
    fun googleCallback(@RequestParam code: String, model: Model): String {
        val tokenUri = "https://oauth2.googleapis.com/token"
        val userInfoUri = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json"

        // 1. 액세스 토큰 요청
        val tokenRequestBody = mapOf(
            "code" to code,
            "client_id" to googleClientId,
            "client_secret" to googleClientSecret,
            "redirect_uri" to googleRedirectUri,
            "grant_type" to "authorization_code"
        )

        val headers = HttpHeaders().apply {
            contentType = org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED
        }

        val restTemplate = RestTemplate()
        val tokenResponse: ResponseEntity<Map<String, Any>> = restTemplate.exchange(
            tokenUri,
            HttpMethod.POST,
            HttpEntity(tokenRequestBody, headers),
            object : ParameterizedTypeReference<Map<String, Any>>() {}
        )

        val accessToken = tokenResponse.body?.get("access_token") as? String
            ?: throw RuntimeException("Access token not found in response")

        // 2. 사용자 정보 요청
        val userInfoHeaders = HttpHeaders().apply {
            set("Authorization", "Bearer $accessToken")
        }

        val userInfoResponse: ResponseEntity<Map<String, Any>> = restTemplate.exchange(
            userInfoUri,
            HttpMethod.GET,
            HttpEntity<String>(userInfoHeaders),
            object : ParameterizedTypeReference<Map<String, Any>>() {}
        )

        val userInfo = userInfoResponse.body ?: throw RuntimeException("Failed to fetch user info")

        // 3. 사용자 정보를 모델에 추가
        model.addAttribute("name", userInfo["name"] ?: "Unknown")
        model.addAttribute("email", userInfo["email"] ?: "Unknown")
        model.addAttribute("picture", userInfo["picture"] ?: "")

        return "userInfo"
    }
}
