import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
import HomeChat from './Pages/HomeChat';
import SideBar from './Component/SideBar/SideBar';
import './App.css';
import Topbar from './Component/TopBar/TopBar';
import Login from './Component/Login';
import UserProfile from './Pages/UserProfile';
import Resister from './Component/Resister';

function App() {
  return (
    <Router>
      <div className="App">
        <Topbar />
        <div className="container">
          <SideBar />
          <div className="others">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/homechat" element={<HomeChat />} />
              <Route path="/login" element={<Login />} /> {/* 로그인 페이지 라우트 추가 */}
              <Route path="/userProfile" element={<UserProfile />} />
              <Route path="/resister" element={<Resister />} />
              {/* 다른 라우트 추가 가능 */}
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
