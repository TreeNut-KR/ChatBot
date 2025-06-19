export interface Message {
  user: string;
  text: string;
  className?: string;
  type?: string;
  retry?: boolean;
}

export interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  handleRetrySend: (message: Message) => void;
}

export interface ChatHeaderProps {
  model: string;
  setModel: React.Dispatch<React.SetStateAction<string>>;
  googleAccess: string;
  setGoogleAccess: React.Dispatch<React.SetStateAction<string>>;
  onMenuClick: () => void;
}

export interface ChatMessageProps extends Message {
  onRetry?: (message: Message) => void;
}

export interface ChatFooterProps {
  userInput: string;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  scrollToBottom: () => void;
}

export interface ChattingProps {
  messages: Message[];
  onSend: (message: Message) => void;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// 채팅방 정보를 위한 인터페이스
export interface ChatRoom {
  // 기본 채팅방 식별자들 (다양한 API 응답 구조에 대응)
  id?: string;                  // 기본 ID
  roomid?: string;              // 대체 ID 필드명
  mongo_chatroomid?: string;    // MongoDB ID
  chatroom_id?: string;         // 채팅방 ID
  
  // 메타데이터
  title?: string;               // 채팅방 제목
  Title?: string;               // 대문자로 시작하는 제목 필드 (API 일관성 없을 때)
  last_message?: string;        // 마지막 메시지
  
  // 시간 필드 (다양한 형식에 대응)
  created_at?: string;          // 생성 시간
  updated_at?: string;          // 수정 시간
  updatedAt?: string;           // camelCase 수정 시간
  timestamp?: string;           // 타임스탬프 필드
  
  // 사용자 정보
  user_id?: string;             // 소유자 ID
  username?: string;            // 소유자 이름
  
  // 기타 가능한 필드 수용 (위에 명시되지 않은 필드도 허용)
  [key: string]: any;
}

export interface ChatSidebarProps {
  rooms: ChatRoom[];
  onClose: () => void;
  onSelectRoom: (roomId: string) => void;
  onDeleteRoom: (roomId: string, title?: string) => void;
  isLoading: boolean;
  onCreateNewChat: () => void;
}

export interface ToastProps {
  message: string;
  type: string;
  onClose: () => void;
}