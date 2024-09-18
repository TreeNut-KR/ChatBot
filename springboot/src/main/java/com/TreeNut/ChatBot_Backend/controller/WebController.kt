package TreeNut.TreeNut

import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.ResponseBody
import org.springframework.web.servlet.ModelAndView

@Controller
class WebController {

    @Value("\${naver.client.id}")
    lateinit var clientId: String

    @Value("\${naver.client.secret}")
    lateinit var clientSecret: String

    @GetMapping("/")
    fun home(): String {
        return "index" // templates/index.html 반환
    }

    @GetMapping("/naverLogin")
    fun login(): String {
        return "naverLogin" // templates/naverLogin.html 반환
    }

    @GetMapping("/callBack")
    fun callBack(): String {
        // callBack.html 반환
        return "callBack" // templates/callBack.html 반환
    }
}
