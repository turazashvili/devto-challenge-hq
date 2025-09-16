export type ChallengeStatus =
  | "Ideation"
  | "Drafting"
  | "In Review"
  | "Submitted"
  | "Published";

export interface Challenge {
  id: string;
  title: string;
  theme: string;
  status: ChallengeStatus;
  deadline?: string;
  progress: number;
  description: string;
  tags: string[];
}

export interface Task {
  id: string;
  challengeId?: string;
  title: string;
  status: "Not Started" | "In Progress" | "Blocked" | "Done";
  dueDate?: string;
  notes?: string;
}

export interface Idea {
  id: string;
  challengeId?: string;
  title: string;
  impact: "Quick Win" | "High Impact" | "Foundational";
  notes: string;
  tags: string[];
}

export interface Resource {
  id: string;
  challengeId?: string;
  title: string;
  url: string;
  type: "Article" | "Video" | "Tool" | "Snippet" | "Thread";
  notes?: string;
  tags: string[];
}

export interface TrackerState {
  challenges: Challenge[];
  tasks: Task[];
  ideas: Idea[];
  resources: Resource[];
}

export type CreateChallengeInput = Omit<Challenge, "id" | "progress">;

export type CreateTaskInput = Omit<Task, "id">;

export type CreateIdeaInput = Omit<Idea, "id">;

export type CreateResourceInput = Omit<Resource, "id">;
