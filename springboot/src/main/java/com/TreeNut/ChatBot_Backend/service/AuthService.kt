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
        val googleToken = getGoogleToken(authorizationCode)
        val googleUserInfo = getGoogleUserInfo(googleToken.access_token)
        println("구글 액세스 토큰 : ${googleToken.access_token}")

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

        val getTokenUri = UriComponentsBuilder
            .fromUriString("https://oauth2.googleapis.com")
            .path("/token")
            .encode()
            .build()
            .toUri()

        val googleResponse = restTemplate.postForEntity(getTokenUri, googleTokenRequest, String::class.java)
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
        val googleTokenInfoResponse = restTemplate.exchange(getTokenInfoUri, HttpMethod.GET, entity, String::class.java)
        return objectMapper.readValue(googleTokenInfoResponse.body, GoogleUserInfo::class.java)
    }
}
