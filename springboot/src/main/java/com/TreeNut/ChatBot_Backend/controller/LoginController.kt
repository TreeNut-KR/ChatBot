import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@CrossOrigin("*")
class LoginController {

    @Value("\${google.client.id}")
    lateinit var googleClientId: String

    @GetMapping("/api/v1/oauth2/code/google")
    fun loginUrlGoogle(): String {
        val reqUrl = "https://accounts.google.com/o/oauth2/v2/auth?client_id=$googleClientId" +
                     "&redirect_uri=http://localhost/api/v1/oauth2/google/callback&response_type=code&scope=email%20profile%20openid&access_type=offline"
        return "redirect:$reqUrl"  // 구글 OAuth URL로 리다이렉트
    }
}
