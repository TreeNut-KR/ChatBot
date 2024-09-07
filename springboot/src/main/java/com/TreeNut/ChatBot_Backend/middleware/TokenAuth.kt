package com.TreeNut.ChatBot_Backend.middleware

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureException
import org.springframework.stereotype.Component

@Component
class TokenAuth(private val jwtSecret: String) {

    fun authGuard(token: String): Long? {
        return try {
            val claims: Claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .body

            // 토큰의 subject에서 idx를 반환
            claims.subject?.toLong() // idx를 Long으로 변환하여 반환
        } catch (e: SignatureException) {
            // 서명 검증 실패: 예외 처리
            null
        } catch (e: Exception) {
            // 다른 예외 처리
            null
        }
    }
}
