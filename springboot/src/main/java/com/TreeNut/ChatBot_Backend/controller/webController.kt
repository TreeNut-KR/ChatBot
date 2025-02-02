// package com.TreeNut.ChatBot_Backend.controller

// import org.springframework.beans.factory.annotation.Value
// import org.springframework.core.ParameterizedTypeReference
// import org.springframework.http.HttpEntity
// import org.springframework.http.HttpHeaders
// import org.springframework.http.HttpMethod
// import org.springframework.http.ResponseEntity
// import org.springframework.stereotype.Controller
// import org.springframework.ui.Model
// import org.springframework.web.bind.annotation.GetMapping
// import org.springframework.web.bind.annotation.RequestParam
// import org.springframework.web.client.RestTemplate

// @Controller
// class WebController {

//     @Value("\${spring.security.oauth2.client.registration.naver.client-id}")
//     lateinit var naverClientId: String

//     @Value("\${spring.security.oauth2.client.registration.naver.client-secret}")
//     lateinit var naverClientSecret: String

//     @Value("\${spring.security.oauth2.client.registration.google.client-id}")
//     lateinit var googleClientId: String

//     @Value("\${spring.security.oauth2.client.registration.google.client-secret}")
//     lateinit var googleClientSecret: String

//     @Value("\${spring.security.oauth2.client.registration.google.redirect-uri}")
//     lateinit var googleRedirectUri: String

//     @GetMapping("/")
//     fun home(): String = "index"

//     @GetMapping("/naverLogin")
//     fun naverLogin(): String = "naverLogin"

//     @GetMapping("/googleLogin")
//     fun googleLogin(): String = "googleLogin"

//     @GetMapping("/callBack")
//     fun callBack(@RequestParam code: String, model: Model): String {
//         model.addAttribute("message", "This route needs implementation.")
//         return "callBack"
//     }

//     @GetMapping("/login/oauth2/code/google/callback")
//     fun googleCallback(@RequestParam code: String, model: Model): String {
//         val tokenUri = "https://oauth2.googleapis.com/token"
//         val userInfoUri = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json"

//         // 1. 액세스 토큰 요청
//         val tokenRequestBody = mapOf(
//             "code" to code,
//             "client_id" to googleClientId,
//             "client_secret" to googleClientSecret,
//             "redirect_uri" to googleRedirectUri,
//             "grant_type" to "authorization_code"
//         )

//         val headers = HttpHeaders().apply {
//             contentType = org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED
//         }

//         val restTemplate = RestTemplate()
//         val tokenResponse: ResponseEntity<Map<String, Any>> = restTemplate.exchange(
//             tokenUri,
//             HttpMethod.POST,
//             HttpEntity(tokenRequestBody, headers),
//             object : ParameterizedTypeReference<Map<String, Any>>() {}
//         )

//         val accessToken = tokenResponse.body?.get("access_token") as? String
//             ?: throw RuntimeException("Access token not found in response")

//         // 2. 사용자 정보 요청
//         val userInfoHeaders = HttpHeaders().apply {
//             set("Authorization", "Bearer $accessToken")
//         }

//         val userInfoResponse: ResponseEntity<Map<String, Any>> = restTemplate.exchange(
//             userInfoUri,
//             HttpMethod.GET,
//             HttpEntity<String>(userInfoHeaders),
//             object : ParameterizedTypeReference<Map<String, Any>>() {}
//         )

//         val userInfo = userInfoResponse.body ?: throw RuntimeException("Failed to fetch user info")

//         // 3. 사용자 정보를 모델에 추가
//         model.addAttribute("name", userInfo["name"] ?: "Unknown")
//         model.addAttribute("email", userInfo["email"] ?: "Unknown")
//         model.addAttribute("picture", userInfo["picture"] ?: "")

//         return "userInfo"
//     }
// }


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
import org.springframework.web.client.RestTemplate

@Controller
class WebController {

    @Value("\${spring.security.oauth2.client.registration.naver.client-id}")
    lateinit var naverClientId: String

    @Value("\${spring.security.oauth2.client.registration.naver.client-secret}")
    lateinit var naverClientSecret: String

    @Value("\${spring.security.oauth2.client.registration.google.client-id}")
    lateinit var googleClientId: String

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

        // 액세스 토큰 요청
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

        // 사용자 정보 요청
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

        // 사용자 정보를 모델에 추가
        model.addAttribute("name", userInfo["name"] ?: "Unknown")
        model.addAttribute("email", userInfo["email"] ?: "Unknown")
        model.addAttribute("picture", userInfo["picture"] ?: "")

        // 추가 기능: 사용자 ID와 이메일 로그 출력
        println("Google Login Success - Name: ${userInfo["name"]}, Email: ${userInfo["email"]}")

        return "userInfo"
    }

    // Naver OAuth 콜백 추가
    @GetMapping("/login/oauth2/code/naver/callback")
    fun naverCallback(@RequestParam code: String, @RequestParam state: String, model: Model): String {
        val tokenUri = "https://nid.naver.com/oauth2.0/token"
        val userInfoUri = "https://openapi.naver.com/v1/nid/me"

        // 액세스 토큰 요청
        val tokenRequestBody = mapOf(
            "grant_type" to "authorization_code",
            "client_id" to naverClientId,
            "client_secret" to naverClientSecret,
            "code" to code,
            "state" to state
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

        // 사용자 정보 요청
        val userInfoHeaders = HttpHeaders().apply {
            set("Authorization", "Bearer $accessToken")
        }

        val userInfoResponse: ResponseEntity<Map<String, Any>> = restTemplate.exchange(
            userInfoUri,
            HttpMethod.GET,
            HttpEntity<String>(userInfoHeaders),
            object : ParameterizedTypeReference<Map<String, Any>>() {}
        )

        val userInfo = userInfoResponse.body?.get("response") as? Map<String, Any>
            ?: throw RuntimeException("Failed to fetch user info")

        // 사용자 정보를 모델에 추가
        model.addAttribute("name", userInfo["name"] ?: "Unknown")
        model.addAttribute("email", userInfo["email"] ?: "Unknown")
        model.addAttribute("profile_image", userInfo["profile_image"] ?: "")

        // 추가 기능: 사용자 정보 로그 출력
        println("Naver Login Success - Name: ${userInfo["name"]}, Email: ${userInfo["email"]}")

        return "userInfo"
    }
}
