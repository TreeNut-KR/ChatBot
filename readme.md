# 프로젝트 구성원

| 구성원 | 업무 | 사용 기술 |  
|--------|--------|------------|  
| [김준건 (jgkim14)](https://github.com/jgkim14) | 백엔드 | Spring Boot, Node.js |  
| [서정훈 (CutTheWire)](https://github.com/CutTheWire) | 백엔드 |  FastAPI |  
| [이준호 (qwer9679)](https://github.com/qwer9679) | 백엔드 | Spring Boot, FastAPI |  
| [모현준 (Flattt12)](https://github.com/Flattt12) | 백엔드 | Spring Boot |  
| [권재현 (donismoney)](https://github.com/donismoney) | 백엔드 | Spring Boot |  
| [손유노 (GingGang)](https://github.com/GingGang) | 프론트엔드 | React, TypeScript |

| 도움을 주신 분 |
|--------|  
| 👍 [오동현 (zbezdac1f)](https://github.com/zbezdac1f) , [(odh1231)](https://github.com/odh1231) |  
| 👍 [백성현 (Seonghyeon8983)](https://github.com/Seonghyeon8983) |
| 👍 [임창묵 (dlackdanr777)](https://github.com/dlackdanr777) | 

# 시스템 아키텍처 다이어그램
[![image](./ChatBot.png)](https://drive.google.com/file/d/1MGojuhD_O90ldOLZ5slQY1h_4f_Hkmiw/view?usp=sharing)


# AI 서버 리포지토리
[➡️ TreeNut-KR/ChatBot-AI](https://github.com/TreeNut-KR/ChatBot-AI)


### 도커 컨테이너 및 이미지 모두 삭제 후 자동 재빌드

#### 1. Linux, Mac OS
```bash
source ./rebuild.sh
```

#### 2. Windows OS
```bash
 & ./rebuild.bat
```

#### - FastAPI 작업영역
`./fastapi/sources`
#### - 프론트 작업영역
`./nginx/frontpage-react`
#### - 프론트 빌드파일 경로
`./frontpage-react/build`
