package com.TreeNut.ChatBot_Backend.middleware

import com.TreeNut.ChatBot_Backend.exceptions.*
import io.jsonwebtoken.Claims
import io.jsonwebtoken.ExpiredJwtException
import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.MalformedJwtException
import io.jsonwebtoken.SignatureException
import org.springframework.stereotype.Component
import org.springframework.beans.factory.annotation.Value

@Component
class TokenAuth(@Value("\${jwt.secret}") private val jwtSecret: String) {

    fun authGuard(token: String): String? {
        return try {
            val claims: Claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .body
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
        fun getJwtSecret(): String {
        return jwtSecret
    }    
}
