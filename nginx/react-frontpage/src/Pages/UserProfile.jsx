// src/Pages/UserProfile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserProfile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 서버에서 사용자 정보를 요청
    axios.get('/userProfile')
      .then(response => {
        setUser(response.data);
      })
      .catch(error => {
        console.error("Error fetching user profile:", error);
      });
  }, []);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>로그인 성공</h1>
      <p>이메일: {user.email}</p>
      <p>닉네임: {user.nickname}</p>
      <p>아이디: {user.id}</p>
      <p>이름: {user.name}</p>
      <p>나이: {user.age}</p>
      <p>성별: {user.gender}</p>
      <p>전화번호: {user.mobile}</p>
    </div>
  );
};

export default UserProfile;
