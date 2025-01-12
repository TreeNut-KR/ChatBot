import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Pages/Home';
// import HomeChat from './Pages/HomeChat';
import SideBar from './Component/SideBar/SideBar';
import './App.css';
import UserProfile from './Pages/UserProfile';
import Resister from './Component/Resister/Resister';
import Login from './Component/Login/Login';
import CharacterChat from './Pages/CharacterChat';
import Profile from './Component/Profile/Profile';

const App: React.FC = () => {
  return (
    <Router>
<div className='flex h-screen'>
  <div className=" h-full">
    <SideBar />
  </div>
  <div className="ml-[사이드바 너비]px flex-1 h-screen overflow-y-auto flex flex-col items-center bg-[#1a1918]">
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/CharacterChat" element={<CharacterChat />} />
      <Route path="/login" element={<Login />} />
      <Route path="/userProfile" element={<UserProfile />} />
      <Route path="/resister" element={<Resister />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  </div>
</div>


    </Router>
  );
};

export default App;
