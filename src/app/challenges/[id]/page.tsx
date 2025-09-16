"use client";

import {
  AppBar,
  AppBarSection,
  AppBarSpacer,
} from "@progress/kendo-react-layout";
import { Button } from "@progress/kendo-react-buttons";
import { DropDownList, MultiSelect } from "@progress/kendo-react-dropdowns";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { Input, TextArea } from "@progress/kendo-react-inputs";
import { Label } from "@progress/kendo-react-labels";
import { Dialog, DialogActionsBar } from "@progress/kendo-react-dialogs";
import { ProgressBar } from "@progress/kendo-react-progressbars";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { tagSuggestions } from "@/data/tagSuggestions";
import { useTrackerData } from "@/lib/useTrackerData";
import type {
  ChallengeStatus,
  CreateIdeaInput,
  CreateResourceInput,
  CreateTaskInput,
  Idea,
  Resource,
  Task,
} from "@/types/tracker";

const panelClass =
  "rounded-3xl border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(17,17,17,0.05)]";

interface TaskFormState {
  title: string;
  status: Task["status"];
  dueDate: Date | null;
  notes: string;
}

interface IdeaFormState {
  title: string;
  impact: Idea["impact"];
  notes: string;
  tags: string[];
}

interface ResourceFormState {
  title: string;
  url: string;
  type: Resource["type"];
  notes: string;
  tags: string[];
}

interface ChallengeFormState {
  title: string;
  theme: string;
  status: ChallengeStatus;
  deadline: Date | null;
  description: string;
  tags: string[];
}

const emptyTask: TaskFormState = {
  title: "",
  status: "Not Started",
  dueDate: null,
  notes: "",
};

const emptyIdea: IdeaFormState = {
  title: "",
  impact: "Quick Win",
  notes: "",
  tags: [],
};

const emptyResource: ResourceFormState = {
  title: "",
  url: "",
  type: "Article",
  notes: "",
  tags: [],
};

const emptyChallengeForm: ChallengeFormState = {
  title: "",
  theme: "",
  status: "Ideation",
  deadline: null,
  description: "",
  tags: [],
};

type DialogEntity = "challenge" | "task" | "idea" | "resource";
type DialogMode = "create" | "edit";

interface DialogState {
  type: DialogEntity;
  mode: DialogMode;
  itemId?: string;
}

const taskStatuses: Task["status"][] = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Done",
];

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

const challengeStatuses: ChallengeStatus[] = [
  "Ideation",
  "Drafting",
  "In Review",
  "Submitted",
  "Published",
];

