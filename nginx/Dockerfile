# nginx 베이스 이미지 사용
FROM nginx:latest

# Nginx 설정 파일 복사
COPY ./nginx.conf /etc/nginx/nginx.conf

# 빌드된 리액트 앱 파일 복사
COPY ./frontpage-react/build /usr/share/nginx/html

# 80 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
