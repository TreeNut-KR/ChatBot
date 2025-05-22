## 📢 개요
- **API 이름**: UserController
- **설명**: 사용자 인증, 회원가입, 정보 관리, 소셜 로그인, 이메일 인증 등 사용자 관련 기능 제공

---

## 📍 엔드포인트 목록

### 🔹 회원가입 및 로그인

#### 📌 회원가입
- **`POST /server/user/register`**
  - **설명**: 새로운 사용자를 등록합니다.
  - **요청 본문**
    ```json
    {
      "name": "test",
      "id": "test1234",
      "email": "test@example.com",
      "pw": "1234",
      "privacy_policy": "true",
      "terms_of_service": "true"
    }
    ```
    | 필드명           | 타입    | 필수 | 설명                |
    |------------------|---------|------|---------------------|
    | name             | string  | 예   | 사용자 이름         |
    | id               | string  | 예   | 사용자 ID           |
    | email            | string  | 예   | 이메일              |
    | pw               | string  | 예   | 비밀번호           |
    | privacy_policy   | boolean | 예   | 개인정보 처리 동의  |
    | terms_of_service | boolean | 예   | 서비스 이용약관 동의|
  - **응답 예시**
    ```json
    {
      "status": 200,
      "token": "jwt-token",
      "name": "test"
    }
    ```

#### 📌 일반 로그인
- **`POST /server/user/login`**
  - **설명**: ID와 비밀번호로 로그인합니다.
  - **요청 본문**
    ```json
    {
      "id": "test1234",
      "pw": "1234"
    }
    ```
    | 필드명 | 타입   | 필수 | 설명      |
    |--------|--------|------|-----------|
    | id     | string | 예   | 사용자 ID |
    | pw     | string | 예   | 비밀번호  |
  - **응답 예시**
    ```json
    {
      "token": "jwt-token",
      "name": "홍길동"
    }
    ```

#### 📌 회원 탈퇴
- **`DELETE /server/user/delete/{userid}`**
  - **설명**: 지정한 사용자를 삭제합니다.
  - **경로 매개변수**
    | 매개변수 | 설명      |
    |----------|-----------|
    | userid   | 사용자 ID |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "User deleted successfully"
    }
    ```

---

### 🔹 소셜 로그인

#### 📌 카카오 소셜 로그인
- **`POST /server/user/social/kakao/login`**
  - **설명**: 카카오 인가 코드로 소셜 로그인을 처리합니다.
  - **요청 본문**
    ```json
    {
      "code": "kakao_auth_code",
      "redirect_uri":
    }
    ```
    | 필드명 | 타입   | 필수 | 설명           |
    |--------|--------|------|----------------|
    | code   | string | 예   | 카카오 인가 코드|
  - **응답 예시**
    ```json
    {
      "status": 200,
      "token": "jwt-token",
      "message": "카카오 로그인 성공"
    }
    ```

#### 📌 카카오 OAuth 콜백
- **`GET /server/user/oauth/callback/kakao?code=...`**
  - **설명**: 카카오 인가 코드 콜백 처리 (프론트에서 직접 호출 시 사용)
  - **응답 예시**: 위와 동일

#### 📌 구글 소셜 로그인
- **`POST /server/user/social/google/login`**
  - **설명**: 구글 인가 코드로 소셜 로그인을 처리합니다.
  - **요청 본문**
    ```json
    {
      "code": "google_auth_code",
      "redirect_uri": "https://treenut.ddns.net/server/oauth/callback/google"
    }
    ```
    | 필드명      | 타입   | 필수 | 설명                |
    |-------------|--------|------|---------------------|
    | code        | string | 예   | 구글 인가 코드      |
    | redirect_uri| string | 아니오| 리다이렉트 URI (선택)|
  - **응답 예시**
    ```json
    {
      "status": 200,
      "token": "jwt-token",
      "message": "구글 로그인 성공"
    }
    ```

#### 📌 구글 OAuth 콜백
- **`GET /server/user/oauth/callback/google?code=...`**
  - **설명**: 구글 인가 코드 콜백 처리 (프론트에서 직접 호출 시 사용)
  - **응답 예시**: 위와 동일

---

### 🔹 사용자 정보

#### 📌 내 정보 조회
- **`GET /server/user/findmyinfo`**
  - **설명**: 토큰 기반으로 내 이름, 아이디, 이메일을 조회합니다.
  - **헤더**
    | 필드명        | 타입   | 필수 | 설명           |
    |---------------|--------|------|----------------|
    | Authorization | string | 예   | JWT 인증 토큰  |
  - **응답 예시**
    ```json
    {
      "name": "test",
      "userid": "test1234",
      "email": "test@example.com"
    }
    ```

#### 📌 이름 변경
- **`POST /server/user/changeUsername`**
  - **설명**: 사용자 이름을 변경합니다.
  - **헤더**
    | 필드명        | 타입   | 필수 | 설명           |
    |---------------|--------|------|----------------|
    | Authorization | string | 예   | JWT 인증 토큰  |
  - **요청 본문**
    ```json
    {
      "name": "새이름"
    }
    ```
    | 필드명 | 타입   | 필수 | 설명      |
    |--------|--------|------|-----------|
    | name   | string | 예   | 변경할 이름|
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "User information updated successfully"
    }
    ```

