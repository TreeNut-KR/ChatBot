const express = require('express');
const path = require('path');
require('dotenv').config({ 
    path: path.join(__dirname, '.env')  // 현재 디렉토리의 .env 파일을 명시적으로 지정
});
const mysql = require('mysql2/promise');
const driveService = require('./driveService');
const multer = require('multer');
const upload = multer();
const fileUpload = require('express-fileupload');
const secureModule = require('./modules/secureModule');

const app = express();
const port = process.env.PORT;

// MySQL 연결 설정
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// MySQL 연결 테스트 및 재시도
async function connectWithRetry(retryCount = 0, maxRetries = 30) {  // 최대 30회 시도
  try {
    const connection = await pool.getConnection();
    console.log('MySQL 연결 성공!');
    connection.release();
    return true;
  } catch (err) {
    console.error(`MySQL 연결 실패 (시도 ${retryCount + 1}/${maxRetries}):`, err.message);
    
    if (retryCount < maxRetries) {
      console.log('5초 후 재시도...');
      await new Promise(resolve => setTimeout(resolve, 5000));  // 5초 대기
      return connectWithRetry(retryCount + 1, maxRetries);
    } else {
      console.error('최대 재시도 횟수 초과. 서버를 종료합니다.');
      process.exit(1);
    }
  }
}

// 서버 시작 전 DB 연결 확인
async function startServer() {
  await connectWithRetry();
  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/build')));
app.use(fileUpload());

// MySQL 테스트 API 엔드포인트
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 파일 목록 조회
app.get('/api/drive/files', async (req, res) => {
  try {
    console.log('파일 목록 조회 요청 받음');
    const files = await driveService.listFiles();
    res.json(files);
  } catch (error) {
    console.error('파일 목록 조회 처리 중 에러:', error);
    res.status(500).json({ 
      error: '파일 목록 조회 실패', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// 인증: 챌린지 발급
app.get('/api/auth/challenge', (req, res) => {
  // 세션ID는 쿠키/헤더/IP 등에서 추출(여기선 임시로 IP+UA)
  const sessionId = req.ip + (req.headers['user-agent'] || '');
  const challenge = secureModule.issueChallenge(sessionId);
  res.json({ challenge });
});

// 인증: 해시 결과 검증 및 토큰 발급
app.post('/api/auth/verify', (req, res) => {
  const { clientHash } = req.body;
  const sessionId = req.ip + (req.headers['user-agent'] || '');
  const valid = secureModule.verifyChallenge(sessionId, clientHash);
  if (!valid) {
    return res.status(401).json({ error: '인증 실패' });
  }
  const token = secureModule.issueToken(sessionId);
  res.json({ token });
});

// 인증 미들웨어
function requireAuth(req, res, next) {
  const token = req.headers['authorization']?.replace(/^Bearer\s/, '');
  if (!token || !secureModule.verifyToken(token)) {
    return res.status(401).json({ error: '인증 필요 또는 토큰 만료' });
  }
  next();
}

// 로그아웃: 토큰 폐기
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.headers['authorization']?.replace(/^Bearer\s/, '');
  if (token) {
    secureModule.revokeToken(token);
  }
  res.json({ message: '로그아웃 완료' });
});

// 파일 업로드
app.post('/api/drive/upload', requireAuth, async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: '파일이 없습니다' });
    }

    const file = req.files.file;
    const result = await driveService.uploadFile(
      file.data,
      file.name,
      file.mimetype
    );
    res.json(result);
  } catch (error) {
    console.error('파일 업로드 처리 중 에러:', error);
    res.status(500).json({ error: '파일 업로드 실패', details: error.message, stack: error.stack });
  }
});

// 파일 삭제
app.delete('/api/drive/files/:fileId', requireAuth, async (req, res) => {
  try {
    await driveService.deleteFile(req.params.fileId);
    res.json({ message: '파일이 삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: '파일 삭제 실패' });
  }
});

// 파일 정보 조회
app.get('/api/drive/files/:fileId', async (req, res) => {
  try {
    const fileInfo = await driveService.getFileInfo(req.params.fileId);
    res.json(fileInfo);
  } catch (error) {
    res.status(500).json({ error: '파일 정보 조회 실패' });
  }
});

// 이미지ID로 캐릭터 정보 조회 API
app.get('/api/characters/by-image/:imageId', async (req, res) => {
  const imageId = req.params.imageId;
  try {
    // image 컬럼에 해당 ID가 포함된 캐릭터 검색
    const [rows] = await pool.query(
      'SELECT * FROM characters WHERE image LIKE ?',
      [`%${imageId}%`]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: '해당 이미지ID의 캐릭터를 찾을 수 없습니다.' });
    }
    res.json(rows); // 여러 개면 배열로 반환
  } catch (err) {
    console.error('이미지ID로 캐릭터 조회 오류:', err);
    res.status(500).json({ error: 'DB 조회 오류' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});