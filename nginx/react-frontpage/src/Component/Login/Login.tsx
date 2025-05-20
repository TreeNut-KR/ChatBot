import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import logo_naver_kr from './logo/logo_naver_kr.png';
import logo_kakao_kr from './logo/logo_kakao_kr.png';
import logo_google_kr from './logo/logo_google_kr.png';
import { useGoogleLogin } from '@react-oauth/google';
import { setCookie, getCookie, removeCookie, setObjectCookie } from '../../Cookies';
import { useNavigate, useLocation } from 'react-router-dom'; // 추가

// 인앱 브라우저 감지 함수
const isInAppBrowser = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  if (/KAKAOTALK/i.test(userAgent)) return true;
  if (/FB_IAB|FBAN|FBAV|Instagram|Line|NAVER|NaverSearch/i.test(userAgent)) return true;
  return false;
};

const usedCodes = new Set<string>(); // 인가코드 재사용 방지용

// 구글 소셜 로그인 성공 후 인가코드를 서버로 전달
const handleGoogleSocialLogin = async (code: string, setError: (msg: string) => void) => {
  if (usedCodes.has(code)) {
    setError('구글 인가코드는 한 번만 사용할 수 있습니다. 다시 로그인 해주세요.');
    return false;
  }
  usedCodes.add(code);

  try {
    // 인가코드 콘솔 출력
    console.log('구글 인가코드:', code);

    // redirect_uri를 명시적으로 전달
    const serverResponse = await fetch(
      '/server/user/social/google/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          redirect_uri: 'postmessage', // popup 모드에서는 반드시 'postmessage'
        }),
      }
    );
    const data = await serverResponse.json();
    const { token } = data;

    setCookie('jwt-token', token);

    // 토큰에서 사용자 ID 추출
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      if (payload && payload.sub) {
        setCookie('user_id', payload.sub);
      }
    } catch (e) {
      console.error('JWT 토큰 디코딩 오류:', e);
    }

    return true;
  } catch (error: any) {
    if (
      error.response &&
      error.response.status === 400 &&
      typeof error.response.data === 'object' &&
      (
        error.response.data.error === 'invalid_grant' ||
        (typeof error.response.data.error_description === 'string' &&
          error.response.data.error_description.includes('already redeemed'))
      )
    ) {
      setError('구글 인가코드가 이미 사용되었습니다. 다시 로그인 해주세요.');
    } else {
      setError('구글 소셜로그인 서버 처리 실패: ' + (error.response?.data?.message || '알 수 없는 오류'));
    }
    return false;
  }
};

