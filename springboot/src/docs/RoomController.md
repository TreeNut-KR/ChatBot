## 📢 개요
- **API 이름**: RoomController
- **설명**: 채팅방 및 대화 관리 API

이 API는 Office 모드와 Character 모드의 채팅방을 생성, 관리하고 대화 기록을 저장, 조회, 수정, 삭제하는 기능을 제공합니다.

---

## 📍 엔드포인트 목록

### 🔹 Office 채팅방 (정보 제공 모드)

#### 📌 Office 채팅방 생성
- **`POST /server/rooms/office`**
  - **설명**: 새로운 Office 채팅방을 생성합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "채팅방이 성공적으로 생성되었습니다.",
      "mysql_officeroom": {
        "idx": 3,
        "userid": "test_VIP",
        "mongo_chatroomid": "8430b4dc-45a0-47ba-a3e4-a7d01edbfcf3",
        "createdAt": "2025-03-24T17:54:32.230555456",
        "updatedAt": "2025-03-24T17:54:32.230581553"
      }
    }
    ```

#### 📌 Office 채팅방 목록 조회
- **`GET /server/rooms/office`**
  - **설명**: 사용자의 Office 채팅방 목록을 조회합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "rooms": [
        {
          "roomid": "5df8cf5a-baae-4a53-be70-5eb2215fc237",
          "Title": "파이썬에 대해서 자..."
        }
      ]
    }
    ```


#### 📌 Office 채팅방 삭제
- **`DELETE /server/rooms/office/{roomId}`**
  - **설명**: 특정 Office 채팅방을 삭제합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | roomId | 채팅방 ID |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "채팅방이 성공적으로 삭제되었습니다.",
      "response": {
        "Result": "Successfully deleted document with ID: 8430b4dc-45a0-47ba-a3e4-a7d01edbfcf3"
      }
    }
    ```


#### 📌 Office AI 응답 받기
- **`POST /server/rooms/office/{roomId}/log`**
  - **설명**: Office 채팅방에서 AI 응답을 받습니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | roomId | 채팅방 ID |
  - **요청 본문**
    ```json
    {
      "input_data_set": "인공지능의 미래 전망에 대해 알려주세요.",
      "route_set": "Llama",
      "google_access_set": "true"
    }
    ```
    | 필드명 | 타입 | 제약조건 | 설명 | 예시 |
    |--------|------|----------|------|------|
    | input_data_set | string | 필수 | 사용자 입력 문장 | `"인공지능의 미래 전망에 대해 알려주세요."` |
    | route_set | string | 필수 | 사용할 AI 모델 종류 | `"Llama"` 또는 `"gpt4o_mini"` |
    | google_access_set | string | 선택 | 검색 기능 활성화 여부 | `"true"` 또는 `"false"` |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "물론입니다! 아래는 파이썬에 대한 자세한 정보입니다.\\n\\n```markdown\\n# 파이썬(Python)\\n\\n## 개요\\n파이썬은 1991년 귀도 반 로썸(Guido van Rossum)에 의해 처음 출시된 고급 프로그래밍 언어입니다. 파이썬은 읽기 쉽고, 코드가 간결하며, 다양한 프로그래밍 패러다임을 지원하는 것이 특징입니다. \\n\\n## 주요 특징\\n- **간결한 문법**: 파이썬은 코드가 명확하고 읽기 쉽도록 설계되었습니다.\\n- **인터프리터 언어**: 코드를 한 줄씩 실행할 수 있어 개발과 디버깅이 용이합니다.\\n- **다양한 라이브러리**: 데이터 과학, 웹 개발, 인공지능 등 다양한 분야에서 사용되는 방대한 라이브러리와 프레임워크를 제공합니다.\\n- **객체 지향**: 파이썬은 객체 지향 프로그래밍을 지원하여 코드 재사용과 구조적인 설계를 가능하게 합니다.\\n- **크로스 플랫폼**: Windows, macOS, Linux 등 다양한 운영 체제에서 실행 가능합니다.\\n\\n## 설치\\n파이썬을 설치하기 위해서는 [Python 공식 웹사이트](https://www.python.org/downloads/)에서 최신 버전을 다운로드할 수 있습니다.\\n\\n### 설치 방법 (Windows)\\n1"
    }
    ```

#### 📌 Office 채팅 로그 불러오기
- **`GET /server/rooms/office/{roomId}/logs`**
  - **설명**: 특정 Office 채팅방의 대화 로그를 불러옵니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | roomId | 채팅방 ID |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "logs": {
        "id": "5df8cf5a-baae-4a53-be70-5eb2215fc237",
        "value": [
          {
            "index": 1,
            "input_data": "파이썬에 대해서 자세하게 정보를 정리해서 마크다운으로 답변을 줄래?",
            "output_data": "물론입니다! 아래는 파이썬에 대한 자세한 정보입니다.\\n\\n```markdown\\n# 파이썬(Python)\\n\\n## 개요\\n파이썬은 1991년 귀도 반 로썸(Guido van Rossum)에 의해 처음 출시된 고급 프로그래밍 언어입니다. 파이썬은 읽기 쉽고, 코드가 간결하며, 다양한 프로그래밍 패러다임을 지원하는 것이 특징입니다. \\n\\n## 주요 특징\\n- **간결한 문법**: 파이썬은 코드가 명확하고 읽기 쉽도록 설계되었습니다.\\n- **인터프리터 언어**: 코드를 한 줄씩 실행할 수 있어 개발과 디버깅이 용이합니다.\\n- **다양한 라이브러리**: 데이터 과학, 웹 개발, 인공지능 등 다양한 분야에서 사용되는 방대한 라이브러리와 프레임워크를 제공합니다.\\n- **객체 지향**: 파이썬은 객체 지향 프로그래밍을 지원하여 코드 재사용과 구조적인 설계를 가능하게 합니다.\\n- **크로스 플랫폼**: Windows, macOS, Linux 등 다양한 운영 체제에서 실행 가능합니다.\\n\\n## 설치\\n파이썬을 설치하기 위해서는 [Python 공식 웹사이트](https://www.python.org/downloads/)에서 최신 버전을 다운로드할 수 있습니다.\\n\\n### 설치 방법 (Windows)\\n1",
            "timestamp": "2025-03-24 18:26:45"
          }
        ]
      }
    }
    ```

#### 📌 Office 채팅 로그 수정
- **`PUT /server/rooms/office/{roomId}/logs`**
  - **설명**: 기존 Office 채팅 로그의 최신 부분을 수정합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | roomId | 채팅방 ID |
  - **요청 본문**
    ```json
    {
      "index":1,
      "input_data_set":"우리 대화를 몇번했지?",
      "route_set" : "gpt4o_mini",
      "google_access_set": "true"
    }
    ```
    | 필드명 | 타입 | 제약조건 | 설명 | 예시 |
    |--------|------|----------|------|------|
    | index | integer | 필수 | 수정할 로그의 인덱스 | `1` |
    | input_data_set | string | 필수 | 수정할 사용자 입력 문장 | `"머신러닝과 딥러닝의 차이점에 대해 자세히 설명해주세요."` |
    | route_set | string | 필수 | 사용할 AI 모델 종류 | `"Llama"` 또는 `"gpt4o_mini"` |
    | google_access_set | string | 선택 | 검색 기능 활성화 여부 | `"true"` 또는 `"false"` |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "채팅 로그가 성공적으로 수정되었습니다.",
      "response": {
        "Result": "Successfully added data to document with ID: fb943add-a683-431e-a672-1174a25327ad, Values:1"
      }
    }
    ```

#### 📌 Office 채팅 로그 삭제
- **`DELETE /server/rooms/{roomId}/logs/{logIndex}`**
  - **설명**: 특정 Office 채팅 로그를 삭제합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | roomId | 채팅방 ID |
    | index |  마지막 인덱스 로그부터 입력한 인덱스 로그까지 삭제(10까지의 index라면 5 선택 시 10~5까지 삭제) |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "해당 로그가 성공적으로 삭제되었습니다.",
      "response": {
        "Result": "Successfully removed data from index: 1 to the end in document with ID: 5df8cf5a-baae-4a53-be70-5eb2215fc237"
      }
    }
    ```

### 🔹 Character 채팅방 (캐릭터 기반 대화 모드)

#### 📌 Character 채팅방 생성
- **`POST /server/rooms/character`**
  - **설명**: 새로운 Character 채팅방을 생성합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **요청 본문**
    ```json
    {
      "character_idx": 1
    }
    ```
    | 필드명 | 타입 | 필수 | 설명 |
    |----------|------|------|------|
    | character_idx | integer | 필수 | 생성할 캐릭터의 인덱스 |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "채팅방이 성공적으로 생성되었습니다.",
      "mysql_characterroom": {
        "idx": 4,
        "userid": "test_VIP",
        "charactersIdx": 1,
        "mongo_chatroomid": "e44e4840-d779-49f4-92a6-a289e89d25fc",
        "createdAt": "2025-03-24T17:59:13.167108508",
        "updatedAt": "2025-03-24T17:59:13.167150975"
      }
    }
    ```

