import React, { useState } from 'react';
import axios from 'axios'; // Axios 임포트
import './resister.css'; // CSS 파일 임포트

const Resister = () => {
  const [Id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(''); // 에러 메시지 상태 추가
  const [success, setSuccess] = useState(false); // 성공 상태 추가

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // 이전 에러 초기화
    setSuccess(false); // 이전 성공 상태 초기화

    try {
      const response = await axios.post('http://localhost:8080/server/user/register', {
        id: Id, // id 필드
        pw: password, // pw 필드
        name: username, // name 필드
        email: email, // email 필드
      });

      if (response.status === 200) {
        setSuccess(true);
        console.log('회원가입 성공:', response.data);
      }
    } catch (error) {
      setError('회원가입 실패. 다시 시도해 주세요.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="login-container">
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="inputGroup">
          <label htmlFor="username">이름:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="login-input"
          />
        </div>

        <div className="inputGroup">
          <label htmlFor="Id">아이디:</label>
          <input
            type="text"
            id="Id"
            value={Id}
            onChange={(e) => setId(e.target.value)}
            required
            className="login-input"
          />
        </div>

        <div className="inputGroup">
          <label htmlFor="password">비밀번호:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
        </div>

        <div className="inputGroup">
          <label htmlFor="email">이메일:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="login-input"
          />
        </div>

        <button type="submit" className="login-button">회원가입</button>
      </form>

      {error && <p className="error-message">{error}</p>} {/* 에러 메시지 표시 */}
      {success && <p className="success-message">회원가입 성공!</p>} {/* 성공 메시지 표시 */}
    </div>
  );
};

export default Resister;
