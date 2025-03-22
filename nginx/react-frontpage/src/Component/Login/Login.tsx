import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import logo_naver_kr from './logo/logo_naver_kr.png';
import logo_kakao_kr from './logo/logo_kakao_kr.png';
import logo_google_kr from './logo/logo_google_kr.png';
import { useGoogleLogin } from '@react-oauth/google';

// 인앱 브라우저 감지 함수
const isInAppBrowser = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // 카카오톡 인앱 브라우저 감지
  if (/KAKAOTALK/i.test(userAgent)) {
    return true;
  }
  
  // 기타 일반적인 인앱 브라우저 감지
  if (/FB_IAB|FBAN|FBAV|Instagram|Line|NAVER|NaverSearch/i.test(userAgent)) {
    return true;
  }
  
  return false;
};

const Login: React.FC = () => {
  const [Id, setId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      console.log('📩 받은 메시지:', event.data);
      const { token } = event.data;
      if (token) {
        console.log('✅ 토큰 저장 성공:', token);
        localStorage.setItem('jwt-token', token);
        window.location.href = '/';
      } else {
        console.error('❌ 받은 토큰이 없음');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      console.log('구글 로그인 성공:', tokenResponse);
      localStorage.setItem('jwt-token', tokenResponse.access_token);
      window.location.href = '/';
    },
    onError: () => {
      console.error('구글 로그인 실패');
      setError('구글 로그인 실패. 다시 시도해 주세요.');
    },
  });

  const handleGoogleLogin = () => {
    if (isInAppBrowser()) {
      // 현재 URL을 저장하고 외부 브라우저로 리다이렉션
      const currentUrl = window.location.href;
      localStorage.setItem('redirectAfterLogin', currentUrl);
      
      // URL 스키마 또는 Intent를 사용하여 외부 브라우저 열기 (OS에 따라 다름)
      if (/android/i.test(navigator.userAgent)) {
        // 안드로이드
        window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=${window.location.protocol.slice(0, -1)};package=com.android.chrome;end`;
      } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        // iOS
        window.location.href = currentUrl;
      } else {
        // 기타 경우 그냥 링크 열기 시도
        window.open(currentUrl, '_system');
      }
    } else {
      // 일반 브라우저에서는 직접 구글 로그인 실행
      googleLogin();
    }
  };

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
      <form className="bg-white p-12 rounded-md text-left w-full max-w-sm" onSubmit={handleSubmit}>
        <div className="flex justify-center items-center">
          <h2 className="text-green-600 text-2xl mb-2 whitespace-nowrap">TreeNut</h2>
        </div>

        <div className="flex justify-center items-center">
          <h2 className="text-lg mb-3 whitespace-nowrap">AI 어시스턴트한테 도움을 받아보세요!</h2>
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
            className="w-72 mb-4 transition-transform transform hover:translate-y-[-5px] cursor-pointer"
            onClick={() => handleGoogleLogin()} // 새로운 핸들러 사용
            onTouchStart={() => handleGoogleLogin()} // 새로운 핸들러 사용
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
