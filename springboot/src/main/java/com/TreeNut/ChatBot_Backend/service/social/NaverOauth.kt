package org.project.oauth.service.social

import org.springframework.stereotype.Component

@Component
class NaverOauth : SocialOauth {
    override fun getOauthRedirectURL(): String {
        return ""
    }

    override fun requestAccessToken(code: String): String? {
        return "access_token"
    }
}


//완