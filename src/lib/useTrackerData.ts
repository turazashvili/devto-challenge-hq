"use client";

import { useEffect, useMemo, useState } from "react";

import { defaultState } from "@/data/defaultState";
import type {
  ChallengeStatus,
  CreateChallengeInput,
  CreateIdeaInput,
  CreateResourceInput,
  CreateTaskInput,
  Task,
  TrackerState,
} from "@/types/tracker";

const STORAGE_KEY = "dev-challenge-tracker-state";

const sortByDate = <T extends { dueDate?: string; deadline?: string }>(
  items: T[],
) => {
  return [...items].sort((a, b) => {
    const dateA = "dueDate" in a ? a.dueDate : "deadline" in a ? a.deadline : undefined;
    const dateB = "dueDate" in b ? b.dueDate : "deadline" in b ? b.deadline : undefined;

    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });
};

export const statusProgress: Record<ChallengeStatus, number> = {
  Ideation: 10,
  Drafting: 35,
  "In Review": 60,
  Submitted: 80,
  Published: 100,
};

export function useTrackerData() {
  const [state, setState] = useState<TrackerState>(defaultState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TrackerState;
        setState({
          ...parsed,
          challenges: parsed.challenges.map((challenge) => ({
            ...challenge,
            progress: challenge.progress ?? statusProgress[challenge.status],
          })),
        });
      }
      setIsReady(true);
    } catch (error) {
      console.error("Failed to load tracker state", error);
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isReady]);

  const addChallenge = (payload: CreateChallengeInput) => {
    setState((prev) => ({
      ...prev,
      challenges: [
        {
          id: crypto.randomUUID(),
          progress: statusProgress[payload.status] ?? 0,
          ...payload,
        },
        ...prev.challenges,
      ],
    }));
  };

  const updateChallengeStatus = (id: string, status: ChallengeStatus) => {
    setState((prev) => ({
      ...prev,
      challenges: prev.challenges.map((challenge) =>
        challenge.id === id
          ? {
              ...challenge,
              status,
              progress: statusProgress[status],
            }
          : challenge,
      ),
    }));
  };

  const updateChallenge = (
    id: string,
    updates: Partial<Omit<TrackerState["challenges"][number], "id">>,
  ) => {
    setState((prev) => ({
      ...prev,
      challenges: prev.challenges.map((challenge) => {
        if (challenge.id !== id) return challenge;

        const nextStatus = updates.status ?? challenge.status;

        return {
          ...challenge,
          ...updates,
          status: nextStatus,
          progress:
            updates.status !== undefined
              ? statusProgress[nextStatus]
              : updates.progress ?? challenge.progress,
        };
      }),
    }));
  };

  const addTask = (payload: CreateTaskInput) => {
    setState((prev) => ({
      ...prev,
      tasks: [
        {
          id: crypto.randomUUID(),
          ...payload,
        },
        ...prev.tasks,
      ],
    }));
  };

  const updateTaskStatus = (id: string, status: Task["status"]) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status,
            }
          : task,
      ),
    }));
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, "id">>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...updates,
            }
          : task,
      ),
    }));
  };

  const removeTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== id),
    }));
  };

  const addIdea = (payload: CreateIdeaInput) => {
    setState((prev) => ({
      ...prev,
      ideas: [
        {
          id: crypto.randomUUID(),
          ...payload,
        },
        ...prev.ideas,
      ],
    }));
  };

  const updateIdea = (id: string, updates: Partial<Omit<TrackerState["ideas"][number], "id">>) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.map((idea) =>
        idea.id === id
          ? {
              ...idea,
              ...updates,
            }
          : idea,
      ),
    }));
  };

  const removeIdea = (id: string) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.filter((idea) => idea.id !== id),
    }));
  };

  const addResource = (payload: CreateResourceInput) => {
    setState((prev) => ({
      ...prev,
      resources: [
        {
          id: crypto.randomUUID(),
          ...payload,
        },
        ...prev.resources,
      ],
    }));
  };

  const updateResource = (
    id: string,
    updates: Partial<Omit<TrackerState["resources"][number], "id">>,
  ) => {
    setState((prev) => ({
      ...prev,
      resources: prev.resources.map((resource) =>
        resource.id === id
          ? {
              ...resource,
              ...updates,
            }
          : resource,
      ),
    }));
  };

  const removeResource = (id: string) => {
    setState((prev) => ({
      ...prev,
      resources: prev.resources.filter((resource) => resource.id !== id),
    }));
  };

  const removeChallenge = (id: string) => {
    setState((prev) => ({
      challenges: prev.challenges.filter((challenge) => challenge.id !== id),
      tasks: prev.tasks.filter((task) => task.challengeId !== id),
      ideas: prev.ideas.filter((idea) => idea.challengeId !== id),
      resources: prev.resources.filter((resource) => resource.challengeId !== id),
    }));
  };

  const derived = useMemo(() => {
    const upcomingChallenges = sortByDate(state.challenges.filter(Boolean));
    const upcomingTasks = sortByDate(state.tasks.filter(Boolean));

    const completion =
      state.challenges.length === 0
        ? 0
        : Math.round(
            state.challenges.reduce((acc, challenge) => acc + challenge.progress, 0) /
              state.challenges.length,
          );

    return {
      upcomingChallenges,
      upcomingTasks,
      completion,
    };
  }, [state]);

  return {
    state,
    setState,
    addChallenge,
    updateChallengeStatus,
    updateChallenge,
    addTask,
    updateTaskStatus,
    updateTask,
    removeTask,
    addIdea,
    updateIdea,
    removeIdea,
    addResource,
    updateResource,
    removeResource,
    removeChallenge,
    derived,
    isReady,
  };
}
