package org.project.oauth.service

import org.project.oauth.helper.constants.SocialLoginType
import org.project.oauth.service.social.SocialOauth
import org.springframework.stereotype.Service
import javax.servlet.http.HttpServletResponse
import java.io.IOException

@Service
class OauthService(
    private val socialOauthList: List<SocialOauth>,
    private val response: HttpServletResponse
) {

    fun request(socialLoginType: SocialLoginType) {
        val socialOauth = findSocialOauthByType(socialLoginType)
        val redirectURL = socialOauth.getOauthRedirectURL()
        try {
            response.sendRedirect(redirectURL)
        } catch (e: IOException) {
            e.printStackTrace()
        }
    }

    fun requestAccessToken(socialLoginType: SocialLoginType, code: String): String {
        val socialOauth = findSocialOauthByType(socialLoginType)
        return socialOauth.requestAccessToken(code)
    }

    private fun findSocialOauthByType(socialLoginType: SocialLoginType): SocialOauth {
        return socialOauthList.firstOrNull { it.type() == socialLoginType }
            ?: throw IllegalArgumentException("알 수 없는 SocialLoginType 입니다.")
    }
}


//완