'use client';

import * as React from 'react';
import { ChatMessageTemplateProps } from '@progress/kendo-react-conversational-ui';
import { MarkdownRenderer } from './MarkdownRenderer';

const ChatMessageTemplate = (props: ChatMessageTemplateProps) => {
  const message = props.item as any;
  const isBot = message.author.id === 0; // Bot has id 0
  const isProcessing = Boolean(message.processing);

  const bubbleClass = `k-chat-bubble${isProcessing ? '' : (!isBot ? ' user-bubble' : '')}`;

  return (
    <div className={bubbleClass}>
      {isProcessing ? (
        <div className="inline-flex items-center text-xs text-gray-500 bg-white px-2 py-1 rounded border">
          <span>AI is processing</span>
          <span className="typing-dots ml-2"><span></span><span></span><span></span></span>
        </div>
      ) : isBot ? (
        <MarkdownRenderer 
          content={message.text} 
          className="chat-markdown" 
        />
      ) : (
        <div className="k-chat-message-text">
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ChatMessageTemplate;
