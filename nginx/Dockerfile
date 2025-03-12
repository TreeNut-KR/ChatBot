# nginx 베이스 이미지 사용
FROM nginx:latest

# Debian 기반 nginx 이미지용 시간대 설정
RUN apt-get update && apt-get install -y tzdata
RUN ln -sf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
ENV TZ=Asia/Seoul

# Nginx 설정 파일 복사
COPY ./nginx.conf /etc/nginx/nginx.conf

# 빌드된 리액트 앱 파일 복사
COPY ./react-frontpage/build /usr/share/nginx/html

# 80 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
