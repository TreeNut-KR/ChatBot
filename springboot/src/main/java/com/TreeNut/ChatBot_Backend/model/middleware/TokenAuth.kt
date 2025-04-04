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

@Component
class TokenAuth(@Value("\${jwt.secret}") private val jwtSecret: String) {

    // ✅ Secret Key 변환 (HS512에 적합한 길이 보장)
    private val key: SecretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)) // padEnd 제거

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
            val claims: Claims = Jwts.parserBuilder() // Jwts.parser() -> Jwts.parserBuilder() 변경
                .setSigningKey(key)
                .build()
                .parseClaimsJws(tokenWithoutBearer) // parseSignedClaims(token) -> parseClaimsJws(token) 변경
                .body // .payload -> .body 변경
            claims.subject
        } catch (e: ExpiredJwtException) {
            throw TokenExpiredException("시간이 경과하여 로그아웃 되었습니다. 다시 로그인해주세요")
        } catch (e: MalformedJwtException) {
            throw TokenMalformedException("잘못된 토큰입니다.")
        } catch (e: SignatureException) {
            throw TokenSignatureException("토큰 서명 검증에 실패했습니다.")
        } catch (e: JwtException) {
            throw TokenJwtException("토큰 처리 중 오류가 발생했습니다: ${e.message}")
        } catch (e: Exception) {
            throw RuntimeException("알 수 없는 오류가 발생했습니다: ${e.message}")
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

    fun getJwtSecret(): String {
        return jwtSecret
    }
}