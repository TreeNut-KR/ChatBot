package com.TreeNut.ChatBot_Backend.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.oauth2.client.web.OAuth2LoginAuthenticationFilter

@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
    .cors().and()
    .csrf().disable()
    .authorizeHttpRequests { authz ->
        authz
            .requestMatchers("/login", "/register", "/social/kakao/callback").permitAll()
            .anyRequest().authenticated()
    }
    .oauth2Login { oauth2 -> oauth2.loginPage("/login") }
        return http.build()
    }

    @Bean
    fun corsConfigurationSource(): org.springframework.web.cors.CorsConfigurationSource {
        val corsConfig = org.springframework.web.cors.CorsConfiguration()
        corsConfig.allowedOrigins = listOf("http://localhost:80")  // React 앱의 URL
        corsConfig.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "OPTIONS")
        corsConfig.allowedHeaders = listOf("*")
        corsConfig.allowCredentials = true

        val source = org.springframework.web.cors.UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", corsConfig)  // 모든 경로에 대해 CORS 설정

        return source
    }
}
