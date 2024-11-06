package org.project.oauth.service.social

import org.project.oauth.helper.constants.SocialLoginType

interface SocialOauth {
    /**
     * 각 Social Login 페이지로 Redirect 처리할 URL Build
     * 사용자로부터 로그인 요청을 받아 Social Login Server 인증용 code 요
     */
    fun getOauthRedirectURL(): String

    /**
     * API Server로부터 받은 code를 활용하여 사용자 인증 정보 요청
     * @param code API Server 에서 받아온 code
     * @return API 서버로 부터 응답받은 Json 형태의 결과를 string으로 반
     */
    fun requestAccessToken(code: String): String

    fun type(): SocialLoginType? {
    return if (this is GoogleOauth) {
        SocialLoginType.GOOGLE
    } else if (this is NaverOauth) {
        SocialLoginType.NAVER
    } else /* if (this is FacebookOauth) */ {
        // SocialLoginType.FACEBOOK
        null
    } else /* if (this is KakaoOauth) */ {
        // SocialLoginType.KAKAO
        null
    } else {
        null
    }
}}
//완