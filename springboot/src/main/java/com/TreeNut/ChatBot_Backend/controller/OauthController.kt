import org.springframework.web.bind.annotation.*
import org.slf4j.LoggerFactory

@RestController
@CrossOrigin
@RequestMapping("/auth")
class OauthController(
    private val oauthService: OauthService
) {

    private val log = LoggerFactory.getLogger(OauthController::class.java)

    /**
     * 사용자로부터 SNS 로그인 요청을 Social Login Type 을 받아 처리
     * @param socialLoginType (GOOGLE, FACEBOOK, NAVER, KAKAO)
     */
    @GetMapping("/{socialLoginType}")
    fun socialLoginType(
        @PathVariable socialLoginType: SocialLoginType
    ) {
        log.info(">> 사용자로부터 SNS 로그인 요청을 받음 :: {} Social Login", socialLoginType)
        oauthService.request(socialLoginType)
    }

    /**
     * Social Login API Server 요청에 의한 callback 을 처리
     * @param socialLoginType (GOOGLE, FACEBOOK, NAVER, KAKAO)
     * @param code API Server 로부터 넘어오는 code
     * @return SNS Login 요청 결과로 받은 Json 형태의 String 문자열 (access_token, refresh_token 등)
     */
    @GetMapping("/{socialLoginType}/callback")
    fun callback(
        @PathVariable socialLoginType: SocialLoginType,
        @RequestParam code: String
    ): String {
        log.info(">> 소셜 로그인 API 서버로부터 받은 code :: {}", code)
        return ""
    }
}


//완