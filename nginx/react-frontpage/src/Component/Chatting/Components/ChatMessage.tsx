import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatMessageProps } from '../Types';

const ChatMessage: React.FC<ChatMessageProps> = ({ text, className, user }) => {
  const isIntroMessage =
    text.includes("안녕하세요, 반갑습니다.") && text.includes("TreeNut 챗봇");

  const [copied, setCopied] = useState(false);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2초 후 원래대로
    });
  };

  return (
    <div className={`relative p-3 rounded-lg max-w-[70%] break-words ${className} mb-6`}>
      {!isIntroMessage && (
        user === "나" ? (
          <div className="absolute right-[-12px] bottom-2 w-0 h-0 
                          border-t-[12px] border-l-[14px] border-t-transparent border-l-indigo-500"></div>
        ) : (
          <div className="absolute left-[-12px] bottom-2 w-0 h-0 
                          border-t-[12px] border-r-[14px] border-t-transparent border-r-gray-600"></div>
        )
      )}
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkBreaks]} 
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ node, ...props }) => (
            <a 
              style={{ color: "lightblue" }} 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ), 
          img: ({ node, ...props }) => <img style={{ maxWidth: "100%", borderRadius: "8px" }} {...props} />, 
          code: ({ node, children, className, ...props }) => {
            const isInline = !(className && className.includes("language-"));
            const codeString = String(children).trim();
            const language = className?.replace("language-", "") || "javascript"; // 기본값 JavaScript

            return isInline ? (
              <code style={{ backgroundColor: "#222", padding: "2px 5px", borderRadius: "4px" }} {...props}>
                {children}
              </code>
            ) : (
              <div className="relative">
                <SyntaxHighlighter language={language} style={atomDark} className="rounded-lg p-4">
                  {codeString}
                </SyntaxHighlighter>
                {/* 복사 버튼 */}
                <button
                  onClick={() => copyToClipboard(codeString)}
                  className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded-md hover:bg-gray-600 transition"
                >
                  {copied ? "✅ Copied!" : "📋 Copy"}
                </button>
              </div>
            );
          },
        }}
      >
        {String(text)}
      </ReactMarkdown>
    </div>
  );
};

export default ChatMessage;