#### 📌 멤버십 조회
- **`GET /server/user/membership`**
  - **설명**: 내 멤버십 등급을 조회합니다.
  - **헤더**
    | 필드명        | 타입   | 필수 | 설명           |
    |---------------|--------|------|----------------|
    | Authorization | string | 예   | JWT 인증 토큰  |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "membership": "멤버십 등급"
    }
    ```

---

### 🔹 이메일 인증

#### 📌 인증 메일 발송
- **`POST /server/user/email/Verification`**
  - **설명**: 인증 메일을 발송합니다.
  - **헤더**
    | 필드명        | 타입   | 필수 | 설명           |
    |---------------|--------|------|----------------|
    | Authorization | string | 예   | JWT 인증 토큰  |
  - **요청 본문**
    ```json
    {
      "email": "test@example.com"
    }
    ```
    | 필드명 | 타입   | 필수 | 설명      |
    |--------|--------|------|-----------|
    | email  | string | 예   | 이메일    |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "인증 메일이 발송되었습니다."
    }
    ```

#### 📌 인증 코드 확인
- **`POST /server/user/email/verify-code`**
  - **설명**: 인증 코드를 확인합니다.
  - **헤더**
    | 필드명        | 타입   | 필수 | 설명           |
    |---------------|--------|------|----------------|
    | Authorization | string | 예   | JWT 인증 토큰  |
  - **요청 본문**
    ```json
    {
      "email": "test@example.com",
      "code": "123456"
    }
    ```
    | 필드명 | 타입   | 필수 | 설명      |
    |--------|--------|------|-----------|
    | email  | string | 예   | 이메일    |
    | code   | string | 예   | 인증 코드 |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "이메일 인증이 완료되었습니다."
    }
    ```

---

## 🛠 응답 구조 및 오류 처리

### 일반 응답
- **정상 응답**: HTTP 상태 코드 200과 함께 요청에 대한 성공 응답 데이터 제공
- **오류 응답**: HTTP 상태 코드와 함께 오류 상세 정보 제공

### 주요 오류 코드
- **400**: Bad Request - 잘못된 요청 형식 또는 필요한 데이터 누락
- **401**: Unauthorized - 인증 실패 또는 토큰 없음
- **403**: Forbidden - 접근 권한 없음
- **404**: Not Found - 요청한 리소스를 찾을 수 없음
- **500**: Internal Server Error - 서버 내부 오류

---

## 📑 특이사항

- **JWT 인증 필수**: 대부분의 API는 Authorization 헤더에 JWT 토큰이 필요합니다.
- **소셜 로그인**: 카카오/구글 인가 코드를 받아 자체 JWT 토큰을 발급합니다.
- **회원가입 시 약관 동의 필수**: privacy_policy, terms_of_service 모두 true여야 가입 가능.
- **이메일 인증**: 이메일 인증 기능 제공(발송/코드 확인).
- **응답 메시지**: status, message, token 등 일관된 구조로 반환.

---