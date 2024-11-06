package org.project.oauth.service.social

import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Component
import org.springframework.web.client.RestTemplate
import java.io.BufferedOutputStream
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

@Component
class GoogleOauth : SocialOauth {

    @Value("\${spring.security.oauth2.client.provider.google.authorization-uri}")
    private lateinit var googleSnsBaseUrl: String

    @Value("\${spring.security.oauth2.client.registration.google.client-id}")
    private lateinit var googleSnsClientId: String

    @Value("\${spring.security.oauth2.client.registration.google.redirect-uri}")
    private lateinit var googleSnsCallbackUrl: String

    @Value("\${spring.security.oauth2.client.registration.google.client-secret}")
    private lateinit var googleSnsClientSecret: String

    @Value("\${spring.security.oauth2.client.provider.google.token-uri}")
    private lateinit var googleSnsTokenBaseUrl: String

    override fun getOauthRedirectURL(): String {
        val params = mapOf(
            "scope" to "profile",
            "response_type" to "code",
            "client_id" to googleSnsClientId,
            "redirect_uri" to googleSnsCallbackUrl
        )

        val parameterString = params.map { "${it.key}=${it.value}" }.joinToString("&")
        return "$googleSnsBaseUrl?$parameterString"
    }

    override fun requestAccessToken(code: String): String {
        val restTemplate = RestTemplate()

        val params = mapOf(
            "code" to code,
            "client_id" to googleSnsClientId,
            "client_secret" to googleSnsClientSecret,
            "redirect_uri" to googleSnsCallbackUrl,
            "grant_type" to "authorization_code"
        )

        val responseEntity: ResponseEntity<String> = restTemplate.postForEntity(googleSnsTokenBaseUrl, params, String::class.java)

        return if (responseEntity.statusCode == HttpStatus.OK) {
            responseEntity.body ?: "구글 로그인 요청 처리 실패"
        } else {
            "구글 로그인 요청 처리 실패"
        }
    }

    fun requestAccessTokenUsingURL(code: String): String {
        return try {
            val url = URL(googleSnsTokenBaseUrl)
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
            conn.doOutput = true

            val params = mapOf(
                "code" to code,
                "client_id" to googleSnsClientId,
                "client_secret" to googleSnsClientSecret,
                "redirect_uri" to googleSnsCallbackUrl,
                "grant_type" to "authorization_code"
            )

            val parameterString = params.map { "${it.key}=${it.value}" }.joinToString("&")

            BufferedOutputStream(conn.outputStream).use { it.write(parameterString.toByteArray()) }

            val response = StringBuilder()
            BufferedReader(InputStreamReader(conn.inputStream)).use { reader ->
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    response.append(line)
                }
            }

            if (conn.responseCode == HttpStatus.OK.value()) {
                response.toString()
            } else {
                "구글 로그인 요청 처리 실패"
            }
        } catch (e: IOException) {
            throw IllegalArgumentException("알 수 없는 구글 로그인 Access Token 요청 URL 입니다 :: $googleSnsTokenBaseUrl", e)
        }
    }
}
//완