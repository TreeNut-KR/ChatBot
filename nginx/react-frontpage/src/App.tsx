import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Home from './Pages/Home';
import SideBar from './Component/SideBar/SideBar';
import Register from './Component/Register/Register';
import Login from './Component/Login/Login';
import CharacterChat from './Pages/CharacterChat';
import Profile from './Component/Profile/Profile';
import CharacterChatRoom from './Pages/CharacterChatRoom';
import CharacterAdd from './Component/CharacterMain/CharacterAdd';
import PrivacyConsent from './Component/Register/PrivacyConsentProps';
import MainPage from './Pages/MainPage';

// JWT 토큰 체크용 커스텀 훅
const useAuthRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const redirected = useRef(false);

  useEffect(() => {
    // 인증이 필요 없는 경로
    const publicPaths = ['/', '/login', '/register', '/privacy', '/loginMain'];
    const isPublic = publicPaths.some(path => location.pathname === path || location.pathname.startsWith(path + '/'));

    // 쿠키에서 jwt-token 확인
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const jwtToken = getCookie('jwt-token');

    if (!jwtToken && !isPublic && !redirected.current) {
      redirected.current = true;
      alert('로그인 후 이용해주세요');
      navigate('/', { replace: true });
    } else if (jwtToken || isPublic) {
      redirected.current = false;
    }
  }, [location, navigate]);
};

// Router 내부에서만 훅 사용
const AppRoutes: React.FC = () => {
  useAuthRedirect();
  const location = useLocation();

  // /chat/:uuid 경로에서는 SideBar를 숨김
  const hideSidebar = location.pathname.startsWith('/chat/');

  return (
    <div className='flex h-screen'>
      {!hideSidebar && (
        <div className="h-full">
          <SideBar />
        </div>
      )}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col items-center bg-[#1a1918]">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/CharacterChat" element={<CharacterChat />} />
          <Route path="/chat/:uuid" element={<CharacterChatRoom />} />
          <Route path="/profile" element={<Profile />} />
          <Route path='/characterAdd' element={<CharacterAdd />} />
          <Route path="/privacy" element={<PrivacyConsent />} />
          {/* MainPage에서 로그인/회원가입을 오른쪽에 띄움 */}
          <Route path="/" element={<MainPage />}>
            <Route index element={<Login />} /> {/* / 경로에서 Login */}
            <Route path="loginMain" element={<Login />} />
            <Route path="/register" element={<Register />} /> {/* 회원가입 단독 페이지 */}
          
          </Route>
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
