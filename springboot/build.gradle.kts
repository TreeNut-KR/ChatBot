import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("jvm") version "1.9.10"
    kotlin("plugin.spring") version "1.9.10"
    kotlin("plugin.jpa") version "1.9.10"
    id("org.springframework.boot") version "3.2.2"
    id("io.spring.dependency-management") version "1.1.4"
}

group = "com.TreeNut"
version = "0.0.1-SNAPSHOT"

java {
    sourceCompatibility = JavaVersion.VERSION_17
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring 기본 의존성
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework:spring-context")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.security:spring-security-core")
    implementation("org.springframework.security:spring-security-web")
    implementation("org.springframework.security:spring-security-config")
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.security:spring-security-oauth2-jose")
    implementation("org.springframework.security:spring-security-oauth2-core")
    implementation(kotlin("stdlib"))

    // MySQL Connector: MySQL 5.7 호환 버전
    runtimeOnly("mysql:mysql-connector-java:8.0.28") // ✅ MySQL 5.7과 안정적으로 호환되는 버전

    // Reactor 및 WebFlux 관련 의존성
    implementation("io.projectreactor:reactor-core:3.4.30")
    implementation("io.projectreactor.netty:reactor-netty:1.0.24") // ✅ MySQL 5.7에 적합한 WebFlux 버전
    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // Hibernate와 Jakarta Persistence
    implementation("org.hibernate.orm:hibernate-core:6.2.7.Final") // ✅ Spring Boot 3.x 권장 Hibernate 버전
    implementation("jakarta.persistence:jakarta.persistence-api:3.1.0")

    // JWT 토큰 관련 의존성
    implementation("io.jsonwebtoken:jjwt-api:0.12.3") 
    implementation("io.jsonwebtoken:jjwt-impl:0.12.3")
    implementation("io.jsonwebtoken:jjwt-jackson:0.12.3") 

    // JSON 파싱 라이브러리 (JWT 파싱 관련 문제 방지)
    implementation("com.fasterxml.jackson.core:jackson-databind:2.15.0")
    
    // 서블릿 API (✅ Spring Boot 3.x에서는 Jakarta 버전만 필요)
    implementation("jakarta.servlet:jakarta.servlet-api:6.0.0")

    // Kotlin 관련 의존성
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.10")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")

    // Google API 의존성
    implementation("com.google.api-client:google-api-client:1.30.10")
    implementation("com.google.apis:google-api-services-drive:v3-rev197-1.25.0")
    implementation("com.google.auth:google-auth-library-oauth2-http:1.25.0")
    implementation("com.google.code.gson:gson:2.10.1") // ✅ 최신 버전 적용

    // HTTP Client
    implementation("org.apache.httpcomponents.client5:httpclient5:5.2")

    // 테스트 관련 의존성
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<Test> {
    useJUnitPlatform()
}

tasks.withType<KotlinCompile> {
    kotlinOptions {
        freeCompilerArgs = listOf("-Xjsr305=strict")
        jvmTarget = "17"
    }
}