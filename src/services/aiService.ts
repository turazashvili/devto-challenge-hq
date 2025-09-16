import OpenAI from 'openai';
import { Message } from '@progress/kendo-react-conversational-ui';
import { AISettings } from '../types/ai';

export class AIService {
  private static instance: AIService;
  private openai: OpenAI | null = null;

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private initializeOpenAI(settings: AISettings): OpenAI {
    if (!settings.apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    // Always create a new instance to ensure fresh settings
    this.openai = new OpenAI({
      baseURL: settings.baseUrl,
      apiKey: settings.apiKey,
      defaultHeaders: {
        'HTTP-Referer': settings.siteUrl || '',
        'X-Title': settings.siteName || 'Dev Challenge Tracker',
      },
      dangerouslyAllowBrowser: true, // Required for client-side usage
    });

    return this.openai;
  }

  async processMessage(
    message: string,
    conversationHistory: Message[],
    contextChallengeId?: string,
    currentPageContext?: Record<string, unknown>,
    settings?: AISettings,
    onStream?: (chunk: string) => void
  ): Promise<{
    response: string;
    toolCalls?: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[];
    needsToolExecution?: boolean;
  }> {
    if (!settings?.apiKey) {
      return {
        response: 'Please configure your OpenRouter API key in settings to use AI features.',
      };
    }

    try {
      const openai = this.initializeOpenAI(settings);

      // Convert conversation history to OpenAI format
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `You are an AI assistant for a dev challenge tracker. You can help users manage their challenges, tasks, ideas, and resources.
Format every reply as clean Markdown with headings and bullet lists. Keep sections short and readable.

Available functions (Make sure to send text in markdown format):
- createChallenge: Create a new challenge (make sure the description will include all details about this challenge provided either by user or by you scraping the link they sent. focus on the challenge when putting description. no other info)
- addTask: Add a task to a challenge
- addIdea: Add an idea to a challenge
- addResource: Add a resource to a challenge
- getChallengeList: Get list of challenges
- getChallengeDetails: Get details of a specific challenge

Current context: ${contextChallengeId ? `Working on challenge ${contextChallengeId}` : 'No specific challenge context'}

IMPORTANT: When adding tasks, ideas, or resources to a specific challenge:
${contextChallengeId ?
`- Always include challengeId: "${contextChallengeId}" in your function calls for addTask, addIdea, and addResource
- You are currently working on challenge ${contextChallengeId}, so unless the user explicitly mentions a different challenge, add items to this challenge` :
`- If the user is working on a specific challenge, make sure to include the challengeId parameter
- If no specific challenge is mentioned, you may need to ask for clarification or create a new challenge first`}

Be helpful, concise, and proactive in suggesting actions.`
        },
        // Add recent conversation history
        ...conversationHistory.slice(-8).map((msg): OpenAI.Chat.Completions.ChatCompletionMessageParam => ({
          role: msg.author.id === 1 ? 'user' : 'assistant',
          content: msg.text || ''
        })),
        // Add current message
        {
          role: 'user',
          content: message
        }
      ];

      // Define available tools (modern OpenAI format)
      const tools = this.getToolsDefinition();

      if (onStream) {
        // Streaming response
        let fullResponse = '';
        console.log('DEBUG - selectedModel type:', typeof settings.selectedModel);
        console.log('DEBUG - selectedModel value:', settings.selectedModel);
        const modelId = typeof settings.selectedModel === 'string' ? settings.selectedModel : (settings.selectedModel as {id: string})?.id || settings.selectedModel;
        console.log('DEBUG - using modelId:', modelId);
        const stream = await openai.chat.completions.create({
          model: modelId,
          messages,
          tools,
          tool_choice: 'auto',
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            onStream(content);
          }

          // Handle tool calls
          const toolCalls = chunk.choices[0]?.delta?.tool_calls;
          if (toolCalls) {
            // Tool calling detected - handle separately
            break;
          }
        }

        return { response: fullResponse };
      } else {
        // Non-streaming response
        console.log('DEBUG - selectedModel type:', typeof settings.selectedModel);
        console.log('DEBUG - selectedModel value:', settings.selectedModel);
        const modelId = typeof settings.selectedModel === 'string' ? settings.selectedModel : (settings.selectedModel as {id: string})?.id || settings.selectedModel;
        console.log('DEBUG - using modelId:', modelId);
        const completion = await openai.chat.completions.create({
          model: modelId,
          messages,
          tools,
          tool_choice: 'auto',
        });

        const choice = completion.choices[0];
        // const functionCalls: AIFunction[] = [];

        console.log('DEBUG - Model response:', choice.message);
        console.log('DEBUG - Tool calls found:', !!choice.message.tool_calls);

        // Check if model wants to call tools
        if (choice.message.tool_calls) {
          console.log('DEBUG - Tool calls:', choice.message.tool_calls);
          return {
            response: choice.message.content || '',
            toolCalls: choice.message.tool_calls,
            needsToolExecution: true
          };
        }

        return {
          response: choice.message.content || 'I processed your request.'
        };
      }
    } catch (error) {
      console.error('AI Service error:', error);
      return {
        response: 'Sorry, I encountered an error processing your request. Please check your API key and try again.',
      };
    }
  }

  async continueWithToolResults(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    settings: AISettings,
    onStream?: (chunk: string) => void
  ): Promise<{
    response: string;
  }> {
    try {
      const openai = this.initializeOpenAI(settings);

      // Define tools again (required by OpenRouter)
      const tools = this.getToolsDefinition();

      const modelId = typeof settings.selectedModel === 'string' ? settings.selectedModel : (settings.selectedModel as {id: string})?.id || settings.selectedModel;

      if (onStream) {
        let fullResponse = '';
        const stream = await openai.chat.completions.create({
          model: modelId,
          messages,
          tools,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            fullResponse += content;
            onStream(content);
          }
        }

        return { response: fullResponse };
      } else {
        const completion = await openai.chat.completions.create({
          model: modelId,
          messages,
          tools,
        });

        return {
          response: completion.choices[0].message.content || 'I processed your request.'
        };
      }
    } catch (error) {
      console.error('AI Service error:', error);
      return {
        response: 'Sorry, I encountered an error processing your request. Please check your API key and try again.',
      };
    }
  }

  private getToolsDefinition() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'createChallenge',
          description: 'Create a new challenge',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Challenge title' },
              theme: { type: 'string', description: 'Challenge theme' },
              description: { type: 'string', description: 'Challenge description' },
              deadline: { type: 'string', description: 'Challenge deadline (optional)' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Challenge tags' }
            },
            required: ['title', 'theme', 'description']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'addTask',
          description: 'Add a task to a challenge',
          parameters: {
            type: 'object',
            properties: {
              challengeId: { type: 'string', description: 'Challenge ID (optional if context is clear)' },
              title: { type: 'string', description: 'Task title' },
              dueDate: { type: 'string', description: 'Due date (optional)' },
              notes: { type: 'string', description: 'Task notes (optional)' }
            },
            required: ['title']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'addIdea',
          description: 'Add an idea to a challenge',
          parameters: {
            type: 'object',
            properties: {
              challengeId: { type: 'string', description: 'Challenge ID (optional if context is clear)' },
              title: { type: 'string', description: 'Idea title' },
              impact: { type: 'string', enum: ['Quick Win', 'High Impact', 'Foundational'], description: 'Impact level' },
              notes: { type: 'string', description: 'Idea notes' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Idea tags' }
            },
            required: ['title', 'impact', 'notes']
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'addResource',
          description: 'Add a resource to a challenge',
          parameters: {
            type: 'object',
            properties: {
              challengeId: { type: 'string', description: 'Challenge ID (optional if context is clear)' },
              title: { type: 'string', description: 'Resource title' },
              url: { type: 'string', description: 'Resource URL' },
              type: { type: 'string', enum: ['Article', 'Video', 'Tool', 'Snippet', 'Thread'], description: 'Resource type' },
              notes: { type: 'string', description: 'Resource notes (optional)' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Resource tags' }
            },
            required: ['title', 'url', 'type']
          }
        }
      }
    ];
  }

  // Context determination logic
  determineContext(
    message: string,
    conversationHistory: Message[],
    availableChallenges: Array<{id: string, title: string, status: string}>,
    currentPageContext?: Record<string, unknown>
  ): {
    challengeId?: string;
    needsClarification: boolean;
    clarificationQuestion?: string;
  } {
    const messageText = message.toLowerCase();

    // Check if user is on a specific challenge page
    if (currentPageContext?.challengeId) {
      return { challengeId: String(currentPageContext.challengeId), needsClarification: false };
    }

    // Look for explicit challenge references in the message
    // const challengeKeywords = ['challenge', 'project'];
    // const hasExplicitReference = challengeKeywords.some(keyword =>
    //   messageText.includes(keyword)
    // );

    // Check conversation history for recent challenge mentions
    const recentChallengeContext = this.findRecentChallengeContext(conversationHistory);
    if (recentChallengeContext) {
      return { challengeId: recentChallengeContext, needsClarification: false };
    }

    // If only one active challenge exists, use it
    const activeChallenges = availableChallenges.filter(c =>
      c.status !== 'Published' && c.status !== 'Submitted'
    );

    console.log('DEBUG - Active challenges:', activeChallenges);
    console.log('DEBUG - Message requires context:', this.requiresChallengeContext(messageText));

    if (activeChallenges.length === 1 && this.requiresChallengeContext(messageText)) {
      console.log('DEBUG - Using single active challenge:', activeChallenges[0].id);
      return { challengeId: activeChallenges[0].id, needsClarification: false };
    }

    // Also use single challenge for general requests about existing challenges
    if (activeChallenges.length === 1) {
      // Check if the message mentions an existing challenge name
      const mentionsChallenge = activeChallenges.some(challenge =>
        messageText.includes(challenge.title.toLowerCase()) ||
        challenge.title.toLowerCase().includes(messageText.replace(/[^\w\s]/g, '').toLowerCase())
      );
      if (mentionsChallenge) {
        console.log('DEBUG - Message mentions existing challenge, using:', activeChallenges[0].id);
        return { challengeId: activeChallenges[0].id, needsClarification: false };
      }
    }

    // If multiple challenges and ambiguous intent, ask for clarification
    if (activeChallenges.length > 1 && this.requiresChallengeContext(messageText)) {
      return {
        needsClarification: true,
        clarificationQuestion: `Which challenge should I help you with?\n${activeChallenges
          .map((c, i) => `${i + 1}. ${c.title} (${c.status})`)
          .join('\n')}`
      };
    }

    return { needsClarification: false };
  }

  private requiresChallengeContext(message: string): boolean {
    const contextRequiredActions = [
      'add task', 'create task', 'new task',
      'add idea', 'create idea', 'new idea', 'ideas for',
      'add resource', 'create resource', 'new resource',
      'update challenge', 'modify challenge'
    ];

    return contextRequiredActions.some(action => message.includes(action));
  }

  private findRecentChallengeContext(conversationHistory: Message[]): string | null {
    // Look through recent messages for challenge ID references
    const recentMessages = conversationHistory.slice(-5);
    for (const msg of recentMessages.reverse()) {
      // This is a simplified implementation
      // In practice, you'd parse the message content for challenge references
      if (msg.text && msg.text.includes('challenge')) {
        // Extract challenge ID if mentioned
        // This is a placeholder - implement actual parsing logic
      }
    }
    return null;
  }
}

export const aiService = AIService.getInstance();
