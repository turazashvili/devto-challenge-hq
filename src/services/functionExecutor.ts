import { v4 as uuidv4 } from 'uuid';
import { Challenge, Task, Idea, Resource, TrackerState } from '../types/tracker';
import { AIFunction } from '../types/chat';

export class FunctionExecutor {
  private static instance: FunctionExecutor;

  static getInstance(): FunctionExecutor {
    if (!FunctionExecutor.instance) {
      FunctionExecutor.instance = new FunctionExecutor();
    }
    return FunctionExecutor.instance;
  }

  async executeFunctions(
    functions: AIFunction[],
    getCurrentState: () => TrackerState,
    updateState: (newState: TrackerState) => void
  ): Promise<string[]> {
    const results: string[] = [];
    let currentState = getCurrentState();

    for (const func of functions) {
      try {
        const result = await this.executeFunction(
          func,
          () => currentState,
          (newState) => {
            currentState = newState;
            updateState(newState);
          }
        );
        results.push(result);
      } catch (error) {
        console.error(`Error executing function ${func.name}:`, error);
        results.push(`Failed to execute ${func.name}: ${error}`);
      }
    }

    return results;
  }

  private async executeFunction(
    func: AIFunction,
    getCurrentState: () => TrackerState,
    updateState: (newState: TrackerState) => void
  ): Promise<string> {
    const currentState = getCurrentState();

    switch (func.name) {
      case 'createChallenge':
        return this.createChallenge(func.parameters, currentState, updateState);

      case 'addTask':
        return this.addTask(func.parameters, currentState, updateState);

      case 'addIdea':
        return this.addIdea(func.parameters, currentState, updateState);

      case 'addResource':
        return this.addResource(func.parameters, currentState, updateState);

      case 'getChallengeList':
        return this.getChallengeList(currentState);

      case 'getChallengeDetails':
        return this.getChallengeDetails(func.parameters, currentState);

      default:
        throw new Error(`Unknown function: ${func.name}`);
    }
  }

  private createChallenge(
    params: Record<string, unknown>,
    currentState: TrackerState,
    updateState: (newState: TrackerState) => void
  ): string {
    const newChallenge: Challenge = {
      id: uuidv4(),
      title: params.title as string,
      theme: params.theme as string,
      description: params.description as string,
      status: 'Ideation',
      progress: 0,
      deadline: params.deadline as string | undefined,
      tags: (params.tags as string[]) || []
    };

    const newState = {
      ...currentState,
      challenges: [...currentState.challenges, newChallenge]
    };

    updateState(newState);
    return `Created new challenge: "${newChallenge.title}" with theme "${newChallenge.theme}".`;
  }

  private addTask(
    params: Record<string, unknown>,
    currentState: TrackerState,
    updateState: (newState: TrackerState) => void
  ): string {
    const newTask: Task = {
      id: uuidv4(),
      challengeId: params.challengeId as string | undefined,
      title: params.title as string,
      status: 'Not Started',
      dueDate: params.dueDate as string | undefined,
      notes: params.notes as string | undefined
    };

    const newState = {
      ...currentState,
      tasks: [...currentState.tasks, newTask]
    };

    updateState(newState);

    const challengeContext = params.challengeId
      ? ` to challenge "${currentState.challenges.find(c => c.id === params.challengeId)?.title}"`
      : '';

    return `Added task: "${newTask.title}"${challengeContext}.`;
  }

  private addIdea(
    params: Record<string, unknown>,
    currentState: TrackerState,
    updateState: (newState: TrackerState) => void
  ): string {
    const newIdea: Idea = {
      id: uuidv4(),
      challengeId: params.challengeId as string | undefined,
      title: params.title as string,
      impact: params.impact as 'Quick Win' | 'High Impact' | 'Foundational',
      notes: params.notes as string,
      tags: (params.tags as string[]) || []
    };

    const newState = {
      ...currentState,
      ideas: [...currentState.ideas, newIdea]
    };

    updateState(newState);

    const challengeContext = params.challengeId
      ? ` to challenge "${currentState.challenges.find(c => c.id === params.challengeId)?.title}"`
      : '';

    return `Added idea: "${newIdea.title}" (${newIdea.impact})${challengeContext}.`;
  }

  private addResource(
    params: Record<string, unknown>,
    currentState: TrackerState,
    updateState: (newState: TrackerState) => void
  ): string {
    const newResource: Resource = {
      id: uuidv4(),
      challengeId: params.challengeId as string | undefined,
      title: params.title as string,
      url: params.url as string,
      type: params.type as 'Article' | 'Video' | 'Tool' | 'Snippet' | 'Thread',
      notes: params.notes as string | undefined,
      tags: (params.tags as string[]) || []
    };

    const newState = {
      ...currentState,
      resources: [...currentState.resources, newResource]
    };

    updateState(newState);

    const challengeContext = params.challengeId
      ? ` to challenge "${currentState.challenges.find(c => c.id === params.challengeId)?.title}"`
      : '';

    return `Added resource: "${newResource.title}" (${newResource.type})${challengeContext}.`;
  }

  private getChallengeList(currentState: TrackerState): string {
    if (currentState.challenges.length === 0) {
      return 'No challenges found. Would you like to create one?';
    }

    const challengeList = currentState.challenges
      .map(c => `- ${c.title} (${c.status}) - ${c.progress}% complete`)
      .join('\n');

    return `Here are your challenges:\n${challengeList}`;
  }

  private getChallengeDetails(params: Record<string, unknown>, currentState: TrackerState): string {
    const challengeId = params.challengeId as string;
    const challenge = currentState.challenges.find(c => c.id === challengeId);

    if (!challenge) {
      return `Challenge with ID "${challengeId}" not found.`;
    }

    const tasks = currentState.tasks.filter(t => t.challengeId === challengeId);
    const ideas = currentState.ideas.filter(i => i.challengeId === challengeId);
    const resources = currentState.resources.filter(r => r.challengeId === challengeId);

    return `Challenge: "${challenge.title}"
Status: ${challenge.status} (${challenge.progress}% complete)
Theme: ${challenge.theme}
Description: ${challenge.description}
Tags: ${challenge.tags.join(', ')}
Tasks: ${tasks.length}
Ideas: ${ideas.length}
Resources: ${resources.length}`;
  }
}

export const functionExecutor = FunctionExecutor.getInstance();