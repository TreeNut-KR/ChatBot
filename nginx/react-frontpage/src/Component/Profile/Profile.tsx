import React from 'react';

const Profile: React.FC = () => {
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
            defaultValue="GingGang"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white bg-transparent text-lg"
          />
        </div>

        {/* 계정 */}
        <div className="flex flex-col items-start w-2/5 mx-auto">
          <label className="block text-white text-lg font-semibold mb-1">계정</label>
          <div className="flex items-center border border-gray-300 rounded-lg px-4 py-2 bg-transparent w-full">
            <input
              type="text"
              value="djjdjs74@gmail.com"
              disabled
              className="bg-transparent w-full text-white focus:outline-none text-lg"
            />
            <span className="ml-3 text-gray-500">🌐</span>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-start w-2/5 mx-auto mt-6 gap-7">
          <button
            className="px-12 py-2 rounded-lg font-semibold text-white"
            style={{ backgroundColor: '#4caf50' }}
          >
            변경하기
          </button>
          <button className="px-12 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600">
            회원탈퇴
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
