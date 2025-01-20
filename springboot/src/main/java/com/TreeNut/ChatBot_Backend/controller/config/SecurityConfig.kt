package com.TreeNut.ChatBot_Backend.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.AuthenticationEntryPoint
import org.springframework.security.config.http.SessionCreationPolicy // SessionCreationPolicy import 추가

@Configuration
@EnableWebSecurity
class SecurityConfig : WebMvcConfigurer {

    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/**")
            .allowedOrigins("http://localhost") // Nginx(React)에서 오는 요청 허용
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true) // 인증 포함 (JWT 등)
    }

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf().disable()
            .cors().and()
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers(
                        "/server/user/register",
                        "/server/user/login",
                        "/server/user/social/kakao/login", 
                        "/oauth/callback/kakao",
                        "/server/oauth/callback/kakao",
                        "/server/user/social/kakao/**",
                        "/login/oauth2/code/kakao",
                        // 추가
                        "/oauth/**",  // 모든 OAuth 관련 경로 허용
                        "/callback/**" // 모든 callback 경로 허용
                    ).permitAll()
                    .anyRequest().authenticated()
            }
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)

        return http.build()
    }

    @Bean
    fun customAuthenticationEntryPoint(): AuthenticationEntryPoint {
        return AuthenticationEntryPoint { _, response, _ ->
            response.contentType = "application/json"
            response.status = 401
            response.writer.write("{\"status\": 401, \"message\": \"Unauthorized: 인증이 필요합니다.\"}")
        }
    }
}