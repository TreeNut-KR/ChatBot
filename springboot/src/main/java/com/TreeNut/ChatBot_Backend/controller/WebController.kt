import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.client.RestTemplate
import org.springframework.web.util.UriComponentsBuilder

@Controller
class WebController {

    @Value("\${naver.client.id}")
    lateinit var naverClientId: String

    @Value("\${naver.client.secret}")
    lateinit var naverClientSecret: String

    @Value("\${google.client.id}")
    lateinit var googleClientId: String

    @Value("\${google.client.secret}")
    lateinit var googleClientSecret: String

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

    // Naver User Profile
    @GetMapping("/userProfile")
    @ResponseBody
    fun naverUserProfile(
        @RequestParam code: String,
        @RequestParam state: String
    ): Map<String, Any> {
        // Naver access token 요청 로직
        val tokenUri = UriComponentsBuilder.fromHttpUrl("https://nid.naver.com/oauth2.0/token")
            .queryParam("grant_type", "authorization_code")
            .queryParam("client_id", naverClientId)
            .queryParam("client_secret", naverClientSecret)
            .queryParam("code", code)
            .queryParam("state", state)
            .toUriString()

        val headers = HttpHeaders().apply {
            add("Content-Type", "application/x-www-form-urlencoded")
        }

        val request = HttpEntity<String>(headers)
        val restTemplate = RestTemplate()
        val responseType = object : org.springframework.core.ParameterizedTypeReference<Map<String, Any>>() {}
        val tokenResponse: ResponseEntity<Map<String, Any>> = restTemplate.exchange(tokenUri, HttpMethod.POST, request, responseType)

        val accessToken = tokenResponse.body?.get("access_token")?.toString() ?: return mapOf("error" to "Failed to get access token")

        val profileUri = "https://openapi.naver.com/v1/nid/me"
        val profileHeaders = HttpHeaders().apply {
            add("Authorization", "Bearer $accessToken")
        }

        val profileRequest = HttpEntity<String>(profileHeaders)
        val profileResponse: ResponseEntity<Map<String, Any>> = restTemplate.exchange(profileUri, HttpMethod.GET, profileRequest, responseType)

        return profileResponse.body ?: mapOf("error" to "Failed to get profile data")
    }

    // Google User Profile
    @GetMapping("/googleUserProfile")
    @ResponseBody
    fun googleUserProfile(
        @RequestParam code: String,
        @RequestParam state: String
    ): Map<String, Any> {
        // Google access token 요청 로직
        val tokenUri = UriComponentsBuilder.fromHttpUrl("https://oauth2.googleapis.com/token")
            .queryParam("code", code)
            .queryParam("client_id", googleClientId)
            .queryParam("client_secret", googleClientSecret)
            .queryParam("redirect_uri", "https://localhost/api/v1/oauth2/google/callback") // Google redirect URI
            .queryParam("grant_type", "authorization_code")
            .toUriString()

        val headers = HttpHeaders().apply {
            add("Content-Type", "application/x-www-form-urlencoded")
        }

        val request = HttpEntity<String>(headers)
        val restTemplate = RestTemplate()
        val responseType = object : org.springframework.core.ParameterizedTypeReference<Map<String, Any>>() {}
        val tokenResponse: ResponseEntity<Map<String, Any>> = restTemplate.exchange(tokenUri, HttpMethod.POST, request, responseType)

        val accessToken = tokenResponse.body?.get("access_token")?.toString() ?: return mapOf("error" to "Failed to get access token")

        val profileUri = "https://www.googleapis.com/oauth2/v1/userinfo?alt=json"
        val profileHeaders = HttpHeaders().apply {
            add("Authorization", "Bearer $accessToken")
        }

        val profileRequest = HttpEntity<String>(profileHeaders)
        val profileResponse: ResponseEntity<Map<String, Any>> = restTemplate.exchange(profileUri, HttpMethod.GET, profileRequest, responseType)

        return profileResponse.body ?: mapOf("error" to "Failed to get profile data")
    }
}
