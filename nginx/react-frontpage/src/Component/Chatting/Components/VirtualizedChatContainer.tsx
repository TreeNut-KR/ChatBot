import React, { useRef, useMemo, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { Message } from '../Types';

// Define the props interface for VirtualizedChatContainer
interface VirtualizedChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  handleRetrySend: (message: Message) => void;
  layoutRefreshKey?: number;
}

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

const getMarginTop = (index: number, messages: Message[]) => {
  if (index === 0) return 0;
  const message = messages[index];
  const prevMessage = messages[index - 1];
  const isUser = message.user === "나";
  const isPrevUser = prevMessage && prevMessage.user === "나";
  // 간격 정상화: 유저/AI 사이 32px, 같은 타입 16px
  return isUser !== isPrevUser ? 32 : 16;
};

const VirtualizedChatContainer: React.FC<VirtualizedChatContainerProps> = ({
  messages,
  isLoading,
  handleRetrySend,
  layoutRefreshKey = 0
}) => {
  const virtuosoRef = useRef<any>(null);

  // 원본 메시지 콘솔 출력 (디버깅용)
  useEffect(() => {
    console.log('API에서 받아온 messages 원본:', messages);
  }, [messages]);

  // 메시지 정렬
  const stableMessages = useMemo(() => {
    return [...messages].sort((a, b) => {
      // 인트로 메시지는 항상 맨 위
      if (a.isIntroMessage) return -1;
      if (b.isIntroMessage) return 1;

      // timestamp가 있으면 timestamp 기준 정렬 (이른 시간 → 늦은 시간)
      if (a.timestamp && b.timestamp) {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        if (aTime !== bTime) return aTime - bTime;
        // timestamp가 같으면 유저("나")가 AI보다 위에 오도록
        if (a.user === "나" && b.user !== "나") return -1;
        if (a.user !== "나" && b.user === "나") return 1;
        return 0;
      }
      // 하나만 있으면 있는 쪽이 뒤로
      if (a.timestamp) return 1;
      if (b.timestamp) return -1;

      // fallback: id에서 timestamp 추출
      const getTimestamp = (id: string) => {
        if (!id) return 0;
        const parts = id.split('_');
        if (parts.length >= 3) {
          const timestamp = parseInt(parts[2]);
          return isNaN(timestamp) ? 0 : timestamp;
        }
        return 0;
      };
      const aTime = getTimestamp(a.id || '');
      const bTime = getTimestamp(b.id || '');
      if (aTime !== bTime) return aTime - bTime;
      // id timestamp도 같으면 유저("나")가 위에
      if (a.user === "나" && b.user !== "나") return -1;
      if (a.user !== "나" && b.user === "나") return 1;

      // 마지막: id 알파벳 순
      return (a.id || '').localeCompare(b.id || '');
    });
  }, [messages]);

  // 자동 스크롤: 메시지 추가 시 맨 아래로
  useEffect(() => {
    if (virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex?.({
        index: stableMessages.length - 1,
        align: 'end',
        behavior: 'auto',
      });
    }
  }, [stableMessages.length, layoutRefreshKey]);

  if (isLoading && stableMessages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
          <span className="ml-2 text-sm">채팅을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  // 채팅이 없을 때 스크롤/스크롤바 숨김
  return (
    <div
      className={`flex-1 relative bg-gray-900 pb-[120px] sm:pb-32 ${
        stableMessages.length === 0 ? 'overflow-hidden' : 'overflow-auto'
      } scrollbar-thin scrollbar-thumb-blue-700 scrollbar-track-gray-800`}
    >
      <div className="flex flex-col w-full h-full">
        {stableMessages.map((message, idx) => (
          <div
            key={message.id}
            className={
              idx === stableMessages.length - 1
                ? "mb-32 sm:mb-12" // 모바일은 mb-32, PC는 mb-12
                : "mb-8"
            }
          >
            <ChatMessage
              {...message}
              onRetrySend={message.user === "AI" ? (msg) => handleRetrySend(msg) : undefined}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(VirtualizedChatContainer);