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
//     fun getUserInfo(@RequestHeader("Authorization") authorization: String?): ResponseEntity<Any> {
//         if (authorization == null || !authorization.startsWith("Bearer ")) {
//             return ResponseEntity.badRequest().body("Invalid Authorization header")
//         }

//         val accessToken = authorization.substring("Bearer ".length)

//         return try {
//             // Google API 호출
//             val userInfo = fetchGoogleUserInfo(accessToken)
//             ResponseEntity.ok(userInfo)
//         } catch (ex: Exception) {
//             ResponseEntity.status(500).body("Error fetching user info: ${ex.message}")
//         }
//     }

//     private fun fetchGoogleUserInfo(accessToken: String): Map<*, *> {
//         val restTemplate = RestTemplate()
//         val headers = HttpHeaders()
//         headers.set("Authorization", "Bearer $accessToken")

//         val entity = HttpEntity<String>(headers)
//         val response = restTemplate.getForEntity(GOOGLE_USERINFO_URL, Map::class.java, entity)

//         if (!response.statusCode.is2xxSuccessful) {
//             throw RuntimeException("Failed to fetch Google user info: ${response.statusCode}")
//         }

//         return response.body ?: throw RuntimeException("Empty response from Google API")
//     }
// }

import org.springframework.web.bind.annotation.*
import org.springframework.http.ResponseEntity
import org.springframework.web.client.RestTemplate
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpEntity

@RestController
@RequestMapping("/api/auth/google")
class GoogleAuthController {

    private val GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json"

    @GetMapping
    fun getUserInfo(@RequestHeader("Authorization") authorization: String?): ResponseEntity<Map<String, String>> {
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body(mapOf("error" to "Invalid Authorization header"))
        }

        val accessToken = authorization.substring("Bearer ".length)

        return try {
            // Google API 호출
            val userInfo = fetchGoogleUserInfo(accessToken)

            // 사용자 이름과 이메일 추출
            val userResponse = mapOf(
                "name" to (userInfo["name"] as? String ?: "Unknown"),
                "email" to (userInfo["email"] as? String ?: "Unknown")
            )

            ResponseEntity.ok(userResponse)
        } catch (ex: Exception) {
            ResponseEntity.status(500).body(mapOf("error" to "Error fetching user info: ${ex.message}"))
        }
    }

    private fun fetchGoogleUserInfo(accessToken: String): Map<String, Any> {
        val restTemplate = RestTemplate()
        val headers = HttpHeaders()
        headers.set("Authorization", "Bearer $accessToken")

        val entity = HttpEntity<String>(headers)
        val response = restTemplate.exchange(GOOGLE_USERINFO_URL, org.springframework.http.HttpMethod.GET, entity, Map::class.java)

        if (!response.statusCode.is2xxSuccessful) {
            throw RuntimeException("Failed to fetch Google user info: ${response.statusCode}")
        }

        return response.body as? Map<String, Any>
            ?: throw RuntimeException("Empty response from Google API")
    }
}
