package com.TreeNut.ChatBot_Backend.service.social

import com.TreeNut.ChatBot_Backend.service.social.SocialOauth // 필요한 import문 추가

class KakaoOauth : SocialOauth() {
    // 생성자 추가 가능
    override fun requestAccessToken(code: String): String {
        return "access_token"
    }

    override fun getOauthRedirectURL(): String {
        return "https://kakao.com/oauth"
    }
}
