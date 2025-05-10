FROM gradle:8.0-jdk17 AS build
WORKDIR /app

# 파일 복사
COPY gradlew .
COPY gradlew.bat .
COPY build.gradle.kts .
COPY gradle/wrapper/gradle-wrapper.jar gradle/wrapper/
COPY gradle/wrapper/gradle-wrapper.properties gradle/wrapper/
COPY src ./src

# 줄바꿈 문자 수정 및 실행 권한 부여
RUN sed -i 's/\r$//' gradlew
RUN chmod +x ./gradlew
RUN ./gradlew build -x test --no-daemon

FROM openjdk:17-jdk-slim

# Netcat 설치
RUN apt-get update && apt-get install -y netcat

# 시간대 설정
RUN apt-get update && apt-get install -y tzdata
RUN ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
ENV TZ=Asia/Seoul

# wait-for-it.sh 복사 및 실행 권한 부여
COPY wait-for-it.sh /wait-for-it
RUN sed -i 's/\r$//' /wait-for-it && chmod +x /wait-for-it

COPY --from=build /app/build/libs/*.jar /app.jar

# 로그 파일 설정
ENTRYPOINT ["./wait-for-it", "mysql:3306", "--", "sh", "-c", "java -Djava.security.egd=file:/dev/./urandom -jar /app.jar --logging.file.name=logs/spring-boot-app.log"]