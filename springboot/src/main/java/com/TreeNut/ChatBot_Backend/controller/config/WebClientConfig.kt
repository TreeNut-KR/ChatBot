package com.TreeNut.ChatBot_Backend.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.reactive.function.client.WebClient
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import reactor.netty.http.client.HttpClient
import java.time.Duration

@Configuration
class WebClientConfig {

    @Bean
    fun webClientBuilder(): WebClient.Builder {
        val httpClient = HttpClient.create()
            .responseTimeout(Duration.ofSeconds(360)) // 응답 타임아웃을 60초로 설정

        return WebClient.builder()
            .baseUrl("http://fastapi:8000") // 기본 URL 설정
            .clientConnector(ReactorClientHttpConnector(httpClient)) // 커넥터에 타임아웃 설정 적용
    }
}