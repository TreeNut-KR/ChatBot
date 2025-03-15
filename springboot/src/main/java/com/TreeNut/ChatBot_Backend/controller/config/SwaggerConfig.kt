package com.TreeNut.ChatBot_Backend.config  // 패키지 경로 수정

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SwaggerConfig {
    
    @Bean
    fun openAPI(): OpenAPI = OpenAPI()
        .info(
            Info()
                .title("ChatBot API")
                .description("ChatBot 프로젝트 API 문서")
                .version("v0.4.0")
        )
}