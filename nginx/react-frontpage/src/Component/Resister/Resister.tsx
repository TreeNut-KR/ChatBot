import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const Resister: React.FC = () => {
  const navigate = useNavigate();
  const [Id, setId] = useState<string>(''); 
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>(''); 
  const [email, setEmail] = useState<string>(''); 
  const [idError, setIdError] = useState<string>(''); 
  const [emailError, setEmailError] = useState<string>(''); 

  useEffect(() => {
    // 쿠키에서 이전에 저장된 정보가 있다면 불러오기
    const savedId = Cookies.get('register_id');
    const savedEmail = Cookies.get('register_email');
    const savedUsername = Cookies.get('register_username');
    
    if (savedId) setId(savedId);
    if (savedEmail) setEmail(savedEmail);
    if (savedUsername) setUsername(savedUsername);
  }, []);

  // 입력값이 변경될 때마다 쿠키에 저장 (비밀번호 제외)
  useEffect(() => {
    if (Id && !idError) Cookies.set('register_id', Id, { expires: 1 }); // 1일간 유지
    if (email && !emailError) Cookies.set('register_email', email, { expires: 1 });
    if (username) Cookies.set('register_username', username, { expires: 1 });
  }, [Id, email, username, idError, emailError]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!Id || !email || !password || !username || idError || emailError) {
      window.alert('입력된 값에 오류가 있습니다. 다시 확인해주세요.');
      return;
    }

    try {
      const response = await axios.post('/server/user/register', {
        id: Id,
        pw: password,
        name: username,
        email: email,
      });

      if (response.status === 200) {
        window.alert('회원가입 성공!');
        console.log('회원가입 성공:', response.data);
        
        // 회원가입 성공 후 쿠키 삭제
        Cookies.remove('register_id');
        Cookies.remove('register_email');
        Cookies.remove('register_username');
        
        // 로그인 페이지로 리다이렉트
        navigate('/login');
      }
    } catch (error) {
      window.alert('회원가입 실패. 다시 시도해 주세요.');
      console.error('Error:', error);
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value)) {
      setIdError('아이디에 한글을 입력할 수 없습니다.');
    } else {
      setIdError('');
      setId(value);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value)) {
      setEmailError('이메일에 한글을 입력할 수 없습니다.');
    } else {
      setEmailError('');
      setEmail(value);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-[93vw] h-screen bg-[#1A1918]">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-12 rounded-md text-left w-[400px]"
      >
        <h2 className="text-black tracking-wide font-bold text-2xl text-center flex justify-center h-[60px] mb-9">
          회원가입
        </h2>

        <div className="mb-4">
          <label className="block text-sm text-gray-800 mb-1">이름</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full p-2 border-b-2 border-gray-300 text-gray-700 focus:outline-none focus:border-blue-500"
            autoComplete="off"
            aria-label="이름"
            placeholder="이름을 입력하세요"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-800 mb-1">아이디</label>
          <input
            type="text"
            id="Id"
            value={Id}
            onChange={handleIdChange}
            required
            placeholder="아이디를 입력하세요"
            aria-label="아이디"
            className="w-full p-2 border-b-2 text-gray-700 border-gray-300 focus:outline-none focus:border-blue-500"
          />
          {idError && <p className="text-red-600 text-sm mt-2">{idError}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-800 mb-1">비밀번호</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="비밀번호를 입력하세요"
            aria-label="비밀번호"
            className="w-full p-2 border-b-2 border-gray-300 focus:outline-none text-gray-700 focus:border-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-800 mb-1">이메일</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
            placeholder="이메일을 입력하세요"
            aria-label="이메일"
            className="w-full p-2 border-b-2 text-gray-700 border-gray-300 focus:outline-none focus:border-blue-500"
          />
          {emailError && <p className="text-red-600 text-sm mt-2">{emailError}</p>}
        </div>

        <button
          type="submit"
          className="w-full p-2 font-semibold bg-green-600 text-white rounded hover:bg-green-700 transition mt-4"
        >
          회원가입
        </button>
      </form>
    </div>
  );
};

export default Resister;
