import React, { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  // 가정: 로그인한 사용자의 정보를 여기에 설정 (백엔드 연동 필요)
  const user = {
    name: '권재현',
    email: 'example@example.com',
  };

  const sendMessage = () => {
    if (inputValue.trim() !== '') {
      setMessages([...messages, inputValue]);
      setInputValue('');
    }
  };

  return (
    <div className="App">
      <div className="header">
        <a href="/oauth2/authorization/naver" className="login-button">네이버 로그인</a>
      </div>

      <div className="container">
        <h1>권재현의 메차쿠차 챗봇</h1>
        <p>혼자 대화해보세요~ 현재 로그인 작업완료 2024-0909.</p>

        {/* 사용자 정보 표시 */}
        {user ? (
          <div>
            <h2>안녕하세요, {user.name}님!</h2>
            <p><strong>이메일:</strong> {user.email}</p>
          </div>
        ) : (
          <p>로그인된 사용자가 없습니다.</p>
        )}

        {/* 채팅창 */}
        <div className="chat-box" id="chatBox">
          {messages.map((message, index) => (
            <div key={index}>{message}</div>
          ))}
        </div>

        {/* 입력창 */}
        <div className="chat-input">
          <input
            type="text"
            id="chatInput"
            placeholder="메시지를 입력하세요..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button onClick={sendMessage}>전송</button>
        </div>
      </div>
    </div>
  );
}

export default App;
