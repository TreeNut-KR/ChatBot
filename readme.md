
# ChatBot 프로젝트

[![alt text](https://lh3.googleusercontent.com/d/1H62LOQ8yeql3HQ5OZT4fIzdydTdMhbiw)](https://treenut.ddns.net)

<div align="center">
  <a href="https://github.com/TreeNut-KR/ChatBot">
    <img src="https://github-readme-stats.vercel.app/api/pin/?username=TreeNut-KR&repo=ChatBot&theme=dark&show_owner=true" alt="ChatBot Repository"/>
  </a>
</div>

<br>

---

<br>

# 프로젝트 구성원

| 구성원 | 업무 | 사용 기술 |  
|--------|--------|------------|  
| 김준건 (jgkim14) | 백엔드 | Spring Boot, Node.js |  
| 서정훈 (CutTheWire) | 프로젝트 매니저, 백엔드 | Spring Boot, FastAPI |  
| 이준호 (qwer9679) | 백엔드 | Spring Boot, FastAPI |  
| 모현준 (Flattt12) | 백엔드 | Spring Boot |  
| 권재현 (donismoney) | 백엔드 | Spring Boot |  
| 손유노 (GingGang) | 프론트엔드 | React, TypeScript |

## 🏗️ 전체 아키텍처

- **nginx**: API Gateway 및 웹 서버 (443 포트, HTTPS 지원)
    - React 프론트엔드 정적 파일 서빙
    - FastAPI/Spring Boot 백엔드 프록시 역할
- **FastAPI**: Python 백엔드 API 서버 (8000 포트)
    - Google SMTP 연동 및 MySQL로 이메일 인증 정보 저장
    - 채팅방 CRUD 기능 MongoDB 사용
- **SpringBoot**: Java 백엔드 API 서버 (8080 포트)
    - AI용 API(FastAPI)와 채팅방, SMTP용 API(FastAPI) 통합 관리
    - 소셜 로그인 및 사용자 인증 처리
    - 케릭터 챗봇 CRUD 기능
- **admincontroller**: Node.js 관리자 컨트롤러 (5785 포트)
    - GCP 연결, 클라우드에 저장된 이미지 관리
- **mysql**: 관계형 데이터베이스 (3308 포트)
    - 유저, 유저의 채팅방 정보, 유저의 캐릭터, SMTP 이메일 인증 정보 저장
- **mongodb**: NoSQL 데이터베이스 (27017 포트)
    - 채팅방 메시지 저장
- **flyway**: 데이터베이스 마이그레이션 도구
    - MySQL 스키마 버전 관리

## 📋 시스템 아키텍처 다이어그램
![System-Architecture-Diagram-ChatBot](https://cutwire.myddns.me/images/System-Architecture-Diagram-ChatBot.webp)

## 📋 Hybrid ERD
![Hybrid-ERD-ChatBot](https://cutwire.myddns.me/images/Hybrid-ERD-ChatBot.webp)

## 🌐 API Gateway (nginx) 구조

- **정적 파일 서빙**: React 빌드 결과물과 정적 리소스 제공
    - `/static/` → 정적 파일 (7일 캐시)
    - CSS, JS, 이미지 파일 등 (30일 캐시)
- **API 라우팅**:
    - `/` → React SPA (index.html 폴백)
    - `/sub/` → FastAPI 서버(8000)로 프록시
    - `/server` → Spring Boot 서버(8080)로 프록시
- **OAuth 인증 처리**:
    - `/auth/` → 인증 관련 요청 처리
    - Google, Facebook 등 외부 인증 제공자와 연동
    - JWT 토큰 발급 및 검증
- **CORS 설정**:
    - 모든 도메인에서의 요청 허용
    - 인증 정보 포함 요청에 대한 처리
- **에러 핸들링**:
    - 404 에러 페이지 설정
    - 서버 에러 시 일반화된 에러 메시지 반환

## 📅 개발 로드맵 및 버전 릴리즈 일정

### 간트 차트 (ChatBot 버전 릴리즈)
![Gantt-Chart-ChatBot](https://cutwire.myddns.me/images/Gantt-Chart-ChatBot.webp)

### 주요 마일스톤

| 버전 | 기간 | 주요 성과 | 아키텍처 변화 |
|------|------|-----------|---------------|
| **v0.1.x** | 2024.08-2024.09 | FastAPI + MongoDB, 채팅 로그 시스템 | 단일 서비스 아키텍처 |
| **v0.2.x** | 2024.09-2024.10 | Spring Boot 통합, 캐릭터 관리 | 다중 서비스 아키텍처 |
| **v0.3.x** | 2024.10-2025.03 | AI API 연동, GitHub Actions | AI 통합 플랫폼 |
| **v0.4.x** | 2025.03-2025.05 | React 프론트엔드, 소셜 로그인 | 풀스택 웹 플랫폼 |
| **v0.5.x** | 2025.05 | 클린 아키텍처, DI 패턴 | API 설계 패턴 혁신 |
| **v1.0.x** | 2025.05-2025.06 | Flyway 마이그레이션, 프로덕션 최적화 | 엔터프라이즈급 완성 |
| **v1.1.x** | 2025.06-2025.07 | 모바일 UI 최적화, 사용자 경험 개선 | 사용자 중심 설계 |

### 개발 통계

- **총 개발 기간**: 12개월 (2024.07 ~ 2025.07)
- **메이저 버전**: 7개 (v0.1.x ~ v1.1.x)
- **릴리즈 횟수**: 27회
- **주요 기술 전환**: 6회 (단일→다중→AI통합→풀스택→클린→엔터프라이즈→모바일)

## 🗓️ 버전별 명세

### 📄 v0.1.x
<div align="left">
    <a href="https://cutwire.myddns.me/portfolio/reference/chatbot/version(0.1.x).md">
        <img src="https://img.shields.io/badge/명세-상세보기-blue?style=for-the-badge&logo=markdown" alt="명세 상세보기"/>
    </a>
</div>

- `First Commit Days` : 2024-08-27 (화) 15:35:49 (한국 표준시)
- `Last Commit Days` : 2024-09-03 (화) 17:08:48 (한국 표준시)

### 📄 v0.2.x
<div align="left">
    <a href="https://cutwire.myddns.me/portfolio/reference/chatbot/version(0.2.x).md">
        <img src="https://img.shields.io/badge/명세-상세보기-blue?style=for-the-badge&logo=markdown" alt="명세 상세보기"/>
    </a>
</div>

- `First Commit Days` : 2024-09-10 (화) 01:50:24 (한국 표준시)
- `Last Commit Days` : 2024-10-26 (토) 16:58:55 (한국 표준시)

### 📄 v0.3.x
<div align="left">
    <a href="https://cutwire.myddns.me/portfolio/reference/chatbot/version(0.3.x).md">
        <img src="https://img.shields.io/badge/명세-상세보기-blue?style=for-the-badge&logo=markdown" alt="명세 상세보기"/>
    </a>
</div>

- `First Commit Days` : 2024-10-31 (목) 14:10:45 (한국 표준시)
- `Last Commit Days` : 2025-03-13 (목) 15:58:41 (한국 표준시)

### 📄 v0.4.x
<div align="left">
    <a href="https://cutwire.myddns.me/portfolio/reference/chatbot/version(0.4.x).md">
        <img src="https://img.shields.io/badge/명세-상세보기-blue?style=for-the-badge&logo=markdown" alt="명세 상세보기"/>
    </a>
</div>

- `First Commit Days` : 2025-03-15 (토) 17:08:51 (한국 표준시)
- `Last Commit Days` : 2025-05-10 (토) 09:05:10 (한국 표준시)

### 📄 v0.5.x
<div align="left">
    <a href="https://cutwire.myddns.me/portfolio/reference/chatbot/version(0.5.x).md">
        <img src="https://img.shields.io/badge/명세-상세보기-blue?style=for-the-badge&logo=markdown" alt="명세 상세보기"/>
    </a>
</div>

- `First Commit Days` : 2025-05-10 (토) 13:59:33 (한국 표준시)
- `Last Commit Days` : 2025-05-10 (토) 19:36:21 (한국 표준시)

### 📄 v1.0.x
<div align="left">
    <a href="https://cutwire.myddns.me/portfolio/reference/chatbot/version(1.0.x).md">
        <img src="https://img.shields.io/badge/명세-상세보기-blue?style=for-the-badge&logo=markdown" alt="명세 상세보기"/>
    </a>
</div>

- `First Commit Days` : 2025-05-10 (토) 20:44:08 (한국 표준시)
- `Last Commit Days` : 2025-06-19 (목) 20:20:14 (한국 표준시)

### 📄 v1.1.x
<div align="left">
    <a href="https://cutwire.myddns.me/portfolio/reference/chatbot/version(1.1.x).md">
        <img src="https://img.shields.io/badge/명세-상세보기-blue?style=for-the-badge&logo=markdown" alt="명세 상세보기"/>
    </a>
</div>

- `First Commit Days` : 2025-06-19 (목) 21:16:29 (한국 표준시)
- `Last Commit Days` : 2025-07-10 (목) 13:40:59 (한국 표준시)