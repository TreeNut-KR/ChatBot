import React, { useState } from 'react';
import axios from 'axios';
import './login.css'; 

import logo_naver_kr from './logo/logo_naver_kr.png';
import logo_kakao_kr from './logo/logo_kakao_kr.png';
import logo_google_kr from './logo/logo_google_kr.png';

const Login = () => {
  const [Id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await axios.post('http://localhost:8080/server/user/login', {
        id: Id,
        pw: password,
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
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="title">TreeNut</h2>
        <h2 className="subtitle">AI 어시스턴트한테 <br/> 도움을 받아보세요!</h2>
        <h2 className="small-text">TreeNut과 함께 편리한 AI 서비스를 이용해보세요</h2>
        
        <div className="image-container">
          <img src={logo_naver_kr} width={300} alt="Naver Logo" />
          <img src={logo_kakao_kr} width={300} alt="Kakao Logo" />
          <img src={logo_google_kr} width={300} alt="Google Logo" />
        </div>
        
        <div className="line-container">
          <div className="line"></div>
          <h2 className="and_text">또는</h2>
          <div className="line"></div>
        </div>

        <div className="inputGroup">
          <input
            type="text"
            id="Id"
            value={Id}
            onChange={(e) => setId(e.target.value)}
            required
            className="login-input"
            placeholder="아이디"
          />
        </div>
        
        <div className="inputGroup">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
            placeholder="비밀번호"
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
