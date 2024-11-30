import React, { useState } from 'react';
import axios from 'axios'; // Axios 임포트
import './login.css'; // CSS 파일 임포트

const Login = () => {
  const [Id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // 성공 상태 추가

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await axios.post('http://localhost:8080/server/user/login', { // URL 수정
        id: Id, // 키 수정
        pw: password, // 키 수정
      });

      if (response.status === 200) {
        setSuccess(true);
        console.log('로그인 성공:', response.data);
      } else {
        setError('로그인 실패. 다시 시도해 주세요.');
      } 
    } catch (error) {
      setError('로그인 실패. 다시 시도해 주세요.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="login-container">
      <h2>로그인</h2>
      <form onSubmit={handleSubmit} className="login-form">
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
        <button type="submit" className="login-button">로그인</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">로그인 성공!</p>}
    </div>
  );
};

export default Login;
