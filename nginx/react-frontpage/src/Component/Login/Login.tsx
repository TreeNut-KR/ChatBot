import React, { useState, FormEvent } from 'react';
import axios from 'axios';
import logo_naver_kr from './logo/logo_naver_kr.png';
import logo_kakao_kr from './logo/logo_kakao_kr.png';
import logo_google_kr from './logo/logo_google_kr.png';

const Login: React.FC = () => {
  const [Id, setId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
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

        const token = response.data.token;
        if (token) {
          localStorage.setItem('jwt-token', token);
          console.log('토큰 저장 성공:', token);
          window.location.href = '/';
        } else {
          console.error('토큰이 반환되지 않았습니다.');
        }
      } else {
        setError('로그인 실패. 다시 시도해 주세요.');
      }
    } catch (error) {
      setError('로그인 실패. 다시 시도해 주세요.');
      console.error('Error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-[90vw]">
      <form onSubmit={handleSubmit} className="bg-white p-12 rounded-md text-left w-full max-w-sm ">
        <div className="flex justify-center items-center">
          <h2 className="text-green-600 text-2xl mb-2 whitespace-nowrap">{`TreeNut`}</h2>
        </div>

        <div className="flex justify-center items-center">
          <h2 className="text-lg mb-3 whitespace-nowrap">{`AI 어시스턴트한테 도움을 받아보세요!`}</h2>
        </div>

        <h2 className="text-center text-sm mb-6 text-gray-600">
          TreeNut과 함께 편리한 AI 서비스를 이용해보세요
        </h2>

        <div className="flex flex-col items-center mb-5">
          <img
            src={logo_naver_kr}
            alt="Naver Logo"
            className="w-72 mb-4 transition-transform transform hover:translate-y-[-5px]"
          />
          <img
            src={logo_kakao_kr}
            alt="Kakao Logo"
            className="w-72 mb-4 transition-transform transform hover:translate-y-[-5px]"
          />
          <img
            src={logo_google_kr}
            alt="Google Logo"
            className="w-72 transition-transform transform hover:translate-y-[-5px]"
          />
        </div>

        <div className="flex items-center mb-6">
          <div className="flex-1 h-[1px] bg-gray-300"></div>
          <span className="mx-4 text-gray-600 text-sm">또는</span>
          <div className="flex-1 h-[1px] bg-gray-300"></div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            id="Id"
            value={Id}
            onChange={(e) => setId(e.target.value)}
            required
            className="w-full p-2 border text-gray-700 border-gray-300 rounded-md opacity-70 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="아이디"
          />
        </div>

        <div className="mb-4">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border text-gray-700 border-gray-300 rounded-md opacity-70 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="비밀번호"
          />
        </div>

        <button
          type="submit"
          className="w-full font-semibold tracking-wider py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
        >
          로그인
        </button>
      </form>

      {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
      {success && <p className="text-green-600 mt-4 text-sm">로그인 성공!</p>}
    </div>
  );
};

export default Login;
