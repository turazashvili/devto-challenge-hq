'use client';

import * as React from 'react';
import { Chat, Message, User } from '@progress/kendo-react-conversational-ui';

const user: User = {
  id: 1,
  name: 'You',
  avatarUrl: ''
};

const bot: User = {
  id: 0,
  name: 'AI Assistant',
  avatarUrl: ''
};

const initialMessages: Message[] = [
  {
    id: 1,
    author: bot,
    text: 'Hello! This is a test chat to verify the input box works.',
    timestamp: new Date()
  }
];

export default function TestChat() {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);

  const handleSendMessage = (event: any) => {
    setMessages((prev) => [
      ...prev,
      { ...event.message, text: event.message.text || ' ', id: Date.now().toString() }
    ]);

    // Simple echo response
    setTimeout(() => {
      const response: Message = {
        id: Date.now() + 1,
        author: bot,
        text: `You said: "${event.message.text}"`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, response]);
    }, 1000);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Test Chat Component</h2>
      <Chat
        messages={messages}
        authorId={user.id}
        onSendMessage={handleSendMessage}
        placeholder="Type your message here..."
        height={400}
        width={500}
        className="k-m-auto"
      />
    </div>
  );
}