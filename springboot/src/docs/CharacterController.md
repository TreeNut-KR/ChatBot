## 📢 개요
- **API 이름**: CharacterController
- **설명**: 채팅방 및 대화 관리 API

이 API는 Character 모드의 캐릭터를 저장, 조회, 수정, 삭제하는 기능을 제공합니다.

---

## 📍 엔드포인트 목록

### 🔹 Character CRUD

#### 📌 Character 생성
- **`POST /server/character/`**
  - **설명**: 새로운 Character를 생성합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **요청 본문**
    ```json
      {
      "character_name" : "test",
      "description" : "test characters" ,
      "greeting" : "hello",
      "image" : "https://drive.google.com/thumbnail?id=1a2mPrSRXoPpUCblTO55UXaWsfHlFZK7_",
      "character_setting" : "test setting",
        "access_level" : true
      }
    ```
      | 필드명 | 타입 | 필수 | 설명 |
      |-------|------|------|------|
      |characterName|string|필수|생성하려는 캐릭터의 이름|
      |description|string|필수|생성하려는 캐릭터의 설명|
      |greeting|string|필수|생성하려는 캐릭터의 인사말|
      |image|string|필수|생성하려는 캐릭터의 이미지|
      |character_setting|String|필수|생성하려는 캐릭터의 성격|
      |access_level|boolean|필수|생성하려는 캐릭터의 공개여부|
  - **응답 예시**
    ```json
    {
    "status": 200,
    "name": "test" 
    }
    ```
#### 📌 Character 수정
- **`PUT /server/character/{character_name}`**
  - **설명**: 생성되어 있는 Character를 수정합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | character_name | 수정할 캐릭터 이름 |
  - **요청 본문**
    ```json
      {
      "character_name" : "test",
      "description" : "test characters" ,
      "greeting" : "hello",
      "image" : "https://drive.google.com/thumbnail?id=1a2mPrSRXoPpUCblTO55UXaWsfHlFZK7_",
      "character_setting" : "test setting",
      "access_level" : true
      }
    ```
      | 필드명 | 타입 | 필수 | 설명 |
      |-------|------|------|------|
      |characterName|string|필수|수정하려는 캐릭터의 이름|
      |description|string|필수|수정하려는 캐릭터의 설명|
      |greeting|string|필수|수정하려는 캐릭터의 인사말|
      |image|string|필수|수정하려는 캐릭터의 이미지|
      |character_setting|String|필수|수정하려는 캐릭터의 성격|
      |access_level|boolean|필수|수정하려는 캐릭터의 공개여부|
  - **응답 예시**
    ```json
    {
        "status": 200,
        "message": "Character updated successfully"
    }
    ```
#### 📌 Character 삭제
- **`DELETE /server/character/{character_name}`**
  - **설명**: 생성되어 있는 Character를 삭제합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | character_name | 삭제할 캐릭터 이름 |
  - **응답 예시**
    ```json
    {
    "status": 200,
    "message": "Character deleted successfully"
    }
    ```
#### 📌 Character 조회
- **`GET /server/character/public`**
  - **설명**: 공개되어 있는 Character를 조회합니다.
  - **응답 예시**
    ```json
    {
    "status": 200,
    "message": "Public characters retrieved successfully",
    "data": [
        {
            "characterName": "test",
            "description": "test characters",
            "image": "https://drive.google.com/thumbnail?id=1a2mPrSRXoPpUCblTO55UXaWsfHlFZK7_",
            "creator": "testtest",
            "uuid": "e30c961c48224e58a6ab9e4ae013c3a9",
            "idx": 2
        },
        ...
      ]
    }
    ```
#### 📌 내 Character 조회
- **`GET /server/character/mycharacter`**
  - **설명**: 내 Character를 조회합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **응답 예시**
    ```json
    {
    "status": 200,
    "message": "Public characters retrieved successfully",
    "data": [
        {
            "characterName": "test",
            "description": "test characters",
            "image": "https://drive.google.com/thumbnail?id=1a2mPrSRXoPpUCblTO55UXaWsfHlFZK7_",
            "creator": "testtest",
            "uuid": "e30c961c48224e58a6ab9e4ae013c3a9",
            "idx": 2
        },
        ...
      ]
    }
    ```
#### 📌 Character에 좋아요 추가
- **`PATCH /server/character/{character_name}/like`**
  - **설명**: Character에 좋아요를 추가합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | character_name | 좋아요를 추가할 캐릭터 이름 |
  - **응답 예시**
    ```json
    {
    "status": 200,
    "message": "Like count updated successfully for character: test",
    "like_count": 1
    }
    ```
#### 📌 Character 검색
- **`GET /server/character/{character_name}/list`**
  - **설명**: Character를 검색합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | character_name | 검색할 캐릭터 이름 |
  - **응답 예시**
    ```json
    [
      {
          "character_name": "test11",
          "userid": "test",
          "description": "test characters",
          "image": "https://drive.google.com/thumbnail?id=1a2mPrSRXoPpUCblTO55UXaWsfHlFZK7_"
      },
      ...
    ]
    ```
#### 📌 Character 상세보기(이름)
- **`GET /server/character/{character_name}/detail`**
  - **설명**: Character를 이름으로 상세 조회합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | character_name | 조회할 캐릭터 이름 |
  - **응답 예시**
    ```json
    {
      "character_name": "test",
      "description": "test characters",
      "image": "https://drive.google.com/thumbnail?id=1a2mPrSRXoPpUCblTO55UXaWsfHlFZK7_",
      "userid": "test",
      "like_count": 1
    }
    ```
#### 📌 Character 상세보기(idx)
- **`GET /server/character/idx/{idx}/detail`**
  - **설명**: Character를 이름으로 상세 조회합니다.
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | idx | 조회할 캐릭터 idx |
  - **응답 예시**
    ```json
    {
        "idx": 2,
        "uuid": "e30c961c48224e58a6ab9e4ae013c3a9",
        "userid": "test",
        "characterName": "test",
        "characterSetting": "test setting",
        "description": "test characters",
        "greeting": "hello",
        "accessLevel": true,
        "image": "https://drive.google.com/thumbnail?id=1a2mPrSRXoPpUCblTO55UXaWsfHlFZK7_",
        "like_count": 1,
        "liked_users": "test",
        "createdAt": "2025-05-16T14:26:39",
        "updatedAt": "2025-05-16T14:37:20"
    }
    ```
#### 📌 Character 이미지 업로드
- **`GET /server/character/pngimage`**
  - **설명**: Character 이미지 업로드
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **Body (form-data)**
    | 필드명 | 타입 | 필수 | 설명 |
    |--------|------|------|------|
    | file | file | 필수 | 업로드할 png 이미지 파일 |
  - **응답 예시**
    ```json
    {
      "status": "success",
      "url": "https://lh3.googleusercontent.com/d/1AEE4WJ1oPe4OIma-I7CFTYeatTCoFDCi=s220?authuser=0"
    }
    ```
#### 📌 Character 공개여부 관리(관리자)
- **`GET /server/character/{character_name}/manage/{access_level}`**
  - **설명**: Character 공개여부를 관리합니다(관리자 전용).
  - **헤더**
    | 필드명 | 타입 | 필수 | 설명 |
    |-------|------|------|------|
    | Authorization | string | 필수 | 사용자 인증 토큰 |
  - **경로 매개변수**
    | 매개변수 | 설명 |
    |----------|------|
    | character_name | 수정할 캐릭터 이름 |
    | access_level | 공개여부 |
  - **응답 예시**
    ```json
    {
      "status": 200,
      "message": "Character updated successfully"
    }
    ```