const Login: React.FC = () => {
  const [Id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showExpiredMessage, setShowExpiredMessage] = useState(false);
  const navigate = useNavigate(); // 추가
  const location = useLocation();

  // jwt-token이 있으면 /home으로 이동
  useEffect(() => {
    const token = getCookie('jwt-token');
    if (token) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    // URL 파라미터에서 expired=true 확인
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setShowExpiredMessage(true);
    }
  }, [location]);

  const googleLogin = useGoogleLogin({
    flow: 'auth-code',
    redirect_uri: 'postmessage', // popup 모드에서는 반드시 'postmessage'로!
    onSuccess: async (response) => {
      const code = response.code;
      if (!code) {
        setError('구글 인가코드가 없습니다.');
        return;
      }
      setIsLoading(true);
      const loginSuccess = await handleGoogleSocialLogin(code, setError);
      setIsLoading(false);
      if (loginSuccess) {
        window.location.href = '/';
      }
    },
    onError: () => {
      setError('구글 로그인 실패. 다시 시도해 주세요.');
    },
  });

  // 구글 로그인 버튼 클릭 핸들러
  const handleGoogleLogin = () => {
    if (isInAppBrowser()) {
      const currentUrl = window.location.href;
      setCookie('redirectAfterLogin', currentUrl);
      if (/android/i.test(navigator.userAgent)) {
        window.location.href = `intent://${window.location.host}${window.location.pathname}#Intent;scheme=${window.location.protocol.slice(0,  -1)};package=com.android.chrome;end`;
      } else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
        window.location.href = currentUrl;
      } else {
        window.open(currentUrl, '_system');
      }
    } else {
      googleLogin();
    }
  };

  // 네이버/카카오 로그인 핸들러(임시)
  const handleNaverLogin = () => {
    if (isInAppBrowser()) {
      alert('외부 브라우저에서 로그인해주세요.');
      return;
    }
    alert('네이버 로그인은 아직 준비 중입니다.');
  };
  const handleKakaoLogin = () => {
    if (isInAppBrowser()) {
      alert('외부 브라우저에서 로그인해주세요.');
      return;
    }
    alert('카카오 로그인은 아직 준비 중입니다.');
  };

  // 일반 로그인
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);
    if (!Id.trim()) {
      setError('아이디를 입력해주세요.');
      setIsLoading(false);
      return;
    }
    if (!password) {
      setError('비밀번호를 입력해주세요.');
      setIsLoading(false);
      return;
    }
    try {
      const response = await axios.post('/server/user/login', { id: Id, pw: password });
      if (response.status === 200) {
        setSuccess(true);
        const { token } = response.data;
        
        // JWT 토큰 저장
        setCookie('jwt-token', token);
        
        // 토큰에서 사용자 ID 추출하여 저장
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(window.atob(base64));
          if (payload && payload.sub) {
            setCookie('user_id', payload.sub);
          }
        } catch (e) {
          console.error('JWT 토큰 디코딩 오류:', e);
        }
        
        window.location.href = '/';
      } else {
        setError('로그인 실패. 다시 시도해 주세요.');
      }
    } catch (error: any) {
      setError('로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 토큰 만료 메시지 표시 */}
      {showExpiredMessage && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">세션 만료</p>
          <p>로그인 세션이 만료되었습니다. 다시 로그인해 주세요.</p>
        </div>
      )}
      
      <form className="bg-white p-8 rounded-lg text-left w-full max-w-md shadow-lg" onSubmit={handleSubmit}>
        <div className="flex justify-center items-center mb-1">
          <h2 className="text-green-600 text-2xl whitespace-nowrap">TreeNut</h2>
        </div>
        <div className="flex justify-center items-center mb-1">
          <h2 className="text-lg whitespace-nowrap">AI 어시스턴트한테 도움을 받아보세요!</h2>
        </div>
        <h2 className="text-center text-sm mb-3 text-gray-600">
          TreeNut과 함께 편리한 AI 서비스를 이용해보세요
        </h2>
        <div className="flex flex-col items-center mb-3">
          <img
            src={logo_naver_kr}
            alt="Naver Logo"
            className="w-25 mb-2 transition-transform transform hover:translate-y-[-5px] cursor-pointer"
            onClick={handleNaverLogin}
          />
          <img
            src={logo_kakao_kr}
            alt="Kakao Logo"
            className="w-25 mb-2 transition-transform transform hover:translate-y-[-5px] cursor-pointer"
            onClick={handleKakaoLogin}
          />
          <img
            src={logo_google_kr}
            alt="Google Logo"
            className="w-25 mb-2 transition-transform transform hover:translate-y-[-5px] cursor-pointer"
            onClick={handleGoogleLogin}
            onTouchStart={handleGoogleLogin}
          />
        </div>
        <div className="flex items-center mb-4">
          <div className="flex-1 h-[1px] bg-gray-300"></div>
          <span className="mx-2 text-gray-600 text-sm">또는</span>
          <div className="flex-1 h-[1px] bg-gray-300"></div>
        </div>
        <div className="mb-2">
          <input
            type="text"
            id="Id"
            value={Id}
            onChange={(e) => setId(e.target.value)}
            required
            className="w-full p-2 border text-gray-700 border-gray-300 rounded-md opacity-70 focus:outline-none focus:ring-0 focus:border-gray-300"
            placeholder="아이디"
          />
        </div>
        <div className="mb-2">
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border text-gray-700 border-gray-300 rounded-md opacity-70 focus:outline-none focus:ring-0 focus:border-gray-300"
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
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="w-full mt-2 font-semibold tracking-wider py-2 bg-white text-green-600 border border-green-600 rounded-md hover:bg-green-50 transition"
        >
          회원가입
        </button>
        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
        {success && <p className="text-green-600 mt-3 text-sm">로그인 성공!</p>}
      </form>
    </div>
  );
};

export default Login;