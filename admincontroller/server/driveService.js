const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ 
    path: path.join(__dirname, '.env')
});

class DriveService {
  constructor() {
    this.drive = null;
    this.initializeDrive();
  }

  initializeDrive() {
    try {
      // 환경변수에서 JSON 문자열 파싱
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON_CONTENT);

      // 인증 정보 확인 로깅
      console.log('인증 정보 확인:', {
        type: credentials.type,
        project_id: credentials.project_id,
        client_email: credentials.client_email
      });

      // 개행문자 처리
      if (typeof credentials.private_key === 'string') {
        // 모든 이스케이프된 개행문자를 실제 개행으로 변환
        credentials.private_key = credentials.private_key
          .replace(/\\\\n/g, '\n')
          .replace(/\\n/g, '\n')
          .replace(/\n/g, '\n');

        // private_key가 올바른 형식인지 확인
        if (!credentials.private_key.includes('-----BEGIN PRIVATE KEY-----') ||
            !credentials.private_key.includes('-----END PRIVATE KEY-----')) {
          throw new Error('private_key 형식이 올바르지 않습니다');
        }
      }

      // Google Auth 클라이언트 생성
      this.auth = new google.auth.GoogleAuth({
        credentials: credentials,  // 전체 credentials 객체를 직접 전달
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      // Drive 클라이언트 생성
      this.drive = google.drive({ 
        version: 'v3', 
        auth: this.auth 
      });

      console.log('구글 드라이브 서비스 초기화 성공');
    } catch (error) {
      console.error('구글 드라이브 서비스 초기화 실패:', error);
      throw error;
    }
  }

  async listFiles() {
    try {
      if (!this.drive) {
        throw new Error('드라이브 서비스가 초기화되지 않았습니다');
      }

      const response = await this.drive.files.list({
        pageSize: 30,
        fields: 'files(id, name, mimeType, createdTime, webViewLink, thumbnailLink)',
        orderBy: 'createdTime desc'
      });

      return response.data.files.map(file => ({
        ...file,
        googleusercontentLink: file.id ? `https://lh3.googleusercontent.com/d/${file.id}` : undefined,
        thumbnailLink: file.thumbnailLink // 썸네일 링크 추가
      }));
    } catch (error) {
      console.error('파일 목록 조회 실패:', error);
      throw error;
    }
  }

  async uploadFile(buffer, name, mimeType) {
    try {
      const fileMetadata = { name };
      const media = {
        mimeType,
        body: Buffer.isBuffer(buffer) ? require('streamifier').createReadStream(buffer) : buffer
      };

      // 파일 업로드
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id, name, webViewLink, createdTime, mimeType'
      });

      const fileId = response.data.id;

      // anyone에게 읽기 권한 부여
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // 변경된 파일 정보 다시 조회
      const file = await this.drive.files.get({
        fileId,
        fields: 'id, name, createdTime, mimeType'
      });

      // 직접 URL 생성
      return {
        ...file.data,
        googleusercontentLink: `https://lh3.googleusercontent.com/d/${fileId}`
      };
    } catch (error) {
      console.error('구글 드라이브 파일 업로드 실패:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      const response = await this.drive.files.delete({ fileId });
      console.log('파일 삭제 성공:', fileId);
      return response.data;
    } catch (error) {
      console.error('구글 드라이브 파일 삭제 실패:', error);
      throw error;
    }
  }
}

module.exports = new DriveService();