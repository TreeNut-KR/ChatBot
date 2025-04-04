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

@Component
class TokenAuth(
    @Value("\${jwt.secret}") private val jwtSecret: String,
    @Value("\${google.user-info-url}") private val googleUserInfoUrl: String // Google userinfo 엔드포인트
) {

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
        return try {
            // JWT 토큰 검증
            val claims: Claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(tokenWithoutBearer)
                .body
            claims.subject
        } catch (e: MalformedJwtException) {
            // Google Access Token 검증
            try {
                val userInfo = verifyGoogleToken(tokenWithoutBearer)
                userInfo // Google 사용자 ID 반환
            } catch (e: Exception) {
                logger.error("Google token malformed: ${e.message}", e)
                throw TokenMalformedException("잘못된 토큰입니다.")
            }
        } catch (e: ExpiredJwtException) {
            logger.error("Token expired: ${e.message}", e)
            throw TokenExpiredException("시간이 경과하여 로그아웃 되었습니다. 다시 로그인해주세요")
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
    }

    // Google Access Token 검증 및 사용자 정보 가져오기
    private fun verifyGoogleToken(accessToken: String): String {
        val webClient = WebClient.create()
        return webClient.get()
            .uri(googleUserInfoUrl)
            .header("Authorization", "Bearer $accessToken")
            .retrieve()
            .bodyToMono(Map::class.java)
            .block()?.get("sub")?.toString() ?: throw RuntimeException("Failed to retrieve Google user info")
    }

    fun generateToken(userId: String): String {
        return Jwts.builder()
            .setSubject(userId)
            .setIssuedAt(Date())
            .setExpiration(Date(System.currentTimeMillis() + 86400000)) // 1일 후 만료
            .signWith(key, SignatureAlgorithm.HS512)
            .compact()
    }

    fun getJwtSecret(): String {
        return jwtSecret
    }
}