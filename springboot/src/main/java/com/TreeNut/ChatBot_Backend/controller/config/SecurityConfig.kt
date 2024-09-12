package com.TreeNut.ChatBot_Backend.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.web.SecurityFilterChain
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
@EnableWebSecurity
class SecurityConfig : WebMvcConfigurer {

    // CORS 설정
    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/**") // 모든 경로에 대해 CORS 설정
            .allowedOrigins("http://localhost:80") // 허용할 출처 (예: React 앱)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // 허용할 HTTP 메서드
            .allowedHeaders("*") // 허용할 헤더
            .allowCredentials(true) // 인증 정보를 포함할 수 있도록 설정
    }

    // 스프링 로그인 보안설정
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .authorizeHttpRequests { authorizeRequests ->
                authorizeRequests
                    .requestMatchers("/", "/login**", "/css/**", "/js/**").permitAll() // 로그인 페이지와 정적 리소스는 허용
                    .anyRequest().authenticated() // 그 외의 모든 요청은 인증 필요
            }
            .oauth2Login { oauth2Login ->
                oauth2Login
                    .loginPage("/login")  // 커스텀 로그인 페이지 설정
                    .defaultSuccessUrl("/", true)  // 로그인 성공 시 리디렉션할 URL
                    .failureUrl("/login?error=true")  // 로그인 실패 시 리디렉션할 URL
            }

        return http.build()
    }
}
