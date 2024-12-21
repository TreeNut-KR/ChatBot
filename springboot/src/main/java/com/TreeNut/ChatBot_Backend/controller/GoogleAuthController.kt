// // import org.springframework.web.bind.annotation.*
// // import org.springframework.http.ResponseEntity
// // import org.springframework.web.client.RestTemplate
// // import org.springframework.http.HttpHeaders
// // import org.springframework.http.HttpEntity

// // @RestController
// // @RequestMapping("/api/auth/google")
// // class GoogleAuthController {

// //     private val GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json"

// //     @GetMapping
// //     fun getUserInfo(@RequestHeader("Authorization") authorization: String?): ResponseEntity<Any> {
// //         if (authorization == null || !authorization.startsWith("Bearer ")) {
// //             return ResponseEntity.badRequest().body("Invalid Authorization header")
// //         }

// //         val accessToken = authorization.substring("Bearer ".length)

// //         return try {
// //             // Google API 호출
// //             val userInfo = fetchGoogleUserInfo(accessToken)
// //             ResponseEntity.ok(userInfo)
// //         } catch (ex: Exception) {
// //             ResponseEntity.status(500).body("Error fetching user info: ${ex.message}")
// //         }
// //     }

// //     private fun fetchGoogleUserInfo(accessToken: String): Map<*, *> {
// //         val restTemplate = RestTemplate()
// //         val headers = HttpHeaders()
// //         headers.set("Authorization", "Bearer $accessToken")

// //         val entity = HttpEntity<String>(headers)
// //         val response = restTemplate.getForEntity(GOOGLE_USERINFO_URL, Map::class.java, entity)

// //         if (!response.statusCode.is2xxSuccessful) {
// //             throw RuntimeException("Failed to fetch Google user info: ${response.statusCode}")
// //         }

// //         return response.body ?: throw RuntimeException("Empty response from Google API")
// //     }
// // }

// import org.springframework.web.bind.annotation.*
// import org.springframework.http.ResponseEntity
// import org.springframework.web.client.RestTemplate
// import org.springframework.http.HttpHeaders
// import org.springframework.http.HttpEntity

// @RestController
// @RequestMapping("/api/auth/google")
// class GoogleAuthController {

//     private val GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json"

//     @GetMapping
//     fun getUserInfo(@RequestHeader("Authorization") authorization: String?): ResponseEntity<Map<String, String>> {
//         if (authorization == null || !authorization.startsWith("Bearer ")) {
//             return ResponseEntity.badRequest().body(mapOf("error" to "Invalid Authorization header"))
//         }

//         val accessToken = authorization.substring("Bearer ".length)

//         return try {
//             // Google API 호출
//             val userInfo = fetchGoogleUserInfo(accessToken)

//             // 사용자 이름과 이메일 추출
//             val userResponse = mapOf(
//                 "name" to (userInfo["name"] as? String ?: "Unknown"),
//                 "email" to (userInfo["email"] as? String ?: "Unknown")
//             )

//             ResponseEntity.ok(userResponse)
//         } catch (ex: Exception) {
//             ResponseEntity.status(500).body(mapOf("error" to "Error fetching user info: ${ex.message}"))
//         }
//     }

//     private fun fetchGoogleUserInfo(accessToken: String): Map<String, Any> {
//         val restTemplate = RestTemplate()
//         val headers = HttpHeaders()
//         headers.set("Authorization", "Bearer $accessToken")

//         val entity = HttpEntity<String>(headers)
//         val response = restTemplate.exchange(GOOGLE_USERINFO_URL, org.springframework.http.HttpMethod.GET, entity, Map::class.java)

//         if (!response.statusCode.is2xxSuccessful) {
//             throw RuntimeException("Failed to fetch Google user info: ${response.statusCode}")
//         }

//         return response.body as? Map<String, Any>
//             ?: throw RuntimeException("Empty response from Google API")
//     }
// }




//잘되는버전
// import org.springframework.web.bind.annotation.*
// import org.springframework.http.ResponseEntity
// import org.springframework.web.client.RestTemplate
// import org.springframework.http.HttpHeaders
// import org.springframework.http.HttpEntity
// import org.springframework.beans.factory.annotation.Autowired
// import org.springframework.web.client.HttpClientErrorException
// import org.springframework.web.client.HttpServerErrorException

// @RestController
// @RequestMapping("/login/oauth2/code/google/callback")
// class GoogleAuthController {

//     private val GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json"

//     @Autowired
//     private lateinit var restTemplate: RestTemplate

//     @GetMapping
//     fun getUserInfo(@RequestHeader("Authorization") authorization: String?): ResponseEntity<Map<String, String>> {
//         // Authorization 헤더가 없거나 "Bearer "로 시작하지 않으면 오류 반환
//         if (authorization.isNullOrBlank() || !authorization.startsWith("Bearer ")) {
//             return ResponseEntity.badRequest().body(mapOf("error" to "Invalid Authorization header"))
//         }

//         // Authorization에서 Access Token 추출
//         val accessToken = authorization.substring("Bearer ".length)

//         return try {
//             // 구글 API 호출
//             val userInfo = fetchGoogleUserInfo(accessToken)

//             // 사용자 이름과 이메일 추출
//             val userResponse = mapOf(
//                 "name" to (userInfo["name"] as? String ?: "Unknown"),
//                 "email" to (userInfo["email"] as? String ?: "Unknown")
//             )

//             ResponseEntity.ok(userResponse)
//         } catch (ex: HttpClientErrorException) {
//             // 클라이언트 에러 (400번대) 처리
//             ResponseEntity.status(400).body(mapOf("error" to "Error fetching user info: ${ex.message}"))
//         } catch (ex: HttpServerErrorException) {
//             // 서버 에러 (500번대) 처리
//             ResponseEntity.status(500).body(mapOf("error" to "Server error while fetching user info: ${ex.message}"))
//         } catch (ex: Exception) {
//             // 그 외의 예외 처리
//             ResponseEntity.status(500).body(mapOf("error" to "Unknown error: ${ex.message}"))
//         }
//     }

//     // 구글 사용자 정보 가져오기
//     private fun fetchGoogleUserInfo(accessToken: String): Map<String, Any> {
//         val headers = HttpHeaders()
//         headers.set("Authorization", "Bearer $accessToken")

//         val entity = HttpEntity<String>(headers)
//         val response = restTemplate.exchange(GOOGLE_USERINFO_URL, org.springframework.http.HttpMethod.GET, entity, Map::class.java)

//         // 구글 API 호출 실패 시 예외 처리
//         if (!response.statusCode.is2xxSuccessful) {
//             throw RuntimeException("Failed to fetch Google user info: ${response.statusCode}")
//         }

//         return response.body as? Map<String, Any>
//             ?: throw RuntimeException("Empty response from Google API")
//     }
// }

package com.TreeNut.ChatBot_Backend.controller

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestHeader
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.client.RestTemplate
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpEntity

@RestController
class GoogleAuthController {

    private val GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json"

    @GetMapping("/api/auth/google/userinfo")
    fun getUserInfo(@RequestHeader("Authorization") authorization: String?): ResponseEntity<Any> {
        // 1. Authorization 헤더 검증
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("Invalid Authorization header")
        }

        // 2. Bearer 토큰 추출
        val accessToken = authorization.substring("Bearer ".length)

        return try {
            // 3. 사용자 정보 요청 및 반환
            val userInfo = fetchGoogleUserInfo(accessToken)
            ResponseEntity.ok(userInfo)
        } catch (ex: Exception) {
            ResponseEntity.status(500).body("Error fetching user info: ${ex.message}")
        }
    }

    private fun fetchGoogleUserInfo(accessToken: String): Map<*, *> {
        val restTemplate = RestTemplate()
        val headers = HttpHeaders().apply {
            set("Authorization", "Bearer $accessToken") // Authorization 헤더 설정
        }

        val entity = HttpEntity<String>(headers)
        val response = restTemplate.getForEntity(GOOGLE_USERINFO_URL, Map::class.java, entity)

        if (!response.statusCode.is2xxSuccessful) {
            throw RuntimeException("Failed to fetch Google user info: ${response.statusCode}")
        }

        // API 응답 반환
        return response.body ?: throw RuntimeException("Empty response from Google API")
    }
}






//테스트하던 버젼
// package com.TreeNut.ChatBot_Backend.controller

// import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken
// import org.springframework.security.oauth2.core.user.OAuth2User
// import org.springframework.stereotype.Controller
// import org.springframework.web.bind.annotation.GetMapping
// import org.springframework.web.bind.annotation.RequestMapping
// import org.springframework.web.bind.annotation.RequestParam
// import org.springframework.web.servlet.ModelAndView
// import javax.servlet.http.HttpSession

// @Controller
// @RequestMapping("/auth")
// class GoogleOAuthController {

//     @GetMapping("/googleLogin")
//     fun login(): String {
//         // 로그인 페이지에서 Google 인증 시작
//         return "redirect:/oauth2/authorization/google"
//     }

//     @GetMapping("/oauth2/code/google")
//     fun callback(
//         @RequestParam("code", required = false) code: String?,
//         session: HttpSession,
//         authentication: OAuth2AuthenticationToken
//     ): String {
//         if (code == null) {
//             // 인증 실패 시 로그인 페이지로 리디렉션
//             return "redirect:/googleLogin"
//         }

//         // 인증 성공: OAuth2User에서 사용자 정보를 가져옴
//         val oAuth2User = authentication.principal as OAuth2User
//         val attributes = oAuth2User.attributes
//         val accessToken = authentication.authorizedClientRegistrationId

//         // 세션에 사용자 정보와 액세스 토큰 저장
//         session.setAttribute("user", attributes)
//         session.setAttribute("token", accessToken)

//         // 성공적으로 인증된 사용자를 홈 페이지로 리디렉션
//         return "redirect:/home"
//     }

//     @GetMapping("/logout")
//     fun logout(session: HttpSession): String {
//         session.invalidate() // 세션 삭제
//         return "redirect:/auth/login"
//     }
// }
