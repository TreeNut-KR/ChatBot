//잘되는 버전
// https://velog.io/@chrkb1569/OAuth-2.0%EC%9D%84-%ED%99%9C%EC%9A%A9%ED%95%9C-%EB%A1%9C%EA%B7%B8%EC%9D%B8-%EA%B5%AC%ED%98%84
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

    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowCredentials(true)
    }

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http.csrf().disable()
            .authorizeHttpRequests()
            .requestMatchers("/api/auth/google/**").permitAll()
            .anyRequest().authenticated() // 인증이 필요한 URL은 모두 인증 처리
            .and()
            .oauth2Login()
            .defaultSuccessUrl("/index.html", true)  // 로그인 성공 후 리디렉션될 경로 (index.html)
            .failureUrl("/login?error=true")  // 로그인 실패 시 리디렉션될 경로

        return http.build()
    }
}

//테스트버전 

// package com.TreeNut.ChatBot_Backend.config

// import org.springframework.context.annotation.Bean
// import org.springframework.context.annotation.Configuration
// import org.springframework.security.config.annotation.web.builders.HttpSecurity
// import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
// import org.springframework.security.web.SecurityFilterChain
// import org.springframework.web.servlet.config.annotation.CorsRegistry
// import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

// @Configuration
// @EnableWebSecurity
// class SecurityConfig : WebMvcConfigurer {

//     override fun addCorsMappings(registry: CorsRegistry) {
//         registry.addMapping("/api/**")
//             .allowedOrigins("http://localhost")
//             .allowedMethods("GET", "POST", "PUT", "DELETE")
//             .allowCredentials(true)
//     }

//     @Bean
//     fun filterChain(http: HttpSecurity): SecurityFilterChain {
//         http.csrf().disable()
//             .authorizeHttpRequests()
//             .requestMatchers("/auth/**", "/googleLogin", "/error").permitAll()
//             .anyRequest().authenticated()
//             .and()
//             .oauth2Login()
//             // .loginPage("/auth/login") // 커스텀 로그인 페이지
//             .loginPage("/googleLogin")
//             .defaultSuccessUrl("/home", true) // 로그인 성공 후 /home으로 리디렉션
//         return http.build()
//     }
// }

// package com.TreeNut.ChatBot_Backend.config

// import org.springframework.context.annotation.Bean
// import org.springframework.context.annotation.Configuration
// import org.springframework.security.config.annotation.web.builders.HttpSecurity
// import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
// import org.springframework.security.web.SecurityFilterChain
// import org.springframework.web.servlet.config.annotation.CorsRegistry
// import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
// import org.springframework.security.core.Authentication
// import org.springframework.security.oauth2.core.user.OAuth2User
// import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler
// import org.springframework.stereotype.Component
// import javax.servlet.http.HttpServletRequest
// import javax.servlet.http.HttpServletResponse

// @Configuration
// @EnableWebSecurity
// class SecurityConfig : WebMvcConfigurer {

//     override fun addCorsMappings(registry: CorsRegistry) {
//         registry.addMapping("/api/**")
//             .allowedOrigins("http://localhost")
//             .allowedMethods("GET", "POST", "PUT", "DELETE")
//             .allowCredentials(true)
//     }

//     @Bean
//     fun filterChain(http: HttpSecurity): SecurityFilterChain {
//         http.csrf().disable()
//             .authorizeHttpRequests()
//             .requestMatchers("/api/auth/google/**").permitAll()
//             .anyRequest().authenticated() // 인증이 필요한 URL은 모두 인증 처리
//             .and()
//             .oauth2Login()
//             .successHandler(oAuth2LoginSuccessHandler()) // 성공 핸들러 추가
//             .defaultSuccessUrl("/index.html", true)  // 기본 설정 유지
//             .failureUrl("/login?error=true")  // 기본 설정 유지

//         return http.build()
//     }

//     @Bean
//     fun oAuth2LoginSuccessHandler(): OAuth2LoginSuccessHandler {
//         return OAuth2LoginSuccessHandler()
//     }
// }

// @Component
// class OAuth2LoginSuccessHandler : SimpleUrlAuthenticationSuccessHandler() {
//     override fun onAuthenticationSuccess(
//         request: HttpServletRequest,
//         response: HttpServletResponse,
//         authentication: Authentication
//     ) {
//         val oAuth2User = authentication.principal as OAuth2User
//         val attributes = oAuth2User.attributes

//         val email = attributes["email"] as String
//         val name = attributes["name"] as String
//         val picture = attributes["picture"] as String

//         // 사용자 정보를 JSON으로 반환
//         response.contentType = "application/json"
//         response.characterEncoding = "UTF-8"
//         response.writer.write("""
//             {
//                 "email": "$email",
//                 "name": "$name",
//                 "picture": "$picture"
//             }
//         """.trimIndent())
//     }
// }
