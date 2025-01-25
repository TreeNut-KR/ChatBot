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
            .allowedOrigins("http://localhost")
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
                    .requestMatchers(
                        "/",
                        "/static/**",
                        "/server/user/register",
                        "/server/user/login",
                        "/server/user/social/kakao/login", 
                        "/server/oauth/callback/kakao",  // 콜백 URL
                        "/server/oauth/callback/kakao/**",  // 와일드카드 추가
                        "/server/user/social/kakao/**",
                        "/oauth/**",
                        "/callback/**"
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