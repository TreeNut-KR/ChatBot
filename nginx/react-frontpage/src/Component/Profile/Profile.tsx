import React, { useState, useEffect } from 'react';

const Profile: React.FC = () => {
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [editedInfo, setEditedInfo] = useState({ name: '', email: '', pw: '' });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/server/user/findmyinfo', {
          method: 'GET',
          headers: {
            'Authorization': localStorage.getItem('jwt-token') || ''
          }
        });
        const data = await response.json();
        console.log('User Info Fetched:', data);
        setUserInfo(data);
        setEditedInfo({ ...data, pw: '' });
      } catch (error) {
        console.error('Error fetching user info:', error);
        alert('사용자 정보를 불러오는 중 오류가 발생했습니다.');
      }
    };
    fetchUserInfo();
  }, []);

  const handleUpdate = async () => {
    try {
      console.log('Updating User Info:', editedInfo);
      const response = await fetch('/server/user/changeUsername', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('jwt-token') || ''
        },
        body: JSON.stringify(editedInfo)
      });
      const result = await response.json();
      console.log('Update Response:', result);
      alert('사용자 정보가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('Error updating user info:', error);
      alert('사용자 정보를 업데이트하는 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="w-3/5 h-[55vh] mx-auto mt-12 flex flex-col justify-between">
      {/* 프로필 이미지 */}
      <div className="flex justify-center mb-4">
        <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow">
          <span className="text-gray-400 text-6xl">👤</span>
        </div>
      </div>

      {/* 프로필 정보 */}
      <div className="space-y-8">
        {/* 닉네임 */}
        <div className="flex flex-col items-start w-2/5 mx-auto">
          <label className="block text-white text-lg font-semibold mb-1">닉네임</label>
          <input
            type="text"
            value={editedInfo.name}
            onChange={(e) => setEditedInfo({ ...editedInfo, name: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-transparent text-lg"
            placeholder="닉네임을 입력하세요"
            title="닉네임"
            aria-label="닉네임"
          />
        </div>

        {/* 계정 */}
        <div className="flex flex-col items-start w-2/5 mx-auto">
          <label className="block text-white text-lg font-semibold mb-1">계정</label>
          <input
            type="text"
            value={editedInfo.email}
            readOnly
            className="bg-transparent w-full text-white focus:outline-none text-lg border border-gray-300 rounded-lg px-4 py-2 cursor-not-allowed"
            aria-label="계정 이메일"
            title="계정 이메일"
          />
        </div>

        {/* 버튼 */}
        <div className="flex justify-start w-2/5 mx-auto gap-4 flex-wrap">
          <button
            onClick={handleUpdate}
            className="flex-grow px-6 py-2 md:px-16 md:py-2 rounded-lg bg-green-700 font-semibold text-white hover:bg-green-800 text-sm md:text-base"
          >
            변경하기
          </button>
          <button 
            className="flex-grow px-6 py-2 md:px-16 md:py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 text-sm md:text-base"
          >
            회원탈퇴
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