export default function ChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const {
    state,
    updateChallengeStatus,
    updateChallenge,
    updateTaskStatus,
    updateTask,
    addTask,
    updateIdea,
    addIdea,
    updateResource,
    addResource,
    isReady,
  } = useTrackerData();

  const challenge = useMemo(
    () => state.challenges.find((item) => item.id === challengeId),
    [state.challenges, challengeId],
  );

  const tasks = useMemo(
    () => state.tasks.filter((task) => task.challengeId === challengeId),
    [state.tasks, challengeId],
  );

  const ideas = useMemo(
    () => state.ideas.filter((idea) => idea.challengeId === challengeId),
    [state.ideas, challengeId],
  );

  const resources = useMemo(
    () => state.resources.filter((resource) => resource.challengeId === challengeId),
    [state.resources, challengeId],
  );

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormState>(emptyTask);
  const [ideaForm, setIdeaForm] = useState<IdeaFormState>(emptyIdea);
  const [resourceForm, setResourceForm] = useState<ResourceFormState>(emptyResource);
  const [challengeForm, setChallengeForm] =
    useState<ChallengeFormState>(emptyChallengeForm);

  const handleBackNavigation = useCallback(() => {
    const returnTo = searchParams?.get('returnTo');
    if (returnTo) {
      router.push(returnTo);
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (!challenge) return;
    if (dialog?.type === "challenge" && dialog.mode === "edit") return;

    setChallengeForm({
      title: challenge.title,
      theme: challenge.theme,
      status: challenge.status,
      deadline: challenge.deadline ? new Date(challenge.deadline) : null,
      description: challenge.description,
      tags: [...challenge.tags],
    });
  }, [challenge, dialog]);

  const closeDialog = useCallback(() => {
    setDialog(null);
    setTaskForm(emptyTask);
    setIdeaForm(emptyIdea);
    setResourceForm(emptyResource);
    if (challenge) {
      setChallengeForm({
        title: challenge.title,
        theme: challenge.theme,
        status: challenge.status,
        deadline: challenge.deadline ? new Date(challenge.deadline) : null,
        description: challenge.description,
        tags: [...challenge.tags],
      });
    }
  }, [challenge]);

  const openChallengeEditor = () => {
    if (!challenge) return;
    setChallengeForm({
      title: challenge.title,
      theme: challenge.theme,
      status: challenge.status,
      deadline: challenge.deadline ? new Date(challenge.deadline) : null,
      description: challenge.description,
      tags: [...challenge.tags],
    });
    setDialog({ type: "challenge", mode: "edit" });
  };

  const openTaskEditor = (task: Task) => {
    setTaskForm({
      title: task.title,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      notes: task.notes ?? "",
    });
    setDialog({ type: "task", mode: "edit", itemId: task.id });
  };

  const openIdeaEditor = (idea: Idea) => {
    setIdeaForm({
      title: idea.title,
      impact: idea.impact,
      notes: idea.notes,
      tags: [...idea.tags],
    });
    setDialog({ type: "idea", mode: "edit", itemId: idea.id });
  };

  const openResourceEditor = (resource: Resource) => {
    setResourceForm({
      title: resource.title,
      url: resource.url,
      type: resource.type,
      notes: resource.notes ?? "",
      tags: [...resource.tags],
    });
    setDialog({ type: "resource", mode: "edit", itemId: resource.id });
  };

const handleCardKeyDown = (
  event: KeyboardEvent<HTMLElement>,
  action: () => void,
) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
};

  const handleSaveTask = () => {
    if (!taskForm.title.trim()) return;

    const payload: CreateTaskInput = {
      challengeId,
      title: taskForm.title.trim(),
      status: taskForm.status,
      dueDate: taskForm.dueDate?.toISOString(),
      notes: taskForm.notes.trim() || undefined,
    };

    if (dialog?.type === "task" && dialog.mode === "edit" && dialog.itemId) {
      updateTask(dialog.itemId, {
        title: payload.title,
        status: payload.status,
        dueDate: payload.dueDate,
        notes: payload.notes,
      });
    } else if (challengeId) {
      addTask(payload);
    }

    closeDialog();
  };

  const handleSaveIdea = () => {
    if (!ideaForm.title.trim()) return;

    const payload: CreateIdeaInput = {
      challengeId,
      title: ideaForm.title.trim(),
      impact: ideaForm.impact,
      notes: ideaForm.notes.trim(),
      tags: ideaForm.tags,
    };

    if (dialog?.type === "idea" && dialog.mode === "edit" && dialog.itemId) {
      updateIdea(dialog.itemId, {
        title: payload.title,
        impact: payload.impact,
        notes: payload.notes,
        tags: payload.tags,
      });
    } else if (challengeId) {
      addIdea(payload);
    }

    closeDialog();
  };

  const handleSaveResource = () => {
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) return;

    const payload: CreateResourceInput = {
      challengeId,
      title: resourceForm.title.trim(),
      url: resourceForm.url.trim(),
      type: resourceForm.type,
      notes: resourceForm.notes.trim() || undefined,
      tags: resourceForm.tags,
    };

    if (dialog?.type === "resource" && dialog.mode === "edit" && dialog.itemId) {
      updateResource(dialog.itemId, {
        title: payload.title,
        url: payload.url,
        type: payload.type,
        notes: payload.notes,
        tags: payload.tags,
      });
    } else if (challengeId) {
      addResource(payload);
    }

    closeDialog();
  };

  const handleSaveChallenge = () => {
    if (!challengeId || !challengeForm.title.trim()) return;

    updateChallenge(challengeId, {
      title: challengeForm.title.trim(),
      theme: challengeForm.theme.trim(),
      status: challengeForm.status,
      deadline: challengeForm.deadline?.toISOString(),
      description: challengeForm.description.trim(),
      tags: challengeForm.tags,
    });

    closeDialog();
  };

  const renderDialog = () => {
    if (!dialog) return null;

    let dialogSurface: ReactNode = null;

    if (dialog.type === "challenge") {
      dialogSurface = (
        <Dialog
          title="Edit challenge"
          onClose={closeDialog}
          width={640}
          appendTo={null}
          contentStyle={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}
        >
          <div className="flex flex-col gap-5">
            <Input
              value={challengeForm.title}
              label="Title"
              placeholder="Update the challenge title"
              className="w-full"
              style={{ width: "100%" }}
              onChange={(event) =>
                setChallengeForm((prev) => ({ ...prev, title: event.value }))
              }
            />
            <Input
              value={challengeForm.theme}
              label="Focus"
              placeholder="Theme or goal"
              className="w-full"
              style={{ width: "100%" }}
              onChange={(event) =>
                setChallengeForm((prev) => ({ ...prev, theme: event.value }))
              }
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
                label="Deadline"
                style={{ width: "100%" }}
                onChange={(event) =>
                  setChallengeForm((prev) => ({ ...prev, deadline: event.value ?? null }))
                }
              />
            </div>
            <MultiSelect
              data={tagSuggestions}
              allowCustom
              value={challengeForm.tags}
              label="Tags"
              style={{ width: "100%" }}
              onChange={(event) =>
                setChallengeForm((prev) => ({ ...prev, tags: event.value as string[] }))
              }
              placeholder="Add tags to classify your challenge"
            />
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-neutral-700">Notes</Label>
              <TextArea
                rows={4}
                value={challengeForm.description}
                placeholder="Describe the plan, requirements, or framing"
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
            <Button themeColor="primary" onClick={handleSaveChallenge}>
              Save changes
            </Button>
          </DialogActionsBar>
        </Dialog>
      );
    }

    if (dialog.type === "task") {
      dialogSurface = (
        <Dialog
          title={dialog.mode === "edit" ? "Edit task" : "Add task"}
          onClose={closeDialog}
          width={600}
          appendTo={null}
          contentStyle={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}
        >
          <div className="flex flex-col gap-5">
            <Input
              value={taskForm.title}
              label="Task"
              placeholder="Describe the next step"
              className="w-full"
              style={{ width: "100%" }}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.value }))}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DropDownList
                data={taskStatuses}
                label="Status"
                value={taskForm.status}
                style={{ width: "100%" }}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.value }))}
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
                placeholder="Add supporting context or blockers"
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
            <Button themeColor="primary" onClick={handleSaveTask}>
              {dialog.mode === "edit" ? "Update task" : "Save task"}
            </Button>
          </DialogActionsBar>
        </Dialog>
      );
    }

    if (dialog.type === "idea") {
      dialogSurface = (
        <Dialog
          title={dialog.mode === "edit" ? "Edit idea" : "Log idea"}
          onClose={closeDialog}
          width={600}
          appendTo={null}
          contentStyle={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}
        >
          <div className="flex flex-col gap-5">
            <Input
              value={ideaForm.title}
              label="Idea"
              placeholder="Give it a memorable name"
              className="w-full"
              style={{ width: "100%" }}
              onChange={(event) => setIdeaForm((prev) => ({ ...prev, title: event.value }))}
            />
            <DropDownList
              data={ideaImpactOptions}
              label="Impact"
              value={ideaForm.impact}
              style={{ width: "100%" }}
              onChange={(event) => setIdeaForm((prev) => ({ ...prev, impact: event.value }))}
            />
            <MultiSelect
              data={tagSuggestions}
              allowCustom
              value={ideaForm.tags}
              label="Tags"
              style={{ width: "100%" }}
              onChange={(event) => setIdeaForm((prev) => ({ ...prev, tags: event.value as string[] }))}
            />
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-neutral-700">Notes</Label>
              <TextArea
                rows={4}
                value={ideaForm.notes}
                placeholder="What problem does this solve?"
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
            <Button themeColor="primary" onClick={handleSaveIdea}>
              {dialog.mode === "edit" ? "Update idea" : "Save idea"}
            </Button>
          </DialogActionsBar>
        </Dialog>
      );
    }

    if (dialog.type === "resource") {
      dialogSurface = (
        <Dialog
          title={dialog.mode === "edit" ? "Edit resource" : "Add resource"}
          onClose={closeDialog}
          width={600}
          appendTo={null}
          contentStyle={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}
        >
          <div className="flex flex-col gap-5">
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
              data={resourceTypeOptions}
              label="Type"
              value={resourceForm.type}
              style={{ width: "100%" }}
              onChange={(event) => setResourceForm((prev) => ({ ...prev, type: event.value }))}
            />
            <MultiSelect
              data={tagSuggestions}
              allowCustom
              value={resourceForm.tags}
              label="Tags"
              style={{ width: "100%" }}
              onChange={(event) => setResourceForm((prev) => ({ ...prev, tags: event.value as string[] }))}
            />
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium text-neutral-700">Notes</Label>
              <TextArea
                rows={3}
                value={resourceForm.notes}
                placeholder="Why is this helpful for the submission?"
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
            <Button themeColor="primary" onClick={handleSaveResource}>
              {dialog.mode === "edit" ? "Update resource" : "Save resource"}
            </Button>
          </DialogActionsBar>
        </Dialog>
      );
    }

    if (!dialogSurface) {
      return null;
    }

    if (typeof document === "undefined") {
      return dialogSurface;
    }

    return dialogSurface;
  };

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

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-neutral-500">
        Loading challenge workspace...
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-white p-8 text-black">
        <div className="mx-auto max-w-3xl space-y-6">
          <AppBar className="border-b border-black/10 bg-white">
            <AppBarSection>
              <Link href="/" className="text-sm font-semibold text-neutral-700 underline-offset-4 hover:underline">
                ← Back to HQ
              </Link>
            </AppBarSection>
          </AppBar>
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(17,17,17,0.05)]">
            <h1 className="text-2xl font-semibold">Challenge not found</h1>
            <p className="mt-2 text-neutral-600">
              The entry you were looking for has been removed or never existed. Head back to the dashboard to pick another challenge.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center text-sm font-semibold text-neutral-700 underline-offset-4 hover:underline"
            >
              Return to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <AppBar positionMode="sticky" className="border-b border-black/10 bg-white">
        <AppBarSection className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-black/10 text-sm font-semibold uppercase">
            DEV
          </span>
          <div>
            <p className="text-sm font-semibold text-black">Challenge HQ</p>
            <p className="text-xs text-neutral-500">Focused view</p>
          </div>
        </AppBarSection>
        <AppBarSpacer style={{ width: 16 }} />
        <AppBarSection>
          <button
            onClick={handleBackNavigation}
            className="text-sm font-semibold text-neutral-700 underline-offset-4 hover:underline"
          >
            ← Back to dashboard
          </button>
        </AppBarSection>
      </AppBar>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <button
          onClick={handleBackNavigation}
          className="inline-flex text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500 underline-offset-4 hover:underline"
        >
          Back to HQ
        </button>

        <section className={panelClass}>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Challenge</p>
                <h1 className="text-3xl font-semibold text-black">{challenge.title}</h1>
                <p className="text-sm text-neutral-600">{challenge.theme}</p>
              </div>
              {challenge.description && (
                <p className="text-sm text-neutral-600">{challenge.description}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
                {challenge.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-black/10 px-2 py-1">
                    #{tag}
                  </span>
                ))}
              </div>
              {challenge.deadline && (
                <p className="text-xs text-neutral-500">
                  Deadline {new Date(challenge.deadline).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <Button size="small" fillMode="flat" onClick={openChallengeEditor}>
                  Edit details
                </Button>
              </div>
            </div>
            <div className="w-full max-w-xs space-y-4">
              <DropDownList
                data={challengeStatuses}
                label="Status"
                value={challenge.status}
                onChange={(event) => updateChallengeStatus(challenge.id, event.value)}
              />
              <div className="rounded-2xl border border-black/10 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Progress</p>
                <p className="mt-2 text-3xl font-semibold text-black">{challenge.progress}%</p>
                <ProgressBar value={challenge.progress} style={{ marginTop: "12px", height: 8 }} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className={panelClass}>
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-black">Tasks</h2>
                <Button
                  size="small"
                  onClick={() => {
                    setTaskForm(emptyTask);
                    setDialog({ type: "task", mode: "create" });
                  }}
                  aria-label="Add task"
                  style={{ minWidth: 32, borderRadius: 999, paddingInline: 12 }}
                >
                  +
                </Button>
              </div>
              <span className="text-xs text-neutral-500">{tasks.length}</span>
            </header>
            {tasks.length === 0 ? (
              <p className="mt-6 text-sm text-neutral-500">
                No tasks yet. Add the first step to keep momentum visible.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openTaskEditor(task)}
                    onKeyDown={(event) => handleCardKeyDown(event, () => openTaskEditor(task))}
                    className="rounded-2xl border border-black/10 bg-white p-4 transition-colors hover:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-black">{task.title}</p>
                        <p className="text-xs text-neutral-500">
                          Status: <span className="font-semibold text-black">{task.status}</span>
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-neutral-500">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-2"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <DropDownList
                          data={taskStatuses}
                          value={task.status}
                          onChange={(event) => updateTaskStatus(task.id, event.value)}
                          style={{ width: 160 }}
                        />
                      </div>
                    </div>
                    {task.notes && <p className="mt-3 text-sm text-neutral-600">{task.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={panelClass}>
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-black">Ideas</h2>
                <Button
                  size="small"
                  onClick={() => {
                    setIdeaForm(emptyIdea);
                    setDialog({ type: "idea", mode: "create" });
                  }}
                  aria-label="Log idea"
                  style={{ minWidth: 32, borderRadius: 999, paddingInline: 12 }}
                >
                  +
                </Button>
              </div>
              <span className="text-xs text-neutral-500">{ideas.length}</span>
            </header>
            {ideas.length === 0 ? (
              <p className="mt-6 text-sm text-neutral-500">
                No ideas logged yet. Capture your angles, stories, and experiments here.
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {ideas.map((idea) => (
                  <li
                    key={idea.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openIdeaEditor(idea)}
                    onKeyDown={(event) => handleCardKeyDown(event, () => openIdeaEditor(idea))}
                    className="rounded-2xl border border-black/10 bg-white p-4 transition-colors hover:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-black">{idea.title}</p>
                        <p className="text-xs text-neutral-500">Impact: {idea.impact}</p>
                      </div>
                      <span className="badge-muted">{idea.impact}</span>
                    </div>
                    <p className="mt-3 text-sm text-neutral-600">{idea.notes}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
                      {idea.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-black/10 px-2 py-1">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className={panelClass}>
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-black">Resources</h2>
              <Button
                size="small"
                onClick={() => {
                  setResourceForm(emptyResource);
                  setDialog({ type: "resource", mode: "create" });
                }}
                aria-label="Add resource"
                style={{ minWidth: 32, borderRadius: 999, paddingInline: 12 }}
              >
                +
              </Button>
            </div>
            <span className="text-xs text-neutral-500">{resources.length}</span>
          </header>
          {resources.length === 0 ? (
            <p className="mt-6 text-sm text-neutral-500">
              Drop every supporting link, asset, or snippet that informs this submission.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {resources.map((resource) => (
                <li
                  key={resource.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openResourceEditor(resource)}
                  onKeyDown={(event) => handleCardKeyDown(event, () => openResourceEditor(resource))}
                  className="rounded-2xl border border-black/10 bg-white p-4 transition-colors hover:border-black/20 focus:outline-none focus:ring-2 focus:ring-black/30 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-black">{resource.title}</p>
                      <p className="text-xs text-neutral-500">{resource.type}</p>
                    </div>
                  </div>
                  {resource.notes && <p className="mt-2 text-sm text-neutral-600">{resource.notes}</p>}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="mt-3 inline-flex text-xs font-semibold text-neutral-700 underline-offset-4 hover:underline"
                  >
                    Visit resource ↗
                  </a>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-neutral-600">
                    {resource.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-black/10 px-2 py-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      {renderDialog()}
    </div>
  );
}
