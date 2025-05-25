import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
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
import { checkLoginStatus } from './Component/Chatting/Services/TokenUtils';
import KakaoCallback from './Component/Login/KakaoCallback';

// 로그인이 필요한 페이지에 대한 가드 컴포넌트
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  // 현재 URL 저장 (로그인 후 리디렉션용)
  const currentPath = window.location.pathname + window.location.search;
  
  // 로그인 상태 확인
  const isAuthenticated = checkLoginStatus();
  
  if (!isAuthenticated) {
    // 로그인 페이지로 리디렉션하고 원래 가려던 경로를 state로 전달
    return <Navigate to={`/login?redirect=${encodeURIComponent(currentPath)}&expired=true`} />;
  }

  return <>{children}</>;
};

// Router 내부에서만 훅 사용
const AppRoutes: React.FC = () => {
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
          {/* 로그인 없이 접근 가능한 페이지들 */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Register />} />
          <Route path="/find-password" element={<PrivacyConsent />} />
          <Route path="/privacy" element={<PrivacyConsent />} />

          {/* 로그인이 필요한 페이지들 */}
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/CharacterChat" element={<PrivateRoute><CharacterChat /></PrivateRoute>} />
          <Route path="/chat/:uuid" element={<PrivateRoute><CharacterChatRoom /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path='/characterAdd' element={<PrivateRoute><CharacterAdd /></PrivateRoute>} />
          
          {/* MainPage에서 로그인/회원가입을 오른쪽에 띄움 */}
          <Route path="/" element={<MainPage />}>
            <Route index element={<Login />} /> {/* / 경로에서 Login */}
            <Route path="loginMain" element={<Login />} />
            <Route path="/social/kakao/redirect" element={<KakaoCallback />} />
            <Route path="/register" element={<Register />} /> {/* 회원가입 단독 페이지 */}
          </Route>
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // 앱 로드 시 최초 한 번 토큰 상태 확인
  useEffect(() => {
    checkLoginStatus();
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
