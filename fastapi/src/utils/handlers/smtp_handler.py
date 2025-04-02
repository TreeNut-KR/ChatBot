import os
import smtplib
import ssl
import random
import string
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import traceback  # 추가: 자세한 예외 추적을 위한 모듈

class SMTPHandler:
    """
    SMTP를 통한 이메일 전송 및 인증 관리를 위한 클래스.
    이메일 인증 코드를 생성하고 검증하는 기능을 제공합니다.
    """
    def __init__(self):
        """
        SMTP 핸들러 초기화. 환경 변수에서 SMTP 설정을 가져옵니다.
        """
        current_directory = os.path.dirname(os.path.abspath(__file__))
        env_file_path = os.path.join(current_directory, '../../.env')
        load_dotenv(env_file_path)
        
        self.server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.port = int(os.getenv("SMTP_PORT", 587))
        self.user = os.getenv("SMTP_USER", "")
        self.password = os.getenv("SMTP_PASSWORD", "")
        # 인증 코드와 만료 시간을 저장할 딕셔너리
        self.verification_codes = {}
        
        # 환경 변수가 제대로 설정되었는지 확인
        if not self.user or not self.password:
            print("경고: SMTP_USER 또는 SMTP_PASSWORD가 설정되지 않았습니다.")
        
    def generate_verification_code(self, email: str) -> str:
        """
        6자리 인증 코드를 생성하고 저장합니다.
        """
        code = ''.join(random.choices(string.digits, k=6))
        # 인증 코드 15분 유효
        expiry_time = datetime.now() + timedelta(minutes=15) 
        self.verification_codes[email] = {
            "code": code,
            "expiry": expiry_time
        }
        return code
    
    def verify_code(self, email: str, code: str) -> bool:
        """
        인증 코드가 유효한지 확인합니다.
        """
        print(f"인증 코드 확인: 이메일={email}, 입력된 코드={code}")
        
        if email not in self.verification_codes:
            print(f"오류: {email}에 대한 인증 코드가 존재하지 않음")
            return False
        
        stored_data = self.verification_codes[email]
        current_time = datetime.now()
        
        # 코드가 만료되었는지 확인
        if current_time > stored_data["expiry"]:
            print(f"오류: 인증 코드 만료됨 (만료시간: {stored_data['expiry']}, 현재시간: {current_time})")
            del self.verification_codes[email]  # 만료된 코드 삭제
            return False
        
        # 코드가 일치하는지 확인
        if stored_data["code"] == code:
            print(f"인증 성공: 코드 일치 ({code})")
            del self.verification_codes[email]  # 사용된 코드 삭제
            return True
        
        print(f"오류: 코드 불일치 (저장된 코드: {stored_data['code']}, 입력된 코드: {code})")
        return False
    
    async def send_verification_email(self, email: str) -> bool:
        """
        이메일로 인증 코드를 보냅니다.
        """
        try:
            # SMTP 설정 유효성 검증
            if not self.user or not self.password:
                print("오류: SMTP_USER 또는 SMTP_PASSWORD가 설정되지 않았습니다.")
                return False
                
            verification_code = self.generate_verification_code(email)
            
            message = MIMEMultipart("alternative")
            message["Subject"] = "TreeNut ChatBot 이메일 인증 코드"
            message["From"] = self.user
            message["To"] = email
            
            # 이메일 본문 생성
            html = f"""
            <html>
              <body>
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #4a6ee0;">TreeNut ChatBot 인증 코드</h2>
                  <p>안녕하세요!</p>
                  <p>요청하신 인증 코드는 다음과 같습니다:</p>
                  <div style="background-color: #f2f2f2; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
                    <h1 style="color: #333; letter-spacing: 5px;">{verification_code}</h1>
                  </div>
                  <p>이 인증 코드는 15분간 유효합니다.</p>
                  <p>코드를 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다.</p>
                  <p>감사합니다.</p>
                  <p style="color: #888; margin-top: 30px; font-size: 12px;">
                    TreeNut ChatBot 팀
                  </p>
                </div>
              </body>
            </html>
            """
            
            part = MIMEText(html, "html")
            message.attach(part)
            
            try:
                # SMTP 서버에 연결하고 이메일 전송
                context = ssl.create_default_context()
                with smtplib.SMTP(self.server, self.port) as server:
                    print(f"연결 시도: {self.server}:{self.port}")
                    server.ehlo()
                    server.starttls(context=context)
                    server.ehlo()
                    print(f"인증 시도: {self.user}")
                    server.login(self.user, self.password)
                    print(f"이메일 전송 시도: {self.user} -> {email}")
                    server.sendmail(self.user, email, message.as_string())
                    print("이메일 전송 완료")
                
                return True
            except smtplib.SMTPAuthenticationError:
                print("SMTP 인증 오류: 사용자 이름이나 비밀번호가 올바르지 않습니다.")
                return False
            except smtplib.SMTPException as smtp_error:
                print(f"SMTP 오류: {str(smtp_error)}")
                return False
                
        except Exception as e:
            print(f"이메일 전송 중 예외 발생: {str(e)}")
            print(traceback.format_exc())  # 상세한 오류 추적 정보 출력
            return False