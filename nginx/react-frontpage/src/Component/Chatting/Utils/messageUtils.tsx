import { Message } from '../Types';

// 메시지 처리 유틸리티 함수

// 이스케이프된 문자열 처리
export const unescapeString = (message: string): string => {
  return message
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\'/g, "'");
};

// JSON 문자열로 이스케이프된 메시지 복원 시도
export const tryParseEscapedJson = (message: string): string => {
  try {
    // 메시지가 JSON으로 이스케이프된 경우 파싱
    if (message.startsWith('"') && message.endsWith('"')) {
      const parsed = JSON.parse(`{"content": ${message}}`);
      if (parsed.content) return parsed.content;
    }
    return message;
  } catch (e) {
    // 파싱 실패 시 원본 사용
    console.log('메시지 파싱 오류, 원본 사용:', e);
    return message;
  }
};

// 채팅 로그에서 메시지 처리
export const processLogMessage = (log: any): { userMessage?: Message, aiMessage?: Message } => {
  const result: { userMessage?: Message, aiMessage?: Message } = {};
  
  // 사용자 메시지 처리
  if (log.input_data) {
    let userMessage = log.input_data;
    userMessage = unescapeString(userMessage);
    userMessage = tryParseEscapedJson(userMessage);
    
    result.userMessage = {
      user: '나',
      text: userMessage,
      className: 'bg-indigo-500 text-white',
      type: '',
    };
  }
  
  // AI 응답 메시지 처리
  if (log.output_data) {
    let aiMessage = log.output_data;
    aiMessage = unescapeString(aiMessage);
    aiMessage = tryParseEscapedJson(aiMessage);
    
    result.aiMessage = {
      user: 'AI',
      text: aiMessage,
      className: 'bg-gray-600 text-white',
      type: '',
    };
  }
  
  return result;
};