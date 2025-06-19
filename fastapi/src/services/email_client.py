import os
import smtplib
import ssl
import random
import string
import traceback

from pathlib import Path
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


class SMTPHandler:
    """
    SMTP를 통한 이메일 전송 및 인증 관리를 위한 클래스.
    이메일 인증 코드를 생성하고 검증하는 기능을 제공합니다.
    """
    def __init__(self):
        """
        SMTP 핸들러 초기화. 환경 변수에서 SMTP 설정을 가져옵니다.
        """
        env_file_path = Path(__file__).resolve().parents[1] / ".env"
        load_dotenv(env_file_path)
        
        self.server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.port = int(os.getenv("SMTP_PORT", 587))
        self.user = os.getenv("SMTP_USER", "")
        self.password = os.getenv("SMTP_PASSWORD", "")
        
        # 환경 변수가 제대로 설정되었는지 확인
        if not self.user or not self.password:
            print("경고: SMTP_USER 또는 SMTP_PASSWORD가 설정되지 않았습니다.")
        
    def generate_verification_code(self) -> str:
        """
        6자리 인증 코드를 생성하고 저장합니다.
        """
        characters = string.ascii_uppercase + string.digits  # 예: A-Z, 0-9
        return ''.join(random.choices(characters, k=6))
    
    async def send_verification_email(self, code: str, email: str) -> bool:
        """
        이메일로 인증 코드를 보냅니다.
        """
        try:
            # SMTP 설정 유효성 검증
            if not self.user or not self.password:
                print("오류: SMTP_USER 또는 SMTP_PASSWORD가 설정되지 않았습니다.")
                return False
                
            verification_code = code
            
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
