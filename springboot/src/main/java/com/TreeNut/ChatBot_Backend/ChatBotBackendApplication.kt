package com.TreeNut.ChatBot_Backend

import org.springframework.boot.SpringApplication
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration

@SpringBootApplication(exclude = [SecurityAutoConfiguration::class])
class ChatBotBackendApplication

fun main(args: Array<String>) {
    SpringApplication.run(ChatBotBackendApplication::class.java, *args)
}
