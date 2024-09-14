package TreeNut.TreeNut

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping

@Controller
class WebController {

    @GetMapping("/")
    fun home(): String {
        return "index" // templates/index.html을 반환
    }

    @GetMapping("/login")
    fun login(): String {
        return "naverLogin" // templates/login.html을 반환
    }

    @GetMapping("/callBack")
    fun callBack(): String {
        return "callBack" // templates/login.html을 반환
    }
}
