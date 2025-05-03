import React, { useState, useEffect } from 'react';

// 쿠키에서 값을 읽어오는 함수
const getCookieValue = (name: string): string => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return '';
};

// 멤버십 타입 정의 - DB 구조와 맞춤
type MembershipType = 'BASIC' | 'VIP';

const Profile: React.FC = () => {
  const [userInfo, setUserInfo] = useState({ name: '', email: '' });
  const [editedInfo, setEditedInfo] = useState({ name: '', email: '', pw: '' });
  const [membership, setMembership] = useState<MembershipType>('BASIC');
  const [isUpdatingMembership, setIsUpdatingMembership] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 사용자 정보만 가져와서 멤버십 정보도 함께 처리
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 사용자 정보 가져오기 - 이 정보에 멤버십 필드도 포함되어 있음
        await fetchUserInfo();
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류가 발생했습니다:', error);
        setError('사용자 정보를 불러올 수 없습니다. 다시 시도해 주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const jwtToken = getCookieValue('jwt-token');
      
      const response = await fetch('/server/user/findmyinfo', {
        method: 'GET',
        headers: {
          'Authorization': jwtToken || ''
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`사용자 정보 조회 실패: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('User Info Fetched:', data);
      setUserInfo(data);
      setEditedInfo({ ...data, pw: '' });
      
      // DB의 users 테이블에 membership 필드가 있으므로 이 정보를 사용
      if (data.membership) {
        setMembership(data.membership as MembershipType);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  };

  const handleUpdate = async () => {
    try {
      console.log('Updating User Info:', editedInfo);
      
      const jwtToken = getCookieValue('jwt-token');
      
      const response = await fetch('/server/user/changeUsername', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': jwtToken || ''
        },
        credentials: 'include',
        body: JSON.stringify(editedInfo)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user info');
      }
      
      const result = await response.json();
      console.log('Update Response:', result);
      alert('사용자 정보가 성공적으로 업데이트되었습니다.');
      
      // 사용자 정보 다시 가져오기
      fetchUserInfo();
    } catch (error) {
      console.error('Error updating user info:', error);
      alert('사용자 정보를 업데이트하는 중 오류가 발생했습니다.');
    }
  };

  const handleMembershipUpdate = async (newMembership: MembershipType) => {
    try {
      setIsUpdatingMembership(true);
      const jwtToken = getCookieValue('jwt-token');
      
      const response = await fetch('/server/user/membership/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': jwtToken || ''
        },
        credentials: 'include',
        body: JSON.stringify({ membership: newMembership })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update membership');
      }
      
      const result = await response.json();
      console.log('Membership Update Response:', result);
      
      if (result.status === 200) {
        setMembership(newMembership);
        alert(result.message || '멤버십이 성공적으로 변경되었습니다.');
      } else {
        alert(result.message || '멤버십 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating membership:', error);
      alert('멤버십을 변경하는 중 오류가 발생했습니다.');
    } finally {
      setIsUpdatingMembership(false);
    }
  };

  // 멤버십 배지 색상 설정
  const getMembershipBadgeColor = () => {
    switch (membership) {
      case 'BASIC': return 'bg-gray-600';
      case 'VIP': return 'bg-[#ffc107]';
      default: return 'bg-gray-600';
    }
  };

  // 멤버십 설명 표시
  const getMembershipDescription = () => {
    switch (membership) {
      case 'BASIC': 
        return '기본 멤버십';
      case 'VIP': 
        return 'VIP 멤버십 - 프리미엄 기능 사용 가능';
      default: 
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#3b7cc9]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center">
        <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-[#3b7cc9] text-white rounded hover:bg-[#2d62a0] transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-6">내 프로필</h1>
      
      <div className="bg-[#2a2928] rounded-lg p-8 shadow-lg">
        {/* 프로필 상단 영역: 이미지와 멤버십 배지 */}
        <div className="flex flex-col items-center mb-8">
          {/* 프로필 이미지 */}
          <div className="w-32 h-32 bg-[#3f3f3f] rounded-full flex items-center justify-center shadow-md mb-4 border-2 border-[#3b7cc9]">
            <span className="text-6xl">👤</span>
          </div>
          
          {/* 멤버십 배지 */}
          <div className="flex flex-col items-center">
            <span className={`${getMembershipBadgeColor()} text-white px-4 py-1 rounded-full font-semibold shadow-sm`}>
              {membership}
            </span>
            <p className="text-gray-300 mt-2 text-sm">{getMembershipDescription()}</p>
          </div>
        </div>

        {/* 프로필 정보 폼 */}
        <div className="space-y-6">
          {/* 닉네임 */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-white font-medium mb-2">
              닉네임
            </label>
            <input
              type="text"
              id="name"
              value={editedInfo.name}
              onChange={(e) => setEditedInfo({ ...editedInfo, name: e.target.value })}
              className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none focus:ring-2 focus:ring-[#3b7cc9]"
              placeholder="닉네임을 입력하세요"
            />
          </div>

          {/* 계정 */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-white font-medium mb-2">
              계정
            </label>
            <input
              type="text"
              id="email"
              value={editedInfo.email}
              readOnly
              className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none opacity-75 cursor-not-allowed"
            />
            <p className="text-gray-400 text-sm mt-1">계정 이메일은 변경할 수 없습니다</p>
          </div>

          {/* 멤버십 변경 */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">
              멤버십 변경
            </label>
            <div className="flex w-full space-x-4">
              <button
                onClick={() => handleMembershipUpdate('BASIC')}
                disabled={membership === 'BASIC' || isUpdatingMembership}
                className={`flex-1 p-3 rounded-lg text-white font-medium transition-colors
                  ${membership === 'BASIC' 
                    ? 'bg-[#3f3f3f] cursor-not-allowed' 
                    : 'bg-gray-600 hover:bg-gray-700'}`}
              >
                BASIC
              </button>
              <button
                onClick={() => handleMembershipUpdate('VIP')}
                disabled={membership === 'VIP' || isUpdatingMembership}
                className={`flex-1 p-3 rounded-lg text-white font-medium transition-colors
                  ${membership === 'VIP' 
                    ? 'bg-[#ffc107] text-gray-900 cursor-not-allowed' 
                    : 'bg-[#ffc107] text-gray-900 hover:bg-[#e6af06]'}`}
              >
                VIP
              </button>
            </div>
            {isUpdatingMembership && (
              <div className="w-full flex justify-center mt-4">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#3b7cc9]"></div>
              </div>
            )}
          </div>

          {/* 버튼 영역 */}
          <div className="flex flex-wrap gap-4 mt-8">
            <button
              onClick={handleUpdate}
              className="flex-1 px-6 py-3 bg-[#3b7cc9] text-white rounded-lg hover:bg-[#2d62a0] transition-colors font-medium"
            >
              변경사항 저장
            </button>
            <button 
              className="flex-1 px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
            >
              회원탈퇴
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
