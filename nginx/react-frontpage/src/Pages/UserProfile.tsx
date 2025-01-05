import React, { useEffect, useState } from 'react';
import axios from 'axios';

// 사용자 프로필 타입 정의
interface User {
  email: string;
  nickname: string;
  id: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null); // 초기값은 null, user는 User 타입 또는 null

  useEffect(() => {
    // 서버에서 사용자 정보를 요청
    axios.get<User>('/userProfile') // 응답 데이터의 타입을 User로 지정
      .then(response => {
        setUser(response.data); // 응답 데이터를 user 상태에 저장
      })
      .catch(error => {
        console.error("Error fetching user profile:", error);
      });
  }, []);

  if (!user) {
    return <div>Loading...</div>; // user가 없으면 로딩 중 표시
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
