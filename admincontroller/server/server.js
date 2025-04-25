const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 5785;

// React 빌드 파일 제공
app.use(express.static(path.join(__dirname, '../client/build')));

// API 엔드포인트 예시
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from API!' });
});

// 모든 요청에 대해 React 앱 제공
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});