"use client";

import {
  AppBar,
  AppBarSection,
  AppBarSpacer,
} from "@progress/kendo-react-layout";
import { Button, ButtonGroup } from "@progress/kendo-react-buttons";
import { DropDownList } from "@progress/kendo-react-dropdowns";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { Input, TextArea } from "@progress/kendo-react-inputs";
import { Label } from "@progress/kendo-react-labels";
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import type { GridCustomCellProps } from "@progress/kendo-react-grid";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { MultiSelect } from "@progress/kendo-react-dropdowns";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { tagSuggestions } from "@/data/tagSuggestions";
import { useTrackerContext } from "@/context/TrackerContext";
import type {
  Challenge,
  ChallengeStatus,
  CreateChallengeInput,
  CreateIdeaInput,
  CreateResourceInput,
  CreateTaskInput,
  Idea,
  Resource,
  Task,
} from "@/types/tracker";

const challengeStatuses: ChallengeStatus[] = [
  "Ideation",
  "Drafting",
  "In Review",
  "Submitted",
  "Published",
];

const taskStatuses: Task["status"][] = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Done",
];

const taskProgressByStatus: Record<Task["status"], number> = {
  "Not Started": 10,
  "In Progress": 60,
  Blocked: 30,
  Done: 100,
};

const ideaImpactOptions: Idea["impact"][] = [
  "Quick Win",
  "High Impact",
  "Foundational",
];

const resourceTypeOptions: Resource["type"][] = [
  "Article",
  "Video",
  "Tool",
  "Snippet",
  "Thread",
];


const isChallengeRow = (value: unknown): value is Challenge =>
  typeof value === 'object' && value !== null && 'progress' in value && 'theme' in value;

const isResourceRow = (value: unknown): value is Resource =>
  typeof value === 'object' && value !== null && 'type' in value && 'url' in value;

const isTaskRow = (value: unknown): value is Task =>
  typeof value === 'object' && value !== null && 'challengeId' in value && 'status' in value;

const isIdeaRow = (value: unknown): value is Idea =>
  typeof value === 'object' && value !== null && 'impact' in value && 'tags' in value;

type DialogType = "challenge" | "task" | "idea" | "resource" | null;

interface ChallengeFormState {
  title: string;
  theme: string;
  status: ChallengeStatus;
  deadline: Date | null;
  tags: string[];
  description: string;
}

interface TaskFormState {
  challengeId?: string;
  title: string;
  status: Task["status"];
  dueDate: Date | null;
  notes: string;
}

interface IdeaFormState {
  challengeId?: string;
  title: string;
  impact: Idea["impact"];
  notes: string;
  tags: string[];
}

interface ResourceFormState {
  challengeId?: string;
  title: string;
  url: string;
  type: Resource["type"];
  notes: string;
  tags: string[];
}

const emptyChallenge: ChallengeFormState = {
  title: "",
  theme: "",
  status: "Ideation",
  deadline: null,
  tags: [],
  description: "",
};

const emptyTask: TaskFormState = {
  challengeId: undefined,
  title: "",
  status: "Not Started",
  dueDate: null,
  notes: "",
};

const emptyIdea: IdeaFormState = {
  challengeId: undefined,
  title: "",
  impact: "Quick Win",
  notes: "",
  tags: [],
};

const emptyResource: ResourceFormState = {
  challengeId: undefined,
  title: "",
  url: "",
  type: "Article",
  notes: "",
  tags: [],
};

const pageSections = ["Overview", "Challenges", "Ideas", "Resources", "Tasks"] as const;
type Section = (typeof pageSections)[number];

const panelClass =
  "rounded-3xl border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(17,17,17,0.05)]";

