package org.project.oauth.service.social

import org.springframework.stereotype.Component

@Component
class KakaoOauth : SocialOauth {
    override fun getOauthRedirectURL(): String {
        return ""
    }

    override fun requestAccessToken(code: String): String? {
        return null
    }
}


//완