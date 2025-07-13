import React, { useState, useRef, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { ChatMessageProps } from '../Types';
import type { Components } from 'react-markdown';

// 코드 컴포넌트 - 타입 정의 및 메모화
const CodeComponent: Components['code'] = React.memo((props) => {
  const className = props.className || '';
  const children = props.children;
  const inline = 'inline' in props ? props.inline : false;
  const match = /language-(\w+)/.exec(className);
  const language = match ? match[1] : '';

  if (!inline && language) {
    return (
      <div className="relative my-4">
        <div className="flex items-center justify-between bg-gray-800 px-4 py-2 text-xs">
          <span className="text-gray-300">{language}</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
            }}
            className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded"
          >
            복사
          </button>
        </div>
        <SyntaxHighlighter
          style={vscDarkPlus as { [key: string]: React.CSSProperties }}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0 0 8px 8px',
            fontSize: '0.875rem',
          } as React.CSSProperties}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className="bg-gray-700 text-blue-300 px-1 py-0.5 rounded text-xs">
      {children}
    </code>
  );
});
CodeComponent.displayName = 'CodeComponent';

const ChatMessage: React.FC<ChatMessageProps> = ({
  text,
  className = '',
  user,
  retry,
  type = '',
  isIntroMessage = false,
  onRetrySend,
}) => {
  const [copied, setCopied] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // 복사 기능
  const copyToClipboard = useCallback((code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  // 마크다운 컴포넌트
  const markdownComponents = useMemo<Components>(() => ({
    code: CodeComponent,
    pre: (props) => (
      <div className="overflow-x-auto">
        {props.children}
      </div>
    ),
    p: (props) => (
      <p className="mb-2 last:mb-0 leading-relaxed text-[14px] sm:text-[15px]">
        {props.children}
      </p>
    ),
    ul: (props) => (
      <ul className="list-disc list-inside mb-2 space-y-1 text-[14px] sm:text-[15px]">
        {props.children}
      </ul>
    ),
    ol: (props) => (
      <ol className="list-decimal list-inside mb-2 space-y-1 text-[14px] sm:text-[15px]">
        {props.children}
      </ol>
    ),
    li: (props) => (
      <li className="leading-relaxed text-[14px] sm:text-[15px]">
        {props.children}
      </li>
    ),
  }), []);

  // 인트로 메시지
  if (isIntroMessage) {
    return (
      <div className="w-full py-4 mb-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
            <div className="text-blue-200 text-xs sm:text-sm leading-relaxed">
              {text}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 유저 메시지
  if (user === "나") {
    return (
      <div className="flex justify-end w-full m-0 p-0 mb-8"> {/* mb-8로 세로간격 2배 */}
        <div className="relative max-w-[84vw] sm:max-w-[54%] overflow-hidden mr-2">
          {retry && (
            <button
              className="absolute -left-8 bottom-1 w-6 h-6 flex items-center justify-center rounded-full transition text-xs z-10 text-gray-400 hover:text-white hover:bg-gray-700"
              title="다시 전송"
              onClick={retry}
            >
              ↻
            </button>
          )}
          <div
            ref={messageRef}
            className={`inline-block px-4 py-2 rounded-2xl rounded-br-md bg-blue-600 text-white ${className} max-w-full break-words whitespace-pre-wrap text-[13px] sm:text-[14.5px] leading-[1.5] relative`} // 폰트크기 20% 축소
          >
            <div className="break-words whitespace-pre-wrap text-[13px] sm:text-[14.5px] leading-[1.5]">
              {text}
            </div>
            {/* 우측 하단 꼬리표 */}
            <span
              className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 w-3 h-3 bg-blue-600 rounded-br-md"
              style={{
                clipPath: 'polygon(100% 0, 0 100%, 100% 100%)'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 클라이언트(AI) 메시지
  return (
    <div className="w-full m-0 p-0 flex mb-8"> {/* mb-8로 세로간격 2배 */}
      <div className="flex items-start w-full">
        {/* 아이콘 */}
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-8 sm:ml-0 mt-2 sm:mt-0">
          AI
        </div>
        {/* 이름+메시지 */}
        <div className="flex-1 min-w-0 ml-2 sm:ml-3">
          <div className="text-gray-300 text-[11px] sm:text-base font-medium mt-1 sm:mt-0 ml-0 sm:ml-1">
            Assistant
          </div>
          <div className="relative text-[14px] sm:text-[15px] bg-transparent">
            <div className="break-words whitespace-pre-wrap max-w-[60vw] sm:max-w-[410px] mt-0 text-[14px] sm:text-[15px] leading-[1.5] relative">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={markdownComponents}
              >
                {text}
              </ReactMarkdown>
              {/* ↺ 버튼: 텍스트의 우측하단 */}
              {onRetrySend && (
                <button
                  className="absolute right-0 bottom-0 mb-1 mr-1 w-7 h-7 flex items-center justify-center rounded-full transition text-xs z-10 text-gray-400 hover:text-white hover:bg-gray-700"
                  title="이 답변 다시 받기"
                  onClick={() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    onRetrySend({
                      text,
                      className,
                      user,
                      retry,
                      type,
                      isIntroMessage,
                    });
                  }}
                  style={{ fontSize: '18px' }}
                >
                  ↺
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChatMessage);
