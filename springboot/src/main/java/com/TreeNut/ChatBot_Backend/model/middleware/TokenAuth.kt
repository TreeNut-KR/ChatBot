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

@Component
class TokenAuth(@Value("\${jwt.secret}") private val jwtSecret: String) {

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
            val claims: Claims = Jwts.parser()
                .setSigningKey(key)
                .build()
                .parseSignedClaims(tokenWithoutBearer) // 수정된 토큰 사용
                .payload
            claims.subject
        } catch (e: MalformedJwtException) {
            // Google Access Token 검증
            val userInfo = verifyGoogleToken(tokenWithoutBearer)
            if (userInfo != null) {
                return userInfo // Google 사용자 ID 반환
            } else {
                logger.error("Google token malformed: ${e.message}", e)
                throw TokenMalformedException("잘못된 토큰입니다.")
            }
        } catch (e: ExpiredJwtException) {
            logger.error("Token expired: ${e.message}", e) // 로그 추가
            throw TokenExpiredException("시간이 경과하여 로그아웃 되었습니다. 다시 로그인해주세요")
        } catch (e: SignatureException) {
            logger.error("Token signature invalid: ${e.message}", e) // 로그 추가
            throw TokenSignatureException("토큰 서명 검증에 실패했습니다.")
        } catch (e: JwtException) {
            logger.error("JWT exception: ${e.message}", e) // 로그 추가
            throw TokenJwtException("토큰 처리 중 오류가 발생했습니다: ${e.message}")
        } catch (e: Exception) {
            logger.error("Unknown exception: ${e.message}", e) // 로그 추가
            throw RuntimeException("알 수 없는 오류가 발생했습니다: ${e.message}")
        }
    }

    fun verifyGoogleToken(accessToken: String): String {
        val webClient = WebClient.create()
        return webClient.get()
            .uri(googleUserInfoUrl)
            .header("Authorization", "Bearer $accessToken")
            .retrieve()
            .bodyToMono(Map::class.java)
            .block()?.get("sub")?.toString() ?: throw RuntimeException("Failed to retrieve Google user info")
    }

    fun verifyGoogleToken(accessToken: String): String? {
        val webClient = WebClient.create()
        return webClient.get()
            .uri(googleUserInfoUrl)
            .header("Authorization", "Bearer $accessToken")
            .retrieve()
            .bodyToMono(Map::class.java)
            .block()?.get("sub")?.toString()
    }

    fun getJwtSecret(): String {
        return jwtSecret
    }
}