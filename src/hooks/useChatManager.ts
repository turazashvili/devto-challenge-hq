'use client';

import { useState, useEffect, useCallback } from 'react';
import { Message } from '@progress/kendo-react-conversational-ui';
import { ChatConversation, ChatState } from '../types/chat';

const STORAGE_KEY = 'ai-chat-conversations';

const bot = { id: 0, avatarUrl: '', avatarAltText: 'AI Assistant' };

// Generate unique message IDs
const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export function useChatManager() {
  const [chatState, setChatState] = useState<ChatState>({
    conversations: [],
    activeConversationId: null
  });
  const [isHydrated, setIsHydrated] = useState(false);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const conversations = parsed.conversations.map((conv: {id: string, title: string, contextChallengeId?: string, messages: Array<{timestamp: string}>, createdAt: string, updatedAt: string}) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: {timestamp: string}) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setChatState({
          conversations,
          activeConversationId: parsed.activeConversationId
        });
      } catch (error) {
        console.error('Failed to load chat conversations:', error);
      } finally {
        setIsHydrated(true);
      }
    } else {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage whenever state changes
  const saveToStorage = useCallback((state: ChatState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, []);

  const createNewConversation = useCallback((title?: string, challengeId?: string) => {
    const nextIndexTitle = (count: number) => `Chat #${count + 1}`;
    const newConv: ChatConversation = {
      id: `chat_${Date.now()}`,
      title: title || nextIndexTitle(chatState.conversations.length),
      contextChallengeId: challengeId,
      messages: [
        {
          id: generateMessageId(),
          author: bot,
          timestamp: new Date(),
          text: challengeId
            ? 'Hello! I can help you with this specific challenge. Try asking me to add a task, create an idea, or find resources!'
            : 'Hello! I can help you manage your challenges, tasks, ideas, and resources. Try saying "create a new challenge" or "add a task"!'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setChatState(prevState => {
      const newState = {
        conversations: [...prevState.conversations, newConv],
        activeConversationId: newConv.id
      };
      saveToStorage(newState);
      return newState;
    });
    return newConv.id;
  }, [saveToStorage, chatState.conversations.length]);

  const addMessage = useCallback((conversationId: string, message: Message) => {
    setChatState(prevState => {
      const newState = {
        ...prevState,
        conversations: prevState.conversations.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                messages: [...conv.messages, message],
                updatedAt: new Date()
              }
            : conv
        )
      };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  const setActiveConversation = useCallback((conversationId: string | null) => {
    setChatState(prevState => {
      const newState = {
        ...prevState,
        activeConversationId: conversationId
      };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  const deleteConversation = useCallback((conversationId: string) => {
    setChatState(prevState => {
      const newState = {
        conversations: prevState.conversations.filter(conv => conv.id !== conversationId),
        activeConversationId: prevState.activeConversationId === conversationId
          ? null
          : prevState.activeConversationId
      };
      saveToStorage(newState);
      return newState;
    });
  }, [saveToStorage]);

  const getActiveConversation = useCallback(() => {
    if (!chatState.activeConversationId) return null;
    return chatState.conversations.find(conv => conv.id === chatState.activeConversationId) || null;
  }, [chatState]);

  return {
    conversations: chatState.conversations,
    activeConversation: getActiveConversation(),
    activeConversationId: chatState.activeConversationId,
    isHydrated,
    createNewConversation,
    addMessage,
    setActiveConversation,
    deleteConversation
  };
}