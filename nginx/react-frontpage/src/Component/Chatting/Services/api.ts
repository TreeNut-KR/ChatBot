import { getCookie } from '../../../Cookies';
import { ChatRoom } from '../Types';

// 토큰 가져오기 및 형식 처리 함수 - localStorage 대신 쿠키 사용
export const getAuthHeader = (): Record<string, string> => {
  const token = getCookie('jwt-token');
  if (!token) {
    // 오류 대신 빈 헤더 객체 반환 (에러 방지)
    console.warn('JWT 토큰이 없습니다. 인증이 필요한 기능은 동작하지 않을 수 있습니다.');
    return { 'Content-Type': 'application/json' };
  }

  // Bearer 접두사가 이미 있는지 확인하고 제거
  const tokenValue = token.startsWith('Bearer ') 
    ? token.substring(7) // 'Bearer ' 접두사 제거
    : token;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenValue}`
  };
};

export const API_BASE_URL = '/server';

// 임시 인터페이스 정의 - Types.ts에 있다면 이 부분은 제거
// 이미 불러온 ChatRoom 인터페이스를 사용하나,
// 정의되지 않은 경우를 대비하여 주석 처리된 코드를 남겨둠
/*
interface ChatRoom {
  id: string;
  title?: string;
  last_message?: string;
  created_at?: string;
  updated_at?: string;
  updatedAt?: string; // 서버 응답의 다양한 형태 대응
  timestamp?: string; // 내부적으로 추가하는 필드
  [key: string]: any; // 기타 가능한 필드들
}
*/

// 채팅방 목록 가져오기
export const fetchChatRooms = async (): Promise<ChatRoom[]> => {
  try {
    const url = `${API_BASE_URL}/chatroom/office/find_my_rooms`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('채팅방 목록을 가져오는데 실패했습니다.');
    }

    const data = await response.json();
    
    // 응답 형식에 따라 채팅방 목록 추출
    let rooms = Array.isArray(data) ? data : (data.rooms || []);
    
    // 빈 배열이 아닌지 확인
    if (!Array.isArray(rooms) || rooms.length === 0) {
      console.log('채팅방 목록이 비어있거나 유효하지 않은 형식입니다.', data);
      return [];
    }
    
    // 타입 안전성을 위해 필수 필드 확인 및 추가
    const processedRooms: ChatRoom[] = rooms.map((room: any) => {
      // 기본 ID 필드가 없으면 고유 키 생성
      if (!room.id && !room.roomid && !room.mongo_chatroomid && !room.chatroom_id) {
        console.warn('채팅방에 ID가 없습니다. 임시 ID 생성:', room);
      }
      
      // 타임스탬프 필드 확인 및 추가
      const timestamp = room.updatedAt || room.updated_at || room.created_at || new Date().toISOString();
      
      // 반환 객체에 필요한 모든 필드 포함
      return {
        ...room,
        timestamp,
      };
    });
    
    // 시간 기준으로 내림차순 정렬 (최신순)
    processedRooms.sort((a, b) => {
      const dateA = new Date(a.timestamp || '').getTime();
      const dateB = new Date(b.timestamp || '').getTime();
      return dateB - dateA;
    });
    
    return processedRooms;
  } catch (error) {
    console.error('채팅방 목록 가져오기 오류:', error);
    throw error;
  }
};

// 채팅방 삭제하기 함수 개선
export const deleteChatRoom = async (roomId: string) => {
  if (!roomId) {
    throw new Error('채팅방 ID가 없습니다.');
  }

  // roomId가 공백이 있는 경우를 대비해 trim() 처리
  const trimmedRoomId = roomId.trim();
  const url = `${API_BASE_URL}/chatroom/office/${encodeURIComponent(trimmedRoomId)}/delete_room`;
  console.log('삭제 요청 URL:', url);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('채팅방 삭제 응답 오류:', response.status, errorText);
      throw new Error(`채팅방 삭제에 실패했습니다. 상태 코드: ${response.status}`);
    }

    // 응답 본문 확인 (API에 따라 다를 수 있음)
    try {
      return await response.json();
    } catch (e) {
      // 응답이 JSON이 아닌 경우 빈 객체 반환 (성공 간주)
      return { success: true };
    }
  } catch (error) {
    console.error('채팅방 삭제 요청 실패:', error);
    throw error;
  }
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

// 사용자 ID 가져오기 함수 추가 (쿠키 사용)
export const getUserId = (): string | null => {
  return getCookie('user_id') || null;
};