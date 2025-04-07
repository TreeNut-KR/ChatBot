package com.TreeNut.ChatBot_Backend.middleware

import com.TreeNut.ChatBot_Backend.exceptions.*
import io.jsonwebtoken.*
import io.jsonwebtoken.io.Decoders
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import org.springframework.beans.factory.annotation.Value
import java.security.Key
import javax.crypto.SecretKey
import java.util.*
import org.springframework.util.StringUtils
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.http.HttpHeaders

@Component
class TokenAuth(@Value("\${jwt.secret}") private val jwtSecret: String, @Value("\${google.user-info-url}") private val googleUserInfoUrl: String) {

    private val logger: Logger = LoggerFactory.getLogger(TokenAuth::class.java)

    // ✅ Secret Key 변환 (HS512에 적합한 길이 보장)
    private val key: SecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret))

    fun authGuard(token: String): String? {
        if (!StringUtils.hasText(token)) {
            throw TokenMalformedException("토큰이 존재하지 않습니다.")
        }
        val tokenWithoutBearer = if (token.startsWith("Bearer ")) {
            token.substring(7) // "Bearer " 접두사 제거 (길이: 7)
        } else {
            token
        }
    
        val dotCount = tokenWithoutBearer.count { it == '.' }
    
        return if (dotCount == 2) {
            // JWT 토큰 처리
            try {
                val claims: Claims = Jwts.parser()
                    .setSigningKey(key)
                    .build()
                    .parseSignedClaims(tokenWithoutBearer)
                    .payload
                claims.subject
            } catch (e: ExpiredJwtException) {
                logger.error("Token expired: ${e.message}", e)
                throw TokenExpiredException("시간이 경과하여 로그아웃 되었습니다. 다시 로그인해주세요")
            } catch (e: MalformedJwtException) {
                logger.error("Token malformed: ${e.message}", e)
                throw TokenMalformedException("잘못된 토큰입니다.")
            } catch (e: SignatureException) {
                logger.error("Token signature invalid: ${e.message}", e)
                throw TokenSignatureException("토큰 서명 검증에 실패했습니다.")
            } catch (e: JwtException) {
                logger.error("JWT exception: ${e.message}", e)
                throw TokenJwtException("토큰 처리 중 오류가 발생했습니다: ${e.message}")
            } catch (e: Exception) {
                logger.error("Unknown exception: ${e.message}", e)
                throw RuntimeException("알 수 없는 오류가 발생했습니다: ${e.message}")
            }
        } else if (dotCount == 1) {
            // Google Access Token 처리 (verifyGoogleToken 함수는 별도로 구현해야 함)
            try {
                val userInfo = verifyGoogleToken(tokenWithoutBearer)
                userInfo // Google 사용자 ID 반환
            } catch (e: Exception) {
                logger.error("Google token malformed: ${e.message}", e)
                throw TokenMalformedException("잘못된 토큰입니다.")
            }
        } else {
            // 잘못된 토큰 형식
            logger.error("Invalid token format: Dot count is ${dotCount}")
            throw TokenMalformedException("잘못된 토큰 형식입니다.")
        }
    }

    fun generateToken(userId: String): String {
        return Jwts.builder()
            .setSubject(userId)
            .setIssuedAt(Date())
            .setExpiration(Date(System.currentTimeMillis() + 86400000)) // 1일 후 만료
            .signWith(key, SignatureAlgorithm.HS512)
            .compact()
    }
    fun verifyGoogleToken(accessToken: String): String? {
        val webClient = WebClient.create()
        try {
            val response = webClient.get()
                .uri(googleUserInfoUrl)
                .header(HttpHeaders.AUTHORIZATION, "Bearer $accessToken")
                .retrieve()
                .bodyToMono(Map::class.java)
                .block()

            return response?.get("sub")?.toString()
        } catch (e: Exception) {
            logger.error("구글 토큰 검증 실패: ${e.message}", e)
            return null
        }
    }

    fun getJwtSecret(): String {
        return jwtSecret
    }
}