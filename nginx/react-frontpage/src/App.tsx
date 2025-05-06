import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Home from './Pages/Home';
import SideBar from './Component/SideBar/SideBar';
import Resister from './Component/Resister/Resister';
import Login from './Component/Login/Login';
import CharacterChat from './Pages/CharacterChat';
import Profile from './Component/Profile/Profile';
import CharacterChatRoom from './Pages/CharacterChatRoom';
import CharacterAdd from './Component/CharacterMain/CharacterAdd';

const App: React.FC = () => {
  const location = useLocation();

  // /chat/:uuid 경로에서는 SideBar를 숨김
  const hideSidebar = location.pathname.startsWith('/chat/');

  return (
    <div className="flex h-screen">
      {!hideSidebar && (
        <div className="h-full">
          <SideBar />
        </div>
      )}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col items-center bg-[#1a1918]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/CharacterChat" element={<CharacterChat />} />
          <Route path="/chat/:uuid" element={<CharacterChatRoom />} />
          <Route path="/login" element={<Login />} />
          <Route path="/resister" element={<Resister />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/characterAdd" element={<CharacterAdd />} />
        </Routes>
      </div>
    </div>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
