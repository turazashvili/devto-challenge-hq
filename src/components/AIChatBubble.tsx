'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Chat, Message, User } from '@progress/kendo-react-conversational-ui';
import { Button } from '@progress/kendo-react-buttons';
import { useChatManager } from '../hooks/useChatManager';
import { useTrackerContext } from '../context/TrackerContext';
import { useAISettings } from '../hooks/useAISettings';
import { aiService } from '../services/aiService';
import { functionExecutor } from '../services/functionExecutor';
import AISettingsDialog from './AISettingsDialog';
import ChatMessageTemplate from './ChatMessageTemplate';
import type {
  ChatCompletionMessageParam,
  ChatCompletionToolMessageParam,
} from 'openai/resources/chat/completions';

interface AIChatBubbleProps {
  challengeId?: string;
}

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

// Generate unique message IDs
const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default function AIChatBubble({ challengeId }: AIChatBubbleProps) {
  const pathname = usePathname();

  // Auto-detect challenge ID from URL if not provided as prop
  const currentChallengeId = React.useMemo(() => {
    if (challengeId) return challengeId;

    // Check if we're on a challenge page: /challenges/[id]
    const challengeMatch = pathname?.match(/^\/challenges\/([^\/]+)/);
    if (challengeMatch) {
      return challengeMatch[1];
    }

    return undefined;
  }, [challengeId, pathname]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  // const [streamingText, setStreamingText] = React.useState('');
  const [windowWidth, setWindowWidth] = React.useState(0);
  const [windowHeight, setWindowHeight] = React.useState(0);
  const [searchEnabled, setSearchEnabled] = React.useState(false);
  const headerRef = React.useRef<HTMLDivElement | null>(null);
  const [headerHeight, setHeaderHeight] = React.useState(72);

  // Handle responsive sizing
  React.useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
    };
    handleResize(); // Set initial dimensions
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track header height to size the chat area precisely
  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const element = headerRef.current;
    if (!element) {
      return;
    }

    setHeaderHeight(element.offsetHeight);

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setHeaderHeight(entry.contentRect.height);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [isOpen]);

  const dimensions = React.useMemo(() => {
    const width = windowWidth || 1024;
    const height = windowHeight || 768;
    const compact = width < 640;

    const horizontalInset = compact ? 16 : 24;
    const topInset = compact ? 16 : 32;
    const bottomInset = compact ? 16 : 32;

    const availableHeight = Math.max(0, height - (topInset + bottomInset));
    const preferredHeight = compact ? 520 : 600;
    const desiredHeight = Math.min(preferredHeight, availableHeight);
    const minChatSection = 240;
    const minHeightNeeded = Math.min(availableHeight, headerHeight + minChatSection);
    const bubbleHeight = Math.max(minHeightNeeded, desiredHeight);

    const rawChatHeight = Math.max(bubbleHeight - headerHeight, 0);

    const baseWidth = compact ? 360 : 384;
    let containerWidth = baseWidth;
    if (width > 0) {
      const availableWidth = width - horizontalInset * 2;
      if (availableWidth > 0) {
        containerWidth = availableWidth >= 260 ? Math.min(baseWidth, availableWidth) : availableWidth;
      } else {
        containerWidth = Math.min(baseWidth, width);
      }
    }

    if (!Number.isFinite(containerWidth) || containerWidth <= 0) {
      containerWidth = baseWidth;
    }

    return {
      bubbleHeight,
      chatHeight: rawChatHeight,
      chatWidth: containerWidth,
      bottomInset,
      rightInset: horizontalInset,
      topInset,
    } as const;
  }, [windowWidth, windowHeight, headerHeight]);


  const {
    conversations,
    activeConversation,
    activeConversationId,
    isHydrated,
    createNewConversation,
    addMessage,
    setActiveConversation,
    deleteConversation
  } = useChatManager();

  const trackerData = useTrackerContext();
  const { settings } = useAISettings();
  
  // Use ref to always get latest settings
  const settingsRef = React.useRef(settings);
  settingsRef.current = settings;
  
  const chatHeight = Math.max(dimensions.chatHeight, 0);
  const chatWidth = Number.isFinite(dimensions.chatWidth) && dimensions.chatWidth > 0
    ? dimensions.chatWidth
    : windowWidth < 640
      ? 320
      : 384;
  const bubbleHeight = Math.max(dimensions.bubbleHeight, headerHeight + chatHeight);
  const bubbleStyle: React.CSSProperties = {
    bottom: `calc(${dimensions.bottomInset}px + env(safe-area-inset-bottom, 0px))`,
    right: `calc(${dimensions.rightInset}px + env(safe-area-inset-right, 0px))`,
    height: bubbleHeight,
    maxHeight: `calc(100vh - ${dimensions.topInset + dimensions.bottomInset}px)`,
    width: chatWidth,
    maxWidth: `calc(100vw - ${dimensions.rightInset * 2}px)`,
  };

  // Debug: Log settings changes
  React.useEffect(() => {
    console.log('AIChatBubble: Settings updated:', settings);
  }, [settings]);

  // Create initial conversation if none exists (only after hydration)
  React.useEffect(() => {
    if (!isHydrated) return;
    if (conversations.length === 0) {
      createNewConversation(undefined, currentChallengeId);
    }
  }, [isHydrated, conversations.length, createNewConversation, currentChallengeId]);

  // Set (or restore) active conversation after hydration
  React.useEffect(() => {
    if (!isHydrated) return;
    if (!activeConversation && conversations.length > 0) {
      // Prefer stored id if available
      const toActivate = activeConversationId || conversations[0].id;
      setActiveConversation(toActivate);
    }
  }, [isHydrated, activeConversation, activeConversationId, conversations, setActiveConversation]);

  const addNewMessage = React.useCallback(async (event: {message: {text?: string}}) => {
    if (!activeConversation || isProcessing) return;

    // Add user message exactly like the working example
    const userMessage: Message = {
      ...event.message,
      text: (event.message as {text?: string}).text || ' ',
      id: generateMessageId(),
      author: user,
      timestamp: new Date()
    };

    addMessage(activeConversation.id, userMessage);

    // Check if API key is configured before processing
    if (!settingsRef.current.apiKey) {
      // Check if the last message is already the API key prompt to avoid duplicates
      const lastMessage = activeConversation.messages[activeConversation.messages.length - 1];
      const isLastMessageApiPrompt = lastMessage?.text?.includes('configure your OpenRouter API key');

      if (!isLastMessageApiPrompt) {
        const promptResponse: Message = {
          id: generateMessageId(),
          author: bot,
          timestamp: new Date(),
          text: 'To use AI features, please click the ⚙️ settings button and configure your OpenRouter API key. You can get a free API key at openrouter.ai/keys'
        };
        addMessage(activeConversation.id, promptResponse);
      }
      return;
    }

    setIsProcessing(true);

    try {
      // Debug context values
      console.log('DEBUG - challengeId prop:', challengeId);
      console.log('DEBUG - currentChallengeId (from URL):', currentChallengeId);
      console.log('DEBUG - activeConversation.contextChallengeId:', activeConversation.contextChallengeId);
      console.log('DEBUG - available challenges:', trackerData.state.challenges.map(c => ({ id: c.id, title: c.title })));

      // Determine context for the message
      const contextParam = { challengeId: currentChallengeId || activeConversation.contextChallengeId };
      console.log('DEBUG - context param being passed:', contextParam);

      const context = aiService.determineContext(
        userMessage.text || '',
        activeConversation.messages,
        trackerData.state.challenges,
        contextParam
      );

      console.log('Context determined:', context);

      // If clarification is needed, ask the user
      if (context.needsClarification) {
        const clarificationResponse: Message = {
          id: Date.now().toString(),
          author: bot,
          timestamp: new Date(),
          text: context.clarificationQuestion || 'Please clarify your request.'
        };
        addMessage(activeConversation.id, clarificationResponse);
        setIsProcessing(false);
        return;
      }

      // Process the message with AI (Step 1: Initial request with tools)
      // setStreamingText('');
      const currentStreamText = '';

      const rawModelId = settingsRef.current.selectedModel || '';
      const normalizedModelId = rawModelId.replace(/:online$/i, '');
      const effectiveSettings = {
        ...settingsRef.current,
        selectedModel: `${normalizedModelId}${searchEnabled ? ':online' : ''}`,
      };
      
      console.log('AIChatBubble: Using settings in addNewMessage:', {
        rawModelId,
        normalizedModelId,
        effectiveSettings,
        timestamp: new Date().toISOString()
      });

      const aiResponse = await aiService.processMessage(
        userMessage.text || '',
        activeConversation.messages,
        context.challengeId,
        { challengeId: currentChallengeId || activeConversation.contextChallengeId },
        effectiveSettings,
        // Disable streaming to test tool calling
        undefined
      );

      console.log('AI Response:', aiResponse);

      // Check if AI wants to call tools
      if (aiResponse.needsToolExecution && aiResponse.toolCalls) {
        console.log('AI requested tool calls:', aiResponse.toolCalls);

        // Step 2: Execute tools locally and collect results
        const toolResults: ChatCompletionToolMessageParam[] = [];
        const allFunctions: Array<{name: string, parameters: Record<string, unknown>, toolCallId: string}> = [];

        console.log(`Processing ${aiResponse.toolCalls.length} tool calls`);

        // First, collect and prepare all function calls
        for (const toolCall of aiResponse.toolCalls) {
          if (toolCall.type === 'function') {
            const functionName = toolCall.function.name;
            // Skip invalid/unknown tool calls (no name)
            if (!functionName || !functionName.trim()) {
              console.warn('Skipping tool call with empty function name. toolCall:', toolCall);
              continue;
            }
            console.log(`Raw function arguments JSON:`, toolCall.function.arguments);

            let functionArgs;
            try {
              functionArgs = JSON.parse(toolCall.function.arguments || '{}');
            } catch (error) {
              console.error(`JSON parsing error for ${functionName}:`, error);
              console.error(`Invalid JSON string:`, toolCall.function.arguments);

              toolResults.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: `Error parsing function arguments: ${error instanceof Error ? error.message : String(error)}`
              });
              continue;
            }

            console.log(`Executing tool: ${functionName} with args:`, functionArgs);

            // Fix challengeId - if AI provided a title instead of ID, find the real ID
            if (functionArgs.challengeId) {
              // Check if it looks like a title (has spaces) vs an ID (UUID-like)
              if (functionArgs.challengeId.includes(' ')) {
                const challengeByTitle = trackerData.state.challenges.find(c =>
                  c.title.toLowerCase().includes(functionArgs.challengeId.toLowerCase()) ||
                  functionArgs.challengeId.toLowerCase().includes(c.title.toLowerCase())
                );
                if (challengeByTitle) {
                  console.log(`Found challenge by title: "${functionArgs.challengeId}" -> ID: ${challengeByTitle.id}`);
                  functionArgs.challengeId = challengeByTitle.id;
                }
              }
            }

            // Add challengeId context if missing and we have one
            if (!functionArgs.challengeId && (context.challengeId || currentChallengeId)) {
              functionArgs.challengeId = context.challengeId || currentChallengeId;
              console.log(`Added challengeId context: ${functionArgs.challengeId}`);
            }

            console.log(`Prepared ${functionName} with final args:`, functionArgs);

            // Collect the function call for batch execution
            allFunctions.push({
              name: functionName,
              parameters: functionArgs as Record<string, unknown>,
              toolCallId: toolCall.id
            });
          }
        }

        // Now execute all functions in batch to avoid state race conditions
        console.log(`Executing ${allFunctions.length} functions in batch`);

        try {
          const results = await functionExecutor.executeFunctions(
            allFunctions.map(f => ({ name: f.name, parameters: f.parameters })),
            () => trackerData.state,
            (newState) => {
              console.log(`Updating state after batch execution:`, newState);
              trackerData.setState(newState);
            }
          );

          console.log(`Batch execution completed:`, results);

          // Create tool results for each function (ensure string content for provider bridges)
          allFunctions.forEach((func, index) => {
            const raw = results[index] ?? `Executed ${func.name}`;
            const content = typeof raw === 'string' ? raw : JSON.stringify(raw);
            toolResults.push({
              role: 'tool',
              tool_call_id: func.toolCallId,
              content
            });
          });

        } catch (error) {
          console.error('Batch execution error:', error);
          allFunctions.forEach(func => {
            const content = `Error executing ${func.name}: ${error instanceof Error ? error.message : String(error)}`;
            toolResults.push({
              role: 'tool',
              tool_call_id: func.toolCallId,
              content
            });
          });
        }

        console.log(`Completed ${toolResults.length} tool executions`);

        // Remove invalid tool results (missing tool_call_id) to satisfy providers expecting strict mapping
        const validToolResults = toolResults.filter(tr => {
          const id = (tr as { tool_call_id?: string }).tool_call_id;
          return typeof id === 'string' && id.trim().length > 0;
        });

        // Build the conversation for Step 3
        const conversationMessages: ChatCompletionMessageParam[] = [
          {
            role: 'system' as const,
            content: `You are an AI assistant for a dev challenge tracker. You can help users manage their challenges, tasks, ideas, and resources.

Format every reply as clean Markdown with headings and bullet lists. Keep sections short and readable.

Available functions (Make sure to send text in markdown format):
- createChallenge: Create a new challenge (only when user explicitly wants to create a NEW challenge. IMPORTANT: Format the description parameter as Markdown with main headings (##), bullet points, and proper formatting)
- addTask: Add a task to an EXISTING challenge (IMPORTANT: Format the notes parameter as Markdown with smaller subheadings (### and ####), bullet points, and proper formatting)
- addIdea: Add an idea to an EXISTING challenge (IMPORTANT: Format the notes parameter as Markdown with smaller subheadings (### and ####), bullet points, and proper formatting)
- addResource: Add a resource to an EXISTING challenge (IMPORTANT: Format the notes parameter as Markdown with smaller subheadings (### and ####), bullet points, and proper formatting)
- getChallengeList: Get list of challenges
- getChallengeDetails: Get details of a specific challenge

Current context: ${context.challengeId ? `Working on challenge ${context.challengeId}. When creating tasks, ideas, or resources, use this challengeId unless the user specifies a different challenge.` : 'No specific challenge context'}

Current challenges: ${trackerData.state.challenges.map(c => `- ${c.title} (ID: ${c.id})`).join('\n')}

IMPORTANT:
- When users ask for "ideas for [challenge name]" or similar, use addIdea to add to the EXISTING challenge, do NOT create a new challenge
- When adding tasks, ideas, or resources, always include the challengeId parameter
- Only use createChallenge when the user explicitly wants to create a brand new challenge

Be helpful, concise, and proactive in suggesting actions.`
          },
          // Add conversation history
          ...activeConversation.messages.slice(-8).map((msg): {role: 'user' | 'assistant', content: string} => ({
            role: (msg.author.id === 1 ? 'user' : 'assistant') as 'user' | 'assistant',
            content: msg.text || ''
          })),
          // Add current user message
          {
            role: 'user' as const,
            content: userMessage.text || ''
          },
          // Add assistant response with tool calls
          {
            role: 'assistant' as const,
            content: aiResponse.response,
            tool_calls: aiResponse.toolCalls
          },
          // Add tool results (validated)
          ...validToolResults
        ];

        console.log('Step 3: Sending conversation with tool results:', conversationMessages);

        // Step 3: Continue conversation with tool results
        const finalResponse = await aiService.continueWithToolResults(
          conversationMessages,
          effectiveSettings,
          // Disable streaming to test tool calling
          undefined
        );

        const botResponse: Message = {
          id: generateMessageId(),
          author: bot,
          timestamp: new Date(),
          text: currentStreamText || finalResponse.response
        };

        addMessage(activeConversation.id, botResponse);
        // setStreamingText('');
      } else {
        // No tools needed, just send the regular response
        const botResponse: Message = {
          id: generateMessageId(),
          author: bot,
          timestamp: new Date(),
          text: currentStreamText || aiResponse.response
        };

        addMessage(activeConversation.id, botResponse);
        // setStreamingText('');
      }

    } catch (error) {
      console.error('Error processing AI message:', error);
      const errorResponse: Message = {
        id: generateMessageId(),
        author: bot,
        timestamp: new Date(),
        text: 'Sorry, I encountered an error processing your request. Please try again.'
      };
      addMessage(activeConversation.id, errorResponse);
    } finally {
      setIsProcessing(false);
    }
  }, [
    activeConversation,
    addMessage,
    challengeId,
    currentChallengeId,
    isProcessing,
    searchEnabled,
    trackerData,
  ]);

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 z-50 ${
          isOpen ? 'rotate-45' : ''
        }`}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col"
          style={bubbleStyle}
        >
          {/* Chat Header with Chat Management */}
          <div
            ref={headerRef}
            className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between flex-shrink-0"
          >
            <div className="flex items-center space-x-2">
              <select
                value={activeConversation?.id || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setActiveConversation(e.target.value);
                  }
                }}
                className="bg-blue-500 text-white text-sm border border-blue-400 rounded px-2 py-1"
              >
                {conversations.map((conv) => (
                  <option key={conv.id} value={conv.id} className="bg-white text-black">
                    {conv.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => createNewConversation()}
                className="bg-blue-500 hover:bg-blue-400 px-2 py-1 rounded text-xs"
                title="New Chat"
              >
                +
              </button>
              {conversations.length > 1 && activeConversation && (
                <button
                  onClick={() => {
                    if (confirm(`Delete "${activeConversation.title}"?`)) {
                      deleteConversation(activeConversation.id);
                    }
                  }}
                  className="bg-red-500 hover:bg-red-400 px-2 py-1 rounded text-xs"
                  title="Delete Chat"
                >
                  ×
                </button>
              )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-blue-500 hover:bg-blue-400 px-2 py-1 rounded text-xs"
              title="AI Settings"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={() => setSearchEnabled((prev) => !prev)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                searchEnabled
                  ? 'bg-amber-400 hover:bg-amber-300 text-black'
                  : 'bg-blue-500 hover:bg-blue-400 text-white'
              }`}
              title="Toggle web search"
            >
              {searchEnabled ? 'Web search on' : 'Web search off'}
            </button>
          </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Kendo Chat Component */}
          <div className="flex-1">
            {activeConversation ? (
              <Chat
                key={`chat-${activeConversation.id}`}
                messages={(function() {
                  const base = activeConversation.messages.map((msg, index) => ({
                    ...msg,
                    id: msg.id || `fallback-${index}-${Date.now()}`
                  }));
                  if (isProcessing) {
                    base.push({
                      id: `processing-${activeConversation.id}`,
                      author: bot,
                      timestamp: new Date(),
                      text: 'AI is processing...',
                      // custom marker consumed by ChatMessageTemplate
                      processing: true
                    } as unknown as Message);
                  }
                  return base;
                })()}
                
                authorId={user.id}
                onSendMessage={addNewMessage}
                placeholder={isProcessing ? "AI is thinking..." : "Type your message here..."}
                height={chatHeight}
                width={chatWidth}
                className="k-m-auto"
                uploadConfig={{ disabled: true }}
                messageTemplate={ChatMessageTemplate}
              />
              
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: `${chatHeight}px`
              }}>
                <div style={{ textAlign: 'center' }}>
                  <p>No active conversation</p>
                  <Button
                    onClick={() => createNewConversation()}
                  >
                    Start New Chat
                  </Button>
                </div>
              </div>
            )}

            {/* Processing indicator now rendered inline as a message via messageTemplate */}
          </div>
        </div>
      )}

      {/* AI Settings Dialog */}
      <AISettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
