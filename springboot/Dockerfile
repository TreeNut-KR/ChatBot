# 1단계: Gradle 빌드를 위한 이미지
FROM gradle:8.0-jdk17 AS build

# 작업 디렉토리 설정
WORKDIR /app

# Gradle Wrapper 및 build.gradle.kts 파일 복사
COPY gradlew . 
COPY gradlew.bat . 
COPY build.gradle.kts . 
COPY gradle/wrapper/gradle-wrapper.jar gradle/wrapper/gradle-wrapper.jar
COPY gradle/wrapper/gradle-wrapper.properties gradle/wrapper/gradle-wrapper.properties

# 소스 파일 복사
COPY src ./src

# Gradle 빌드 실행 (테스트 건너뜀)
RUN ./gradlew build -x test --no-daemon

# 2단계: 최종 이미지
FROM openjdk:17-jdk-slim

# 빌드된 JAR 파일 복사
COPY --from=build /app/build/libs/*.jar app.jar

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app.jar"]
