plugins {
    kotlin("jvm") version "2.0.20" // 최신 안정 버전으로 업데이트
    kotlin("plugin.spring") version "2.0.20" // 동일하게 업데이트
    id("org.springframework.boot") version "3.3.3"
    id("io.spring.dependency-management") version "1.1.6"
}

group = "com.TreeNut"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework:spring-context")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.security:spring-security-core")
    implementation("org.springframework.security:spring-security-web")
    implementation(kotlin("stdlib"))

    // WebFlux 의존성 (Reactive 프로그래밍 및 WebClient)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")
    implementation("org.springframework.boot:spring-boot-starter-webflux")

    // MySQL Connector 버전
    runtimeOnly("mysql:mysql-connector-java:8.0.33")

    // JWT 토큰 관련 의존성
    implementation("io.jsonwebtoken:jjwt:0.9.1")

    // 서블릿 API (Web 환경에서 필요할 경우 추가)
    implementation("javax.servlet:javax.servlet-api:4.0.1")

    // Kotlin 관련 의존성
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib")

    // JAXB 관련 의존성 추가 (XML 처리 시 필요할 경우)
    implementation("javax.xml.bind:jaxb-api:2.3.1")
    implementation("org.glassfish.jaxb:jaxb-runtime:2.3.1")

    // 테스트 관련 의존성
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<Test> {
    useJUnitPlatform()
}