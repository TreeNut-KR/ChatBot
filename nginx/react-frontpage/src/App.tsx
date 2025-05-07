import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import LoginMain from './Component/Login/LoginMain';

const App: React.FC = () => {
  return (
    <Router>
      <div className='flex h-screen'>
        <div className=" h-full">
          <SideBar />
        </div>
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
              <Route index element={<LoginMain />} /> {/* / 경로에서 Login */}
              <Route path="loginMain" element={<LoginMain />} />
              <Route path="register" element={<Register />} />
            </Route>
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
