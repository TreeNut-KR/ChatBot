plugins {
    kotlin("jvm") version "1.9.10"
    kotlin("plugin.spring") version "1.9.10"
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
    implementation("org.springframework.boot:spring-boot-starter-oauth2-client")
    implementation("org.springframework.security:spring-security-oauth2-jose")
    implementation("org.springframework.security:spring-security-oauth2-core")
    implementation(kotlin("stdlib"))

    // WebFlux 의존성 (Reactive 프로그래밍 및 WebClient)
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("io.projectreactor:reactor-core")
    implementation("io.projectreactor.netty:reactor-netty:1.1.6") // 정확한 버전 명시

    // MySQL Connector 버전
    runtimeOnly("mysql:mysql-connector-java:8.0.33")

    // JWT 토큰 관련 의존성
    implementation("io.jsonwebtoken:jjwt:0.9.1")
    implementation("io.jsonwebtoken:jjwt-api:0.11.5")
    implementation("io.jsonwebtoken:jjwt-impl:0.11.5")
    implementation("io.jsonwebtoken:jjwt-jackson:0.11.5")

    // 서블릿 API (Web 환경에서 필요할 경우 추가)
    implementation("javax.servlet:javax.servlet-api:4.0.1")

    // Kotlin 관련 의존성
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.10")

    // JAXB 관련 의존성 추가 (XML 처리 시 필요할 경우)
    implementation("javax.xml.bind:jaxb-api:2.3.1")
    implementation("org.glassfish.jaxb:jaxb-runtime:2.3.1")

    implementation("com.google.api-client:google-api-client:1.30.10")
    implementation("com.google.apis:google-api-services-drive:v3-rev197-1.25.0")
    implementation("com.google.auth:google-auth-library-oauth2-http:1.25.0")
    implementation("com.google.code.gson:gson:2.11.0")
    
    implementation("org.apache.httpcomponents.client5:httpclient5:5.2")
    
    // 테스트 관련 의존성
    testImplementation("org.springframework.boot:spring-boot-starter-test")
}

tasks.withType<Test> {
    useJUnitPlatform()
}
