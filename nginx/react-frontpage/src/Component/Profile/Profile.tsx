import React, { useState, useEffect, useRef } from 'react';

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
  const [userInfo, setUserInfo] = useState({ name: '', email: '', userid: '', profileImage: '' });
  const [editedInfo, setEditedInfo] = useState({ name: '', email: '', userid: '', pw: '' });
  const [membership, setMembership] = useState<MembershipType>('BASIC');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [emailVerifyStatus, setEmailVerifyStatus] = useState<'idle' | 'success' | 'error' | 'expired' | 'notfound'>('idle');
  const [emailVerifyMessage, setEmailVerifyMessage] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 사용자 정보와 멤버십 정보 모두 가져오기
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 사용자 정보 가져오기
        await fetchUserInfo();

        // 멤버십 정보 별도 요청
        const jwtToken = getCookieValue('jwt-token');
        const membershipRes = await fetch('/server/user/membership', {
          method: 'GET',
          headers: {
            'Authorization': jwtToken || ''
          },
          credentials: 'include'
        });
        if (membershipRes.ok) {
          const membershipData = await membershipRes.json();
          if (membershipData.membership) {
            setMembership(membershipData.membership as MembershipType);
          }
        }
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
      setUserInfo({ ...data, profileImage: data.profileImage || data.image || '' });
      setEditedInfo({ ...data, pw: '' }); // data에 userid 포함
      // 프로필 이미지 URL 세팅 (백엔드에서 profileImage 필드로 내려줘야 함)
      setProfileImageUrl(data.profileImage || null);
      setProfileImagePreview(null); // 새로고침 시 미리보기 초기화
      
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

  
  const handleProfileImageClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // 파일 선택 시 미리보기 및 업로드
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // 파일 크기 제한 (예: 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('파일 크기가 5MB를 초과할 수 없습니다.');
      return;
    }
    
    // 미리보기
    const reader = new FileReader();
    reader.onloadend = () => setProfileImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    // 업로드
    try {
      setUploading(true);
      const jwtToken = getCookieValue('jwt-token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/server/user/profile/image', {
        method: 'POST',
        headers: {
          'Authorization': jwtToken || ''
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setProfileImageUrl(data.url);
        setProfileImagePreview(null);
        // userInfo에도 반영
        setUserInfo(prev => ({ ...prev, profileImage: data.url }));
        alert('프로필 이미지가 성공적으로 업로드되었습니다.');
      } else {
        alert(data.message || '프로필 이미지 업로드에 실패했습니다.');
      }
    } catch (err) {
      alert('프로필 이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
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

  // 인증 메일 발송
  const handleSendVerification = async () => {
    setEmailVerifyStatus('idle');
    setEmailVerifyMessage('');
    try {
      const jwtToken = getCookieValue('jwt-token');
      const res = await fetch('/server/user/email/Verification', {
        method: 'POST',
        headers: {
          'Authorization': jwtToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailInput })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsEmailSent(true);
        setEmailVerifyMessage('인증 코드가 이메일로 전송되었습니다.');
      } else {
        setEmailVerifyStatus('error');
        setEmailVerifyMessage(data.message || '이메일 인증 요청에 실패했습니다.');
      }
    } catch (e: any) {
      setEmailVerifyStatus('error');
      setEmailVerifyMessage(e.message || '이메일 인증 요청 중 오류가 발생했습니다.');
    }
  };

  // 인증 코드 확인
  const handleVerifyCode = async () => {
    setEmailVerifyStatus('idle');
    setEmailVerifyMessage('');
    try {
      const jwtToken = getCookieValue('jwt-token');
      const res = await fetch('/server/user/email/verify-code', {
        method: 'POST',
        headers: {
          'Authorization': jwtToken || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailInput, code: verificationCode })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setEmailVerifyStatus('success');
        setEmailVerifyMessage('이메일 인증이 완료되었습니다.');
        // 멤버십 정보 갱신 등 추가 처리
      } else if (data.code === 'expired_verification_code') {
        setEmailVerifyStatus('expired');
        setEmailVerifyMessage('인증 코드가 만료되었습니다.');
      } else if (data.code === 'invalid_verification_code') {
        setEmailVerifyStatus('error');
        setEmailVerifyMessage('인증 코드가 일치하지 않습니다.');
      } else if (data.code === 'not_found_verification_code') {
        setEmailVerifyStatus('notfound');
        setEmailVerifyMessage('인증 코드가 존재하지 않습니다.');
      } else {
        setEmailVerifyStatus('error');
        setEmailVerifyMessage(data.detail || '이메일 인증에 실패했습니다.');
      }
    } catch (e: any) {
      setEmailVerifyStatus('error');
      setEmailVerifyMessage(e.message || '이메일 인증 중 오류가 발생했습니다.');
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
          <div
            className="w-32 h-32 bg-[#3f3f3f] rounded-full flex items-center justify-center shadow-md mb-4 border-2 border-[#3b7cc9] cursor-pointer relative overflow-hidden"
            title="프로필 이미지 업로드"
            onClick={handleProfileImageClick}
            style={{ position: 'relative' }}
          >
            {profileImagePreview ? (
              <img
                src={profileImagePreview}
                alt="프로필 미리보기"
                className="w-full h-full object-cover rounded-full"
              />
            ) : userInfo.profileImage ? (
              <img
                src={userInfo.profileImage}
                alt="프로필"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-6xl">👤</span>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3b7cc9]"></div>
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleProfileImageChange}
              aria-label="프로필 이미지 업로드"
            />
            <span className="absolute bottom-2 right-2 bg-[#3b7cc9] text-white text-xs px-2 py-1 rounded shadow">변경</span>
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

          {/* ID */}
          <div className="mb-4">
            <label htmlFor="userid" className="block text-white font-medium mb-2">
              ID
            </label>
            <input
              type="text"
              id="userid"
              value={editedInfo.userid}
              readOnly
              className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none opacity-75 cursor-not-allowed"
            />
            <p className="text-gray-400 text-sm mt-1">계정 ID는 변경할 수 없습니다</p>
          </div>

          {/* 이메일 인증 */}
          <div className="mb-6">
            <label className="block text-white font-medium mb-2">이메일</label>
            {membership === 'VIP' ? (
              <>
                <input
                  type="email"
                  value={userInfo.email}
                  readOnly
                  className="w-full p-3 rounded-lg bg-[#3f3f3f] text-white border-none opacity-75 cursor-not-allowed"
                  aria-labelledby="email-label"
                  title="현재 이메일 주소"
                  placeholder="이메일 주소"
                />
                <p className="text-gray-400 text-sm mt-1">계정에 등록된 이메일은 변경할 수 없습니다</p>
              </>
            ) : (
              <>
                <div className="flex w-full space-x-4">
                  {/* 이메일 입력창 */}
                  <input
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none"
                  />

                  {/* 인증 버튼 */}
                  <button
                    onClick={handleSendVerification}
                    className="p-3 rounded-lg text-white font-medium bg-[#3b7cc9] hover:bg-[#2d62a0] transition-colors"
                  >
                    인증 요청
                  </button>
                </div>
                {isEmailSent && (
                  <div className="mt-4">
                    <label className="block text-white font-medium mb-2">인증 코드</label>
                    <div className="flex w-full space-x-4">
                      <input
                        type="text"
                        placeholder="인증 코드를 입력하세요"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="flex-1 p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none"
                      />
                      <button
                        onClick={handleVerifyCode}
                        className="p-3 rounded-lg text-white font-medium bg-[#3b7cc9] hover:bg-[#2d62a0] transition-colors"
                      >
                        인증 확인
                      </button>
                    </div>
                  </div>
                )}
                {emailVerifyMessage && (
                  <p className={`mt-2 text-sm ${emailVerifyStatus === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                    {emailVerifyMessage}
                  </p>
                )}
              </>
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