export default function Home() {
  const router = useRouter();
  const params = useParams<{ section?: string[] }>();

  const {
    state,
    derived,
    addChallenge,
    updateChallengeStatus,
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
    isReady,
  } = useTrackerContext();

  // Determine current section from URL
  const currentSection = useMemo(() => {
    const sectionParam = params?.section?.[0];
    if (!sectionParam) return "Overview";

    const sectionMap: Record<string, Section> = {
      "challenges": "Challenges",
      "ideas": "Ideas",
      "resources": "Resources",
      "tasks": "Tasks"
    };

    return sectionMap[sectionParam] || "Overview";
  }, [params?.section]);

  const [selectedSection, setSelectedSection] = useState<Section>(currentSection);
  const [dialog, setDialog] = useState<DialogType>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);

  const [challengeForm, setChallengeForm] = useState<ChallengeFormState>(emptyChallenge);
  const [taskForm, setTaskForm] = useState<TaskFormState>(emptyTask);
  const [ideaForm, setIdeaForm] = useState<IdeaFormState>(emptyIdea);
  const [resourceForm, setResourceForm] = useState<ResourceFormState>(emptyResource);

  // Sync selectedSection with URL
  useEffect(() => {
    setSelectedSection(currentSection);
  }, [currentSection]);

  // Helper function to navigate to section
  const navigateToSection = useCallback((section: Section) => {
    const path = section === "Overview" ? "/" : `/${section.toLowerCase()}`;
    router.push(path);
  }, [router]);

  const getChallengeUrl = useCallback((challengeId: string) => {
    const currentPath = selectedSection === "Overview" ? "/" : `/${selectedSection.toLowerCase()}`;
    return `/challenges/${challengeId}?returnTo=${encodeURIComponent(currentPath)}`;
  }, [selectedSection]);

  const challengeOptions = useMemo(
    () =>
      state.challenges.map((challenge) => ({
        text: challenge.title,
        value: challenge.id,
      })),
    [state.challenges],
  );

  const resetDialogState = () => {
    setChallengeForm(emptyChallenge);
    setTaskForm(emptyTask);
    setIdeaForm(emptyIdea);
    setResourceForm(emptyResource);
    setEditingTaskId(null);
    setEditingIdeaId(null);
    setEditingResourceId(null);
  };

  const closeDialog = useCallback(() => {
    setDialog(null);
    resetDialogState();
  }, []);

  const openTaskDialog = useCallback(
    (task?: Task) => {
      if (task) {
        setTaskForm({
          challengeId: task.challengeId,
          title: task.title,
          status: task.status,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          notes: task.notes ?? "",
        });
        setEditingTaskId(task.id);
      } else {
        setTaskForm(emptyTask);
        setEditingTaskId(null);
      }
      setDialog("task");
    },
    [setTaskForm, setEditingTaskId, setDialog],
  );

  const openIdeaDialog = useCallback(
    (idea?: Idea) => {
      if (idea) {
        setIdeaForm({
          challengeId: idea.challengeId,
          title: idea.title,
          impact: idea.impact,
          notes: idea.notes,
          tags: [...idea.tags],
        });
        setEditingIdeaId(idea.id);
      } else {
        setIdeaForm(emptyIdea);
        setEditingIdeaId(null);
      }
      setDialog("idea");
    },
    [],
  );

  const openResourceDialog = useCallback(
    (resource?: Resource) => {
      if (resource) {
        setResourceForm({
          challengeId: resource.challengeId,
          title: resource.title,
          url: resource.url,
          type: resource.type,
          notes: resource.notes ?? "",
          tags: [...resource.tags],
        });
        setEditingResourceId(resource.id);
      } else {
        setResourceForm(emptyResource);
        setEditingResourceId(null);
      }
      setDialog("resource");
    },
    [],
  );

  const handleCreateChallenge = () => {
    if (!challengeForm.title.trim()) return;

    const payload: CreateChallengeInput = {
      title: challengeForm.title.trim(),
      theme: challengeForm.theme.trim(),
      status: challengeForm.status,
      deadline: challengeForm.deadline?.toISOString(),
      tags: challengeForm.tags,
      description: challengeForm.description.trim(),
    };

    addChallenge(payload);
    closeDialog();
  };

  const handleCreateTask = () => {
    if (!taskForm.title.trim()) return;

    const payload: CreateTaskInput = {
      challengeId: taskForm.challengeId,
      title: taskForm.title.trim(),
      status: taskForm.status,
      dueDate: taskForm.dueDate?.toISOString(),
      notes: taskForm.notes.trim() || undefined,
    };

    if (editingTaskId) {
      updateTask(editingTaskId, {
        challengeId: payload.challengeId,
        title: payload.title,
        status: payload.status,
        dueDate: payload.dueDate,
        notes: payload.notes,
      });
    } else {
      addTask(payload);
    }

    closeDialog();
  };

  const handleDeleteTask = () => {
    if (!editingTaskId) return;
    removeTask(editingTaskId);
    closeDialog();
  };

  const handleCreateIdea = () => {
    if (!ideaForm.title.trim()) return;

    const payload: CreateIdeaInput = {
      challengeId: ideaForm.challengeId,
      title: ideaForm.title.trim(),
      impact: ideaForm.impact,
      notes: ideaForm.notes.trim(),
      tags: ideaForm.tags,
    };

    if (editingIdeaId) {
      updateIdea(editingIdeaId, {
        challengeId: payload.challengeId,
        title: payload.title,
        impact: payload.impact,
        notes: payload.notes,
        tags: payload.tags,
      });
    } else {
      addIdea(payload);
    }
    closeDialog();
  };

  const handleDeleteIdea = () => {
    if (!editingIdeaId) return;
    removeIdea(editingIdeaId);
    closeDialog();
  };

  const handleCreateResource = () => {
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) return;

    const payload: CreateResourceInput = {
      challengeId: resourceForm.challengeId,
      title: resourceForm.title.trim(),
      url: resourceForm.url.trim(),
      type: resourceForm.type,
      notes: resourceForm.notes.trim() || undefined,
      tags: resourceForm.tags,
    };

    if (editingResourceId) {
      updateResource(editingResourceId, {
        challengeId: payload.challengeId,
        title: payload.title,
        url: payload.url,
        type: payload.type,
        notes: payload.notes,
        tags: payload.tags,
      });
    } else {
      addResource(payload);
    }
    closeDialog();
  };

  const handleDeleteResource = () => {
    if (!editingResourceId) return;
    removeResource(editingResourceId);
    closeDialog();
  };

  const renderDataCell = useCallback(
    (props: GridCustomCellProps) => {
      const { field, dataItem } = props;

      if (!field) {
        return <td {...(props.tdProps ?? {})} />;
      }

      if (isChallengeRow(dataItem)) {
        if (field === "title") {
          return (
            <td>
              <Link
                href={getChallengeUrl(dataItem.id)}
                className="group flex w-full flex-col items-start text-left"
              >
                <span className="font-semibold text-black underline-offset-4 group-hover:underline">
                  {dataItem.title}
                </span>
                <span className="text-xs text-neutral-500">{dataItem.theme}</span>
              </Link>
            </td>
          );
        }

        if (field === "status") {
          return (
            <td>
              <DropDownList
                data={challengeStatuses}
                value={dataItem.status}
                onChange={(event) => updateChallengeStatus(dataItem.id, event.value)}
              />
            </td>
          );
        }

        if (field === "deadline") {
          return (
            <td className="text-sm text-neutral-600">
              {dataItem.deadline ? new Date(dataItem.deadline).toLocaleDateString() : "—"}
            </td>
          );
        }

        if (field === "progress") {
          return (
            <td>
              <ProgressBar value={dataItem.progress} style={{ height: 6 }} />
            </td>
          );
        }
      }

      if (isIdeaRow(dataItem)) {
        if (field === "title") {
          return (
            <td>
              <button
                type="button"
                onClick={() => openIdeaDialog(dataItem)}
                className="w-full text-left text-sm font-semibold text-black underline-offset-4 hover:underline focus:outline-none"
              >
                {dataItem.title}
              </button>
            </td>
          );
        }

        if (field === "challengeId") {
          return (
            <td className="text-sm text-neutral-600">
              {dataItem.challengeId ? (
                <Link
                  href={getChallengeUrl(dataItem.challengeId)}
                  className="font-semibold text-neutral-700 underline-offset-4 hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {state.challenges.find((challenge) => challenge.id === dataItem.challengeId)?.title ??
                    "Not found"}
                </Link>
              ) : (
                "General"
              )}
            </td>
          );
        }

        if (field === "impact") {
          return <td className="text-sm text-neutral-600">{dataItem.impact}</td>;
        }

        if (field === "tags") {
          return (
            <td className="space-x-2 text-xs text-neutral-600">
              {dataItem.tags.map((tag: string) => `#${tag}`).join("  ")}
            </td>
          );
        }
      }

      if (isResourceRow(dataItem)) {
        if (field === "title") {
          return (
            <td>
              <button
                type="button"
                onClick={() => openResourceDialog(dataItem)}
                className="w-full text-left text-sm font-semibold text-black underline-offset-4 hover:underline focus:outline-none"
              >
                {dataItem.title}
              </button>
            </td>
          );
        }

        if (field === "challengeId") {
          return (
            <td className="text-sm text-neutral-600">
              {dataItem.challengeId ? (
                <Link
                  href={getChallengeUrl(dataItem.challengeId)}
                  className="font-semibold text-neutral-700 underline-offset-4 hover:underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  {state.challenges.find((challenge) => challenge.id === dataItem.challengeId)?.title ??
                    "Not found"}
                </Link>
              ) : (
                "General"
              )}
            </td>
          );
        }

        if (field === "url") {
          return (
            <td>
              <a
                href={dataItem.url}
                className="font-semibold text-neutral-700 underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                Visit ↗
              </a>
            </td>
          );
        }

        if (field === "tags") {
          return (
            <td className="space-x-2 text-xs text-neutral-600">
              {dataItem.tags.map((tag: string) => `#${tag}`).join("  ")}
            </td>
          );
        }
      }

      if (isTaskRow(dataItem)) {
        if (field === "title") {
          return (
            <td>
              <button
                type="button"
                onClick={() => openTaskDialog(dataItem)}
                className="w-full text-left text-sm font-semibold text-black underline-offset-4 hover:underline focus:outline-none"
              >
                {dataItem.title}
              </button>
            </td>
          );
        }

        if (field === "challengeId") {
          return (
            <td className="text-sm text-neutral-600">
              {dataItem.challengeId ? (
                <Link
                  href={getChallengeUrl(dataItem.challengeId)}
                  className="font-semibold text-neutral-700 underline-offset-4 hover:underline"
                >
                  {state.challenges.find((challenge) => challenge.id === dataItem.challengeId)?.title ??
                    "Not found"}
                </Link>
              ) : (
                "General"
              )}
            </td>
          );
        }

        if (field === "status") {
          return (
            <td>
              <DropDownList
                data={taskStatuses}
                value={dataItem.status}
                onChange={(event) => updateTaskStatus(dataItem.id, event.value)}
              />
            </td>
          );
        }

        if (field === "dueDate") {
          const label = dataItem.dueDate
            ? new Date(dataItem.dueDate).toLocaleDateString()
            : "—";

          return (
            <td className="text-sm text-neutral-600">
              <button
                type="button"
                onClick={() => openTaskDialog(dataItem)}
                className="w-full text-left underline-offset-4 hover:underline focus:outline-none"
              >
                {label}
              </button>
            </td>
          );
        }
      }

      const tdProps = props.tdProps ?? {};
      if (field) {
        const record = dataItem as Record<string, unknown> | null;
        const value = record ? record[field] : undefined;
        return <td {...tdProps}>{value as ReactNode}</td>;
      }

      return <td {...tdProps} />;
    },
    [
      state.challenges,
      updateChallengeStatus,
      updateTaskStatus,
      getChallengeUrl,
      openTaskDialog,
      openIdeaDialog,
      openResourceDialog,
    ],
  );

  useEffect(() => {
    if (!dialog) return;

    const overlays = Array.from(
      document.querySelectorAll<HTMLDivElement>(".k-dialog-wrapper .k-overlay"),
    );

    const handleOverlayClick = (event: MouseEvent) => {
      event.stopPropagation();
      closeDialog();
    };

    overlays.forEach((overlay) => {
      overlay.addEventListener("click", handleOverlayClick);
    });

    return () => {
      overlays.forEach((overlay) => {
        overlay.removeEventListener("click", handleOverlayClick);
      });
    };
  }, [dialog, closeDialog]);

  const upcoming = derived.upcomingChallenges.slice(0, 4);
  const upcomingTasks = derived.upcomingTasks.slice(0, 5);

  const renderOverview = () => (
    <div className="space-y-6">
      <section className={panelClass}>
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              DEV Challenge Companion
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-black md:text-4xl">
              One workspace for ideas, execution, and polished DEV submissions.
            </h1>
          </div>
          <div className="min-w-[220px] rounded-2xl border border-black/10 bg-white p-5 text-center">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Avg. progress</p>
            <p className="mt-2 text-4xl font-semibold text-black">{derived.completion}%</p>
            <ProgressBar value={derived.completion} style={{ marginTop: "12px", height: 8 }} />
          </div>
        </div>
        <dl className="mt-8 grid grid-cols-1 gap-4 text-sm text-neutral-600 md:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <dt>Active challenges</dt>
            <dd className="mt-2 text-2xl font-semibold text-black">{state.challenges.length}</dd>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <dt>Idea backlog</dt>
            <dd className="mt-2 text-2xl font-semibold text-black">{state.ideas.length}</dd>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <dt>Tasks on deck</dt>
            <dd className="mt-2 text-2xl font-semibold text-black">{state.tasks.length}</dd>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <dt>Resource library</dt>
            <dd className="mt-2 text-2xl font-semibold text-black">{state.resources.length}</dd>
          </div>
        </dl>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className={panelClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">Upcoming challenge milestones</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              {upcoming.length} tracks
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {upcoming.map((challenge) => (
              <div key={challenge.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link
                      href={getChallengeUrl(challenge.id)}
                      className="text-sm font-semibold text-black underline-offset-4 hover:underline"
                    >
                      {challenge.title}
                    </Link>
                    {challenge.deadline && (
                      <p className="text-xs text-neutral-600">
                        Due {new Date(challenge.deadline).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <span className="badge-muted flex-shrink-0 px-4 py-1 text-xs">
                    {challenge.status}
                  </span>
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{ width: `${challenge.progress}%` }}
                  />
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="text-sm text-neutral-500">
                Add your first challenge to see your roadmap here.
              </p>
            )}
          </div>
        </div>

        <div className={panelClass}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">Focus tasks</h2>
            <span className="text-xs uppercase tracking-[0.3em] text-neutral-500">
              Prioritise flow
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {upcomingTasks.map((task) => {
              const challenge = state.challenges.find((item) => item.id === task.challengeId);
              const progress = taskProgressByStatus[task.status] ?? 0;

              return (
                <div
                  key={task.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openTaskDialog(task)}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openTaskDialog(task);
                    }
                  }}
                  className="cursor-pointer rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-black">{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-neutral-600">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      {challenge && (
                        <Link
                          href={getChallengeUrl(challenge.id)}
                          className="text-xs font-semibold text-neutral-700 underline-offset-4 hover:underline"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {challenge.title}
                        </Link>
                      )}
                    </div>
                    <span className="badge-muted flex-shrink-0 px-4 py-1 text-xs">{task.status}</span>
                  </div>
                  <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-black transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {upcomingTasks.length === 0 && (
              <p className="text-sm text-neutral-500">
                You&apos;re all caught up. Create a fresh task to keep the momentum.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={`${panelClass} grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start`}>
        <div className="xl:col-span-2">
          <h2 className="text-lg font-semibold text-black">Idea runway</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Capture sparks that can become submissions, supporting series, or community experiments.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            {state.ideas.slice(0, 4).map((idea) => (
              <article
                key={idea.id}
                role="button"
                tabIndex={0}
                onClick={() => openIdeaDialog(idea)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openIdeaDialog(idea);
                  }
                }}
                className="cursor-pointer rounded-2xl border border-black/10 bg-white p-4 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
              >
                <header className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-black">{idea.title}</h3>
                    {idea.challengeId && (
                      <Link
                        href={getChallengeUrl(idea.challengeId)}
                        className="text-xs font-semibold text-neutral-700 underline-offset-4 hover:underline"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {
                          state.challenges.find((challenge) => challenge.id === idea.challengeId)?.title ??
                          "Unknown"
                        }
                      </Link>
                    )}
                  </div>
                  <span className="badge-muted">{idea.impact}</span>
                </header>
                <p className="mt-3 text-sm text-neutral-600">{idea.notes}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-black/10 px-2 py-1">
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
            {state.ideas.length === 0 && (
              <p className="text-sm text-neutral-500">
                No ideas yet. Add one to start shaping your next standout DEV post.
              </p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="text-lg font-semibold text-black">Resource vault</h2>
          <ul className="mt-4 space-y-3 text-sm text-neutral-700">
            {state.resources.slice(0, 5).map((resource) => (
              <li
                key={resource.id}
                role="button"
                tabIndex={0}
                onClick={() => openResourceDialog(resource)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openResourceDialog(resource);
                  }
                }}
                className="cursor-pointer rounded-xl border border-black/10 bg-white p-3 transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
              >
                <p className="font-medium text-black break-words">{resource.title}</p>
                <p className="mt-1 text-xs text-neutral-500">{resource.type}</p>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  className="mt-2 inline-flex text-xs font-semibold text-neutral-700 underline-offset-4 hover:underline"
                >
                  View resource ↗
                </a>
              </li>
            ))}
            {state.resources.length === 0 && (
              <p className="text-sm text-neutral-500">
                Track every helpful link or snippet right here.
              </p>
            )}
          </ul>
        </div>
      </section>
    </div>
  );

  const renderChallenges = () => (
    <div className={panelClass}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black">Challenge pipeline</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Track where every submission stands. Update status to keep focus aligned.
          </p>
        </div>
        <Button themeColor="primary" fillMode="solid" onClick={() => setDialog("challenge")}>
          New challenge
        </Button>
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <Grid
          style={{ maxHeight: 520 }}
          data={state.challenges}
          className="k-grid-neutral"
          cells={{ data: renderDataCell }}
        >
          <GridColumn field="title" title="Challenge" width="260px" />
          <GridColumn field="status" title="Status" width="180px" />
          <GridColumn field="deadline" title="Deadline" width="160px" />
          <GridColumn field="progress" title="Momentum" />
        </Grid>
      </div>
    </div>
  );

  const renderIdeas = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black">Ideation lab</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Shape experiments, story arcs, and supporting assets for your DEV challenges.
          </p>
        </div>
        <Button themeColor="primary" onClick={() => openIdeaDialog()}>
          Log idea
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {state.ideas.map((idea) => (
          <article
            key={idea.id}
            role="button"
            tabIndex={0}
            onClick={() => openIdeaDialog(idea)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openIdeaDialog(idea);
              }
            }}
            className={`${panelClass} cursor-pointer p-5 transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40`}
          >
            <header className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-black">{idea.title}</h3>
                {idea.challengeId && (
                  <Link
                    href={getChallengeUrl(idea.challengeId)}
                    className="text-xs font-semibold text-neutral-700 underline-offset-4 hover:underline"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {state.challenges.find((challenge) => challenge.id === idea.challengeId)?.title ??
                      "Unknown"}
                  </Link>
                )}
              </div>
              <span className="badge-muted">{idea.impact}</span>
            </header>
            <p className="mt-3 text-sm text-neutral-600">{idea.notes}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600">
              {idea.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-black/10 px-2 py-1">
                  #{tag}
                </span>
              ))}
            </div>
          </article>
        ))}
        {state.ideas.length === 0 && (
          <p className="text-sm text-neutral-500">
            Nothing in the lab yet. Start by capturing quick wins or bold bets you want to explore.
          </p>
        )}
      </div>
    </div>
  );

  const renderResources = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black">Resource library</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Keep the articles, tools, and references you revisit while crafting submissions.
          </p>
        </div>
        <Button themeColor="primary" onClick={() => openResourceDialog()}>
          Add resource
        </Button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
        <Grid data={state.resources} className="k-grid-neutral" cells={{ data: renderDataCell }}>
          <GridColumn field="title" title="Title" width="260px" />
          <GridColumn field="challengeId" title="Challenge" width="240px" />
          <GridColumn field="type" title="Type" width="140px" />
          <GridColumn field="url" title="Link" />
          <GridColumn field="tags" title="Tags" width="220px" />
        </Grid>
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-black">Execution tracker</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Break down each challenge into steps. Status updates keep progress honest.
          </p>
        </div>
        <Button themeColor="primary" onClick={() => openTaskDialog()}>
          Add task
        </Button>
      </div>
      <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
        <Grid data={state.tasks} className="k-grid-neutral" cells={{ data: renderDataCell }}>
          <GridColumn field="title" title="Task" width="240px" />
          <GridColumn field="challengeId" title="Challenge" width="240px" />
          <GridColumn field="status" title="Status" width="180px" />
          <GridColumn field="dueDate" title="Due" width="160px" />
        </Grid>
      </div>
    </div>
  );

  const renderSection = () => {
    switch (selectedSection) {
      case "Overview":
        return renderOverview();
      case "Challenges":
        return renderChallenges();
      case "Ideas":
        return renderIdeas();
      case "Resources":
        return renderResources();
      case "Tasks":
        return renderTasks();
      default:
        return null;
    }
  };

  const renderDialog = () => {
    if (!dialog) return null;

    if (dialog === "challenge") {
      return (
        <Dialog
          title="Create challenge"
          onClose={closeDialog}
          width={640}
          contentStyle={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}
        >
          <div className="space-y-4">
            <Input
              value={challengeForm.title}
              label="Title"
              placeholder="Title of the challenge or concept"
              className="w-full"
              style={{ width: "100%" }}
              onChange={(event) => setChallengeForm((prev) => ({ ...prev, title: event.value }))}
            />
            <Input
              value={challengeForm.theme}
              label="Focus"
              placeholder="What is the theme or goal?"
              className="w-full"
              style={{ width: "100%" }}
              onChange={(event) => setChallengeForm((prev) => ({ ...prev, theme: event.value }))}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DropDownList
                data={challengeStatuses}
                label="Status"
                value={challengeForm.status}
                style={{ width: "100%" }}
                onChange={(event) =>
                  setChallengeForm((prev) => ({ ...prev, status: event.value }))
                }
              />
              <DatePicker
                value={challengeForm.deadline}
                style={{ width: "100%" }}
                onChange={(event) =>
                  setChallengeForm((prev) => ({ ...prev, deadline: event.value ?? null }))
                }
                label="Deadline"
              />
            </div>
            <MultiSelect
              data={tagSuggestions}
              allowCustom
              value={challengeForm.tags}
              style={{ width: "100%" }}
              onChange={(event) =>
                setChallengeForm((prev) => ({ ...prev, tags: event.value as string[] }))
              }
              label="Tags"
              placeholder="Add tags to classify your challenge"
            />
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-neutral-700">Notes</Label>
              <TextArea
                rows={4}
                value={challengeForm.description}
                placeholder="Capture the submission plan, requirements, or framing."
                className="w-full"
                style={{ width: "100%" }}
                onChange={(event) =>
                  setChallengeForm((prev) => ({ ...prev, description: event.value }))
                }
              />
            </div>
          </div>
          <DialogActionsBar>
            <Button fillMode="flat" onClick={closeDialog}>
              Cancel
            </Button>
            <Button themeColor="primary" onClick={handleCreateChallenge}>
              Save challenge
            </Button>
          </DialogActionsBar>
        </Dialog>
      );
    }

    if (dialog === "task") {
      return (
        <Dialog
          title={editingTaskId ? "Edit task" : "Add task"}
          onClose={closeDialog}
          width={600}
          contentStyle={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}
        >
          <div className="space-y-4">
            <Input
              value={taskForm.title}
              label="Task"
              placeholder="Describe the action"
              className="w-full"
              style={{ width: "100%" }}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.value }))}
            />
            <DropDownList
              data={challengeOptions}
              textField="text"
              dataItemKey="value"
              label="Challenge (optional)"
              value={challengeOptions.find((option) => option.value === taskForm.challengeId) ?? null}
              style={{ width: "100%" }}
              onChange={(event) =>
                setTaskForm((prev) => ({ ...prev, challengeId: event.value?.value }))
              }
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DropDownList
                data={taskStatuses}
                label="Status"
                value={taskForm.status}
                style={{ width: "100%" }}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, status: event.value }))
                }
              />
              <DatePicker
                value={taskForm.dueDate}
                label="Due date"
                style={{ width: "100%" }}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, dueDate: event.value ?? null }))
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-neutral-700">Notes</Label>
              <TextArea
                rows={3}
                value={taskForm.notes}
                placeholder="Add context or blockers"
                className="w-full"
                style={{ width: "100%" }}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, notes: event.value }))}
              />
            </div>
          </div>
          <DialogActionsBar>
            <Button fillMode="flat" onClick={closeDialog}>
              Cancel
            </Button>
            {editingTaskId && (
              <Button
                fillMode="flat"
                className="text-red-600"
                onClick={handleDeleteTask}
              >
                Delete
              </Button>
            )}
            <Button themeColor="primary" onClick={handleCreateTask}>
              {editingTaskId ? "Save changes" : "Save task"}
            </Button>
          </DialogActionsBar>
        </Dialog>
      );
    }

    if (dialog === "idea") {
      return (
        <Dialog
          title={editingIdeaId ? "Edit idea" : "Log idea"}
          onClose={closeDialog}
          width={600}
          contentStyle={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}
        >
          <div className="space-y-4">
            <Input
              value={ideaForm.title}
              label="Idea"
              placeholder="Give it a memorable name"
              className="w-full"
              style={{ width: "100%" }}
              onChange={(event) => setIdeaForm((prev) => ({ ...prev, title: event.value }))}
            />
            <DropDownList
              data={challengeOptions}
              textField="text"
              dataItemKey="value"
              label="Challenge (optional)"
              value={challengeOptions.find((option) => option.value === ideaForm.challengeId) ?? null}
              style={{ width: "100%" }}
              onChange={(event) =>
                setIdeaForm((prev) => ({ ...prev, challengeId: event.value?.value }))
              }
            />
            <DropDownList
              data={ideaImpactOptions}
              label="Impact"
              value={ideaForm.impact}
              style={{ width: "100%" }}
              onChange={(event) =>
                setIdeaForm((prev) => ({ ...prev, impact: event.value }))
              }
            />
            <MultiSelect
              data={tagSuggestions}
              allowCustom
              value={ideaForm.tags}
              label="Tags"
              style={{ width: "100%" }}
              onChange={(event) =>
                setIdeaForm((prev) => ({ ...prev, tags: event.value as string[] }))
              }
              placeholder="Add searchable tags"
            />
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-neutral-700">Notes</Label>
              <TextArea
                rows={4}
                value={ideaForm.notes}
                placeholder="Where does this fit? What problem does it solve?"
                className="w-full"
                style={{ width: "100%" }}
                onChange={(event) => setIdeaForm((prev) => ({ ...prev, notes: event.value }))}
              />
            </div>
          </div>
          <DialogActionsBar>
            <Button fillMode="flat" onClick={closeDialog}>
              Cancel
            </Button>
            {editingIdeaId && (
              <Button
                fillMode="flat"
                className="text-red-600"
                onClick={handleDeleteIdea}
              >
                Delete
              </Button>
            )}
            <Button themeColor="primary" onClick={handleCreateIdea}>
              {editingIdeaId ? "Save changes" : "Save idea"}
            </Button>
          </DialogActionsBar>
        </Dialog>
      );
    }

    if (dialog === "resource") {
      return (
        <Dialog
          title={editingResourceId ? "Edit resource" : "Add resource"}
          onClose={closeDialog}
          width={600}
          contentStyle={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}
        >
          <div className="space-y-4">
            <Input
              value={resourceForm.title}
              label="Resource title"
              placeholder="Give your resource a name"
              className="w-full"
              style={{ width: "100%" }}
              onChange={(event) => setResourceForm((prev) => ({ ...prev, title: event.value }))}
            />
            <Input
              value={resourceForm.url}
              label="Link"
              placeholder="https://"
              className="w-full"
              style={{ width: "100%" }}
              onChange={(event) => setResourceForm((prev) => ({ ...prev, url: event.value }))}
            />
            <DropDownList
              data={challengeOptions}
              textField="text"
              dataItemKey="value"
              label="Challenge (optional)"
              value={challengeOptions.find((option) => option.value === resourceForm.challengeId) ?? null}
              style={{ width: "100%" }}
              onChange={(event) =>
                setResourceForm((prev) => ({ ...prev, challengeId: event.value?.value }))
              }
            />
            <DropDownList
              data={resourceTypeOptions}
              label="Type"
              value={resourceForm.type}
              style={{ width: "100%" }}
              onChange={(event) =>
                setResourceForm((prev) => ({ ...prev, type: event.value }))
              }
            />
            <MultiSelect
              data={tagSuggestions}
              allowCustom
              value={resourceForm.tags}
              label="Tags"
              style={{ width: "100%" }}
              onChange={(event) =>
                setResourceForm((prev) => ({ ...prev, tags: event.value as string[] }))
              }
            />
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-neutral-700">Notes</Label>
              <TextArea
                rows={3}
                value={resourceForm.notes}
                placeholder="Why is this useful?"
                className="w-full"
                style={{ width: "100%" }}
                onChange={(event) => setResourceForm((prev) => ({ ...prev, notes: event.value }))}
              />
            </div>
          </div>
          <DialogActionsBar>
            <Button fillMode="flat" onClick={closeDialog}>
              Cancel
            </Button>
            {editingResourceId && (
              <Button
                fillMode="flat"
                className="text-red-600"
                onClick={handleDeleteResource}
              >
                Delete
              </Button>
            )}
            <Button themeColor="primary" onClick={handleCreateResource}>
              {editingResourceId ? "Save changes" : "Save resource"}
            </Button>
          </DialogActionsBar>
        </Dialog>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <AppBar positionMode="sticky" className="border-b border-black/10 bg-white">
        <AppBarSection className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/10 text-sm font-semibold uppercase">
            DEV
          </span>
          <div>
            <p className="text-sm font-semibold text-black">Challenge HQ</p>
            <p className="text-xs text-neutral-500">Ideate, plan, and publish.</p>
          </div>
        </AppBarSection>
        <AppBarSpacer style={{ width: 16 }} />
        <AppBarSection>
          <ButtonGroup>
            <Button onClick={() => setDialog("challenge")}>Challenge</Button>
            <Button onClick={() => openIdeaDialog()}>Idea</Button>
            <Button onClick={() => openResourceDialog()}>Resource</Button>
            <Button onClick={() => openTaskDialog()}>Task</Button>
          </ButtonGroup>
        </AppBarSection>
      </AppBar>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 lg:flex-row">
        <nav className="lg:w-56">
          <div className="sticky top-24 rounded-3xl border border-black/10 bg-white p-4 shadow-[0_20px_50px_rgba(17,17,17,0.05)]">
            <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">Workspace</p>
            <ul className="mt-4 space-y-2 text-sm font-medium">
              {pageSections.map((section) => (
                <li key={section}>
                  <button
                    type="button"
                    onClick={() => navigateToSection(section)}
                    className={`flex w-full items-center justify-between rounded-2xl border border-transparent px-4 py-3 transition-colors ${
                      selectedSection === section
                        ? "border-black bg-black text-white"
                        : "text-neutral-600 hover:border-black/10 hover:bg-neutral-100"
                    }`}
                  >
                    <span>{section}</span>
                    <span className="text-xs text-neutral-500">
                      {section === "Overview" && "HQ"}
                      {section === "Challenges" && state.challenges.length}
                      {section === "Ideas" && state.ideas.length}
                      {section === "Resources" && state.resources.length}
                      {section === "Tasks" && state.tasks.length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <section className="flex-1 pb-20">
          {!isReady ? (
            <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">
              Loading your workspace...
            </div>
          ) : (
            renderSection()
          )}
        </section>
      </main>

      {renderDialog()}
    </div>
  );
}
