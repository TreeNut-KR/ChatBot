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

// 로그인 성공 처리 함수
const handleLoginSuccess = (userData: { token: string; userId: string }) => {
  // JWT 토큰 저장
  localStorage.setItem('jwt-token', userData.token);
  
  // 사용자 ID 저장
  localStorage.setItem('user_id', userData.userId);
  
  // 이전 사용자와 현재 사용자가 다르면 채팅방 초기화 준비
  const previousUserId = localStorage.getItem('previous_user_id');
  if (previousUserId !== userData.userId) {
    localStorage.removeItem('mongo_chatroomid');
  }
  
  // 현재 사용자 ID를 이전 사용자 ID로 저장
  localStorage.setItem('previous_user_id', userData.userId);
};

const Login: React.FC = () => {
  const [Id, setId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    setIsLoading(true); // 로딩 시작
    
    // 기본 유효성 검사 추가
    if (!Id.trim()) {
      setError('아이디를 입력해주세요.');
      setIsLoading(false); // 로딩 종료
      return;
    }
    
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      setIsLoading(false); // 로딩 종료
      return;
    }

    try {
      const response = await axios.post('https://treenut.ddns.net/server/user/login', {
        id: Id,
        pw: password,
      });

      console.log('서버 응답 전체:', response); // 전체 응답 구조 확인
      console.log('서버 응답 데이터:', response.data); // 데이터 구조 확인

      if (response.status === 200) {
        setSuccess(true);
        
        // 실제 응답 데이터 로깅
        console.log('서버 응답 데이터 구조:', JSON.stringify(response.data, null, 2));
        
        // 서버 응답의 실제 구조에 맞게 접근
        const responseData = response.data;
        
        // 응답 구조에 따라 토큰과 사용자 ID 추출
        let token: string | undefined;
        let userId: string | undefined;

        // 중첩된 객체에서 토큰과 ID를 찾는 함수
        const findTokenAndUserId = (obj: any): void => {
          if (!obj || typeof obj !== 'object') return;
          
          // 직접 검사
          if (obj.token && !token) token = obj.token;
          if (obj.accessToken && !token) token = obj.accessToken;
          
          // ID 검사 - 이름을 ID로 사용할 수 있도록 추가
          if ((obj.id || obj.userId || obj.user_id) && !userId) {
            userId = obj.id || obj.userId || obj.user_id;
          } else if (obj.name && !userId) {
            // 이름을 ID로 사용 (서버 응답에 ID가 없고 이름만 있을 경우)
            userId = obj.name;
          }
          
          // 중첩된 객체 검사
          for (const key in obj) {
            if (obj[key] && typeof obj[key] === 'object') { // null 체크 추가
              findTokenAndUserId(obj[key]);
            }
          }
        };

        // API 응답의 다양한 구조에 대응
        // 1. 응답이 바로 { token, id/userId } 구조인 경우
        if (responseData.token) {
          token = responseData.token;
          // 가능한 모든 사용자 ID 필드 확인 (name 필드 추가)
          userId = responseData.id || responseData.userId || responseData.user_id || responseData.name;
        }
        // 2. 응답이 { accessToken, id/userId } 구조인 경우
        else if (responseData.accessToken) {
          token = responseData.accessToken;
          userId = responseData.id || responseData.userId || responseData.user_id || responseData.name;
        }
        // 3. 응답이 { data: { token, id/userId } } 구조인 경우
        else if (responseData.data && responseData.data.token) {
          token = responseData.data.token;
          userId = responseData.data.id || responseData.data.userId || responseData.data.user_id || responseData.data.name;
        }
        // 4. 응답이 { result: { token, id/userId } } 구조인 경우
        else if (responseData.result && responseData.result.token) {
          token = responseData.result.token;
          userId = responseData.result.id || responseData.result.userId || responseData.result.user_id || responseData.result.name;
        }
        // 5. 응답이 { data: { token }, user: { id } } 구조인 경우
        else if (responseData.data?.token && responseData.user) {
          token = responseData.data.token;
          userId = responseData.user.id || responseData.user._id || responseData.user.name;
        }
        
        // 가능한 모든 중첩 구조에서 토큰과 사용자 ID 확인
        if (!token || !userId) {
          // 재귀 함수 호출
          findTokenAndUserId(responseData);
        }

        // 로그 출력 향상
        console.log('서버 응답 구조:', JSON.stringify(response.data, null, 2));
        console.log('추출된 토큰 정보:', token ? '토큰 있음' : '토큰 없음');
        console.log('추출된 사용자 ID:', userId || '사용자 ID 없음');

        // 토큰만 있고 userId가 없는 특수한 경우 처리
        if (token && !userId && responseData.name) {
          userId = responseData.name;
          console.log('사용자 ID 대신 이름 사용:', userId);
        }

        if (token && userId) {
          handleLoginSuccess({ token, userId });
          console.log('로그인 성공 - 토큰 및 사용자 ID 저장');
          window.location.href = '/';
        } else {
          console.error('토큰 또는 사용자 ID가 반환되지 않았습니다.', response.data);
          setError('인증 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.');
        }
      } else {
        setError('로그인 실패. 다시 시도해 주세요.');
      }
    } catch (error: any) {
      console.error('Error:', error);
      
      // 서버에서 반환하는 구체적인 오류 메시지 활용
      if (error.response) {
        if (error.response.status === 401) {
          setError('아이디 또는 비밀번호가 올바르지 않습니다.');
        } else if (error.response.status === 404) {
          setError('등록되지 않은 사용자입니다.');
        } else if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else {
          setError(`로그인 실패 (${error.response.status}). 다시 시도해 주세요.`);
        }
      } else if (error.request) {
        setError('서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.');
      } else {
        setError('로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    } finally {
      setIsLoading(false); // 로딩 종료
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
          disabled={isLoading}
          className="w-full font-semibold tracking-wider py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-green-400"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4 text-sm">{error}</p>}
      {success && <p className="text-green-600 mt-4 text-sm">로그인 성공!</p>}
    </div>
  );
};

export default Login;
