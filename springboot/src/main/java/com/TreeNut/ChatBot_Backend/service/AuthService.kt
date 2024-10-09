package com.TreeNut.ChatBot_Backend.service

import com.TreeNut.ChatBot_Backend.model.GoogleTokenResponse
import com.TreeNut.ChatBot_Backend.model.GoogleUserInfo
import com.TreeNut.ChatBot_Backend.model.GoogleTokenRequest
import com.fasterxml.jackson.databind.ObjectMapper
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import org.springframework.web.util.UriComponentsBuilder
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod

@Service
class AuthService(
    @Value("\${spring.security.oauth2.client.registration.google.client-id}")
    private val googleClientId: String,
    @Value("\${spring.security.oauth2.client.registration.google.client-secret}")
    private val googleClientSecret: String,
    @Value("\${spring.security.oauth2.client.registration.google.redirect-uri}")
    private val googleRedirectUrl: String
) {

    private val objectMapper = ObjectMapper()
    private val restTemplate = RestTemplate()

    fun loginByGoogle(authorizationCode: String): Map<String, Any> {
        println("구글 로그인 시도, 인가 코드: $authorizationCode")

        val googleToken = getGoogleToken(authorizationCode)
        println("구글에서 받은 액세스 토큰: ${googleToken.access_token}")

        val googleUserInfo = getGoogleUserInfo(googleToken.access_token)
        println("구글 사용자 정보: 이메일 = ${googleUserInfo.email}, 이름 = ${googleUserInfo.name}, 사진 URL = ${googleUserInfo.picture}")

        return mapOf(
            "email" to googleUserInfo.email,
            "name" to googleUserInfo.name,
            "picture" to googleUserInfo.picture
        )
    }

    private fun getGoogleToken(authorizationCode: String): GoogleTokenResponse {
        val googleTokenRequest = GoogleTokenRequest(
            code = authorizationCode,
            client_id = googleClientId,
            client_secret = googleClientSecret,
            redirect_uri = googleRedirectUrl
        )

        println("구글 토큰 요청: $googleTokenRequest")

        val getTokenUri = UriComponentsBuilder
            .fromUriString("https://oauth2.googleapis.com")
            .path("/token")
            .encode()
            .build()
            .toUri()

        val googleResponse = restTemplate.postForEntity(getTokenUri, googleTokenRequest, String::class.java)

        println("구글 토큰 응답: ${googleResponse.body}")

        return objectMapper.readValue(googleResponse.body, GoogleTokenResponse::class.java)
    }

    private fun getGoogleUserInfo(accessToken: String): GoogleUserInfo {
        val getTokenInfoUri = UriComponentsBuilder
            .fromUriString("https://www.googleapis.com")
            .path("/oauth2/v2/userinfo")
            .queryParam("access_token", accessToken)
            .encode()
            .build()
            .toUri()

        val headers = HttpHeaders()
        headers.set("Authorization", "Bearer $accessToken")

        val entity = HttpEntity<String>(headers)

        println("구글 사용자 정보 요청 URL: $getTokenInfoUri")
        println("사용할 액세스 토큰: $accessToken")

        val googleTokenInfoResponse = restTemplate.exchange(getTokenInfoUri, HttpMethod.GET, entity, String::class.java)

        println("구글 사용자 정보 응답: ${googleTokenInfoResponse.body}")

        return objectMapper.readValue(googleTokenInfoResponse.body, GoogleUserInfo::class.java)
    }
}
