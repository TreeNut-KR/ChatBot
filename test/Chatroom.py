# locust 파일 수정
import random
import string
from locust import HttpUser, task, constant

class ChatBotLoadTest(HttpUser):
    wait_time = constant(1)  # 사용자 간의 대기 시간
    host = "http://localhost"  # 기본 서버 URL 설정

    def generate_random_user(self):
        # 랜덤한 사용자 ID, PW, 이메일 생성
        self.user_id = "test_user_" + ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        self.password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        self.email = self.user_id + "@gmail.com"
        return self.user_id, self.password, self.email
    
    @task
    def register_login_and_request_chatroom(self):
        self.user_id, self.password, self.email = self.generate_random_user()
        
        # 회원가입 요청
        self.client.post("/server/user/register", json={
            "id": self.user_id,
            "pw": self.password,
            "email": self.email,
            "name": self.user_id
        })
        
        # 로그인 요청 및 토큰 저장
        response = self.client.post("/server/user/login", json={
            "id": self.user_id,
            "pw": self.password
        })

        # 응답에서 토큰 추출
        response_data = response.json()
        token = response_data.get("token")
        
        if not token:
            print("로그인 실패: 토큰을 생성하지 못했습니다.")
            return

        # 헤더에 Authorization 포함 및 Content-Type 설정
        headers = {
            "Authorization": f"{token}",  # Bearer 추가
            "Content-Type": "application/json"  # Content-Type 명시
        }

        # 채팅방 생성 요청
        chatroom_response = self.client.post(
            "/server/chatroom/office",
            headers=headers,
            json={
                "input_data_set": "Llama 모델 출시일 정리해줘."  # 예시 데이터
            }
        )

        # 채팅방 요청 결과 확인
        if chatroom_response.status_code == 200:
            print("채팅방 요청 성공:", chatroom_response.json())
        else:
            print("채팅방 요청 실패:", chatroom_response.status_code, chatroom_response.text)
