// 토큰 가져오기 및 형식 처리 함수
export const getAuthHeader = () => {
    const token = localStorage.getItem('jwt-token');
    if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');
  
    // Bearer 접두사가 이미 있는지 확인하고 제거
    const tokenValue = token.startsWith('Bearer ') 
      ? token.substring(7) // 'Bearer ' 접두사 제거
      : token;
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenValue}`
    };
  };
  
  export const API_BASE_URL = 'https://treenut.ddns.net/server';
  
  // 채팅방 목록 가져오기
  export const fetchChatRooms = async () => {
    const url = `${API_BASE_URL}/chatroom/office/find_my_rooms`;
  
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeader(),
    });
  
    if (!response.ok) {
      throw new Error('채팅방 목록을 가져오는데 실패했습니다.');
    }
  
    return await response.json();
  };
  
  // 채팅방 삭제하기
  export const deleteChatRoom = async (roomId: string) => {
    const url = `${API_BASE_URL}/chatroom/office/${roomId}/delete_room`;
  
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
  
    if (!response.ok) {
      throw new Error('채팅방 삭제에 실패했습니다.');
    }
  
    return await response.json();
  };
  
  // 새 채팅방 생성하기
  export const createNewChatRoom = async () => {
    const url = `${API_BASE_URL}/chatroom/office`;
  
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeader(),
    });
  
    if (!response.ok) {
      throw new Error('새 채팅방 생성에 실패했습니다.');
    }
  
    return await response.json();
  };
  
  // 챗봇 응답 받기
  export const getChatResponse = async (roomId: string, inputText: string, model: string, googleAccess: string) => {
    const url = `${API_BASE_URL}/chatroom/office/${roomId}/get_response`;
    
    const requestBody = {
      input_data_set: inputText,
      route_set: model,
      google_access_set: googleAccess,
    };
  
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(requestBody),
    });
  
    if (!response.ok) {
      throw new Error('서버 요청 실패');
    }
  
    return await response.json();
  };
  
  // 채팅 로그 불러오기
  export const loadChatLogs = async (roomId: string) => {
    const url = `${API_BASE_URL}/chatroom/office/${roomId}/load_logs`;
  
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({}),
    });
  
    if (!response.ok) {
      throw new Error(`채팅 로그를 불러오는데 실패했습니다. (상태 코드: ${response.status})`);
    }
  
    return await response.json();
  };