#### 📌 Character 채팅방 목록 조회
- **`GET /server/rooms/character`**
  - **설명**: 사용자의 Character 채팅방 목록을 조회합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "rooms": [
        {
          "roomid": "e44e4840-d779-49f4-92a6-a289e89d25fc",
          "Title": "hi, what's..."
        }
      ]
    }
    ```

#### 📌 Character 채팅방 삭제
- **`DELETE /server/rooms/character/{roomId}`**
  - **설명**: 특정 Character 채팅방을 삭제합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | roomId | 채팅방 ID |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "채팅방이 성공적으로 삭제되었습니다.",
      "response": {
        "Result": "Successfully deleted document with ID: a9022281-418a-4f75-bcc8-6cafc31633eb"
      }
    }
    ```

#### 📌 Character AI 응답 받기
- **`POST /server/rooms/character/{roomId}/logs`**
  - **설명**: Character 채팅방에서 AI 응답을 받습니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | roomId | 채팅방 ID |
  - **요청 본문**
    ```json
    {
      "input_data_set": "hi, what's your name?",
      "route_set": "gpt4o_mini"
    }
    ```
    | 필드명 | 타입 | 필수 | 설명 |
    |--------|------|------|------|
    | input_data_set | string | 필수 | 사용자 입력 문장 |
    | route_set | string | 필수 | 사용할 AI 모델 종류 |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "G-g-good…b-blessings! I-I’m Rachel. It’s n-nice to m-meet you! How can I h-help you t-today?"
    }
    ```

#### 📌 Character 채팅 로그 불러오기
- **`GET /server/rooms/character/{roomId}/logs`**
  - **설명**: 특정 Character 채팅방의 대화 로그를 불러옵니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | roomId | 채팅방 ID |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "logs": {
        "id": "e44e4840-d779-49f4-92a6-a289e89d25fc",
        "character_idx": 1,
        "value": [
          {
            "index": 1,
            "img_url": "https://lh3.googleusercontent.com/d/1vSbyd-ANS65Ms0BnMHGdYhzcCpmCYJkV=s220?authuser=0",
            "input_data": "hi, what's your name?",
            "output_data": "G-g-good…b-blessings! I-I’m Rachel. It’s n-nice to m-meet you! How can I h-help you t-today?",
            "timestamp": "2025-03-24 18:26:24"
          }
        ]
      }
    }
    ```

#### 📌 Character 채팅 로그 수정
- **`PUT /server/rooms/character/{roomId}/logs`**
  - **설명**: 기존 Character 채팅 로그의 최신 부분을 수정합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | roomId | 채팅방 ID |
  - **요청 본문**
    ```json
    {
      "input_data_set": "안녕하세요?",
      "route_set": "gpt4o_mini"
    }
    ```
    | 필드명 | 타입 | 필수 | 설명 |
    |--------|------|------|------|
    | input_data_set | string | 필수 | 수정할 사용자 입력 문장 |
    | route_set | string | 필수 | 사용할 AI 모델 종류 |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "채팅 로그가 성공적으로 수정되었습니다.",
      "response": {
        "Result": "Successfully added data to document with ID: 29e230b3-f03c-4e3e-8ea4-5535323d9801, Values:1"
      }
    }
    ```

#### 📌 Character 채팅 로그 삭제
- **`DELETE /server/rooms/character/{roomId}/logs/{logIndex}`**
  - **설명**: 특정 Character 채팅 로그를 삭제합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | roomId | 채팅방 ID |
    | logIndex | 삭제할 로그 인덱스 |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "해당 로그가 성공적으로 삭제되었습니다.",
      "response": {
        "Result": "Successfully removed data from index: 1 to the end in document with ID: e44e4840-d779-49f4-92a6-a289e89d25fc"
      }
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

- **인증 필수**: 모든 API는 Authorization 헤더를 통한 토큰 인증이 필요합니다.
- **멤버십 정책**: 기본(BASIC) 멤버십 사용자는 Llama 모델만 사용 가능하며, VIP 멤버십 사용자는 모든 모델 사용 가능합니다.
- **데이터 저장**: 채팅 로그는 MongoDB에 저장되며, 채팅방 정보는 MySQL에 저장됩니다.
- **Office 모드**: 일반적인 정보 제공 기능에 특화된 모드입니다.
- **Character 모드**: 특정 캐릭터의 페르소나를 기반으로 대화하는 모드입니다.
- **검색 기능**: Office 모드에서는 `google_access_set` 매개변수를 통해 검색 결과를 응답에 통합할 수 있습니다.

---
````
