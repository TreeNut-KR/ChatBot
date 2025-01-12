package com.TreeNut.ChatBot_Backend.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity

@Configuration
@EnableWebSecurity
class SecurityConfig : WebMvcConfigurer {
    override fun addCorsMappings(registry: CorsRegistry) {

        registry.addMapping("/**") // 모든 경로에 대해 CORS 설정
            .allowedOrigins(
                "http://localhost:80", //정식 런칭 시 사용 도메인으로 변경
                "http://localhost:8080",
                "http://localhost:3000" //정식 런칭 시 삭제
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
    }

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf().disable()
            .cors().and()
            .authorizeHttpRequests { auth ->
                auth
                    .requestMatchers("/server/user/**", "/oauth2/**", "/oauth/callback/kakao").permitAll()
                    .anyRequest().authenticated()
            }
            .oauth2Login() // OAuth2 로그인 활성화
        return http.build()
    }
}