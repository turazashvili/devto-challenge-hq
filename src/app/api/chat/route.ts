import { NextRequest, NextResponse } from 'next/server';

// AI Function definitions that match our tracker operations
const AI_FUNCTIONS = [
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
    name: 'getChallengeList',
    description: 'Get list of all challenges',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'getChallengeDetails',
    description: 'Get detailed information about a specific challenge',
    parameters: {
      type: 'object',
      properties: {
        challengeId: { type: 'string', description: 'Challenge ID' }
      },
      required: ['challengeId']
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    const { message, contextChallengeId } = await request.json();

    // For now, return a mock response since we don't have OpenAI API key
    // In production, this would call OpenAI API with function calling

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response that demonstrates function calling
    const response: {role: string, content: string, function_call?: {name: string, arguments: string}} = {
      role: 'assistant',
      content: ''
    };

    // Simple pattern matching for demo purposes
    const messageText = message.toLowerCase();

    if (messageText.includes('create challenge') || messageText.includes('new challenge')) {
      response.function_call = {
        name: 'createChallenge',
        arguments: JSON.stringify({
          title: 'New AI Challenge',
          theme: 'AI Integration',
          description: 'Implementing AI features for the tracker',
          tags: ['ai', 'integration']
        })
      };
      response.content = 'I\'ll create a new challenge for you with AI integration theme.';
    } else if (messageText.includes('add task')) {
      response.function_call = {
        name: 'addTask',
        arguments: JSON.stringify({
          challengeId: contextChallengeId,
          title: 'Complete AI integration',
          notes: 'Implement OpenAI API integration with function calling'
        })
      };
      response.content = 'I\'ll add that task to your challenge.';
    } else if (messageText.includes('add idea')) {
      response.function_call = {
        name: 'addIdea',
        arguments: JSON.stringify({
          challengeId: contextChallengeId,
          title: 'AI-powered suggestions',
          impact: 'High Impact',
          notes: 'Implement AI that can suggest improvements and optimizations',
          tags: ['ai', 'suggestions']
        })
      };
      response.content = 'Great idea! I\'ll add that to your ideas list.';
    } else if (messageText.includes('add resource')) {
      response.function_call = {
        name: 'addResource',
        arguments: JSON.stringify({
          challengeId: contextChallengeId,
          title: 'OpenAI API Documentation',
          url: 'https://platform.openai.com/docs',
          type: 'Article',
          notes: 'Official documentation for OpenAI API integration',
          tags: ['documentation', 'api']
        })
      };
      response.content = 'I\'ll add that resource to your collection.';
    } else {
      response.content = `I understand you said: "${message}". I can help you with:
- Creating new challenges
- Adding tasks to challenges
- Adding ideas to challenges
- Adding resources to challenges
- Getting challenge information

Try saying something like "create a new challenge" or "add a task" to see the function calling in action!`;
    }

    return NextResponse.json({
      response,
      functions: AI_FUNCTIONS
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}