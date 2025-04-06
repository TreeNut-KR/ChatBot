export type Message = {
    user: string;
    className: string;
    text: string;
    type: string;
  };
  
  export interface ChatHeaderProps {
    model: string;
    setModel: React.Dispatch<React.SetStateAction<string>>;
    googleAccess: string;
    setGoogleAccess: React.Dispatch<React.SetStateAction<string>>;
    onMenuClick: () => void;
  }
  
  export interface ChatMessageProps {
    user: string;
    text: string;
    className: string;
  }
  
  export interface ChatContainerProps {
    messages: Message[];
    isLoading: boolean;
    chatContainerRef: React.RefObject<HTMLDivElement>;
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
    mongo_chatroomid?: string;
    roomid?: string;
    title?: string;
    Title?: string;
    first_message?: string;
    created_at?: string;
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