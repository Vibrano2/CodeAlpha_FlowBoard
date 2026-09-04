import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createAppQueryClient } from "./lib/query-client";
import type { Task } from "./types/task";

const user = {
  id: "708fe7a5-4696-43b4-bdf1-4ef5e19f845a",
  name: "Victor Ibrahim",
  email: "victor@example.com",
  avatarUrl: null,
  createdAt: "2026-09-04T06:00:00.000Z",
  updatedAt: "2026-09-04T06:00:00.000Z",
};

const member = {
  id: "d5f6070d-d0bb-4cf1-86dc-680fcfe0556d",
  name: "Amina Bello",
  email: "amina@example.com",
  avatarUrl: null,
};

const projectId = "f9534ad1-f82a-414f-ae76-b2655d881f6d";
const boardId = "7a23762d-075d-4c99-a82c-2e2ae7553402";
const taskId = "d56d146a-d851-49d4-b205-6397d4a3a789";

const project = {
  id: projectId,
  name: "Website launch",
  description: "Coordinate the launch work.",
  ownerId: user.id,
  createdAt: "2026-09-04T11:30:00.000Z",
  updatedAt: "2026-09-04T11:30:00.000Z",
  owner: { id: user.id, name: user.name, email: user.email, avatarUrl: null },
  board: {
    id: boardId,
    name: "Project Board",
    createdAt: "2026-09-04T11:30:00.000Z",
    updatedAt: "2026-09-04T11:30:00.000Z",
  },
  _count: { members: 2 },
  currentUserRole: "OWNER",
} as const;

const board = { ...project.board, projectId };

const memberships = [
  {
    id: "30ca9548-01ed-40fe-aa50-84ce190e8dfa",
    projectId,
    userId: user.id,
    role: "OWNER",
    joinedAt: project.createdAt,
    user: project.owner,
  },
  {
    id: "f8c9466b-8c7c-4b85-b418-e11806c7387e",
    projectId,
    userId: member.id,
    role: "MEMBER",
    joinedAt: project.createdAt,
    user: member,
  },
] as const;

const task: Task = {
  id: taskId,
  projectId,
  boardId,
  title: "Build the project board",
  description: "Create four accessible Kanban columns.",
  status: "TODO",
  priority: "HIGH",
  assigneeId: member.id,
  createdBy: user.id,
  dueDate: "2020-09-10T23:59:59.999Z",
  position: 0,
  completedAt: null,
  createdAt: "2026-09-04T14:00:00.000Z",
  updatedAt: "2026-09-04T14:00:00.000Z",
  assignee: member,
  creator: project.owner,
  board: { id: boardId, name: board.name },
  project: { id: projectId, name: project.name },
  _count: { comments: 0 },
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const renderApp = (path: string) => render(
  <QueryClientProvider client={createAppQueryClient(true)}>
    <MemoryRouter initialEntries={[path]}><App /></MemoryRouter>
  </QueryClientProvider>,
);

const baseResponse = (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.endsWith("/auth/me")) return jsonResponse({ success: true, data: { user } });
  if (url.endsWith(`/projects/${projectId}/board`)) return jsonResponse({ success: true, data: { board } });
  if (url.endsWith(`/projects/${projectId}/members`)) return jsonResponse({ success: true, data: { members: memberships } });
  if (url.endsWith(`/projects/${projectId}`)) return jsonResponse({ success: true, data: { project } });
  return null;
};

describe("FlowBoard task UI", () => {
  it("shows real assigned, upcoming, and overdue task counts on the dashboard", async () => {
    const upcomingTask: Task = {
      ...task,
      id: "fdc29c75-b930-4599-a70e-8d7796579506",
      title: "Prepare the release notes",
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(jsonResponse({ success: true, data: { user } }));
      if (url.endsWith("/projects")) return Promise.resolve(jsonResponse({ success: true, data: { projects: [] } }));
      if (url.endsWith("/tasks")) return Promise.resolve(jsonResponse({ success: true, data: { tasks: [task, upcomingTask] } }));
      if (url.endsWith("/health")) return Promise.resolve(jsonResponse({ success: true, data: { status: "ok", service: "flowboard-api", database: "connected", timestamp: new Date().toISOString(), uptime: 10 } }));
      return Promise.resolve(jsonResponse({ success: false }, 404));
    }));

    renderApp("/dashboard");

    const assignedHeading = await screen.findByRole("heading", { name: "Tasks assigned to me" });
    const assignedCard = assignedHeading.closest("section");
    const upcomingCard = screen.getByRole("heading", { name: "Upcoming due dates" }).closest("section");
    expect(assignedCard).not.toBeNull();
    expect(upcomingCard).not.toBeNull();
    await waitFor(() => expect(within(assignedCard!).getByText("2")).toBeVisible());
    expect(within(upcomingCard!).getByText("1")).toBeVisible();
    expect(within(upcomingCard!).getByText("1 overdue")).toBeVisible();
  });

  it("renders the responsive Kanban board with compact task information", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const base = baseResponse(input);
      if (base) return Promise.resolve(base);
      if (String(input).endsWith(`/projects/${projectId}/tasks`)) {
        return Promise.resolve(jsonResponse({ success: true, data: { tasks: [task] } }));
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    }));

    renderApp(`/projects/${projectId}/board`);

    expect(await screen.findByRole("heading", { name: "Project Board" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "To Do" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "In Progress" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Review" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Completed" })).toBeVisible();
    expect(screen.getByRole("link", { name: task.title })).toBeVisible();
    expect(screen.getByText("High")).toBeVisible();
    expect(screen.getByText(member.name)).toBeVisible();
    expect(screen.getByText("Overdue")).toBeVisible();
    expect(screen.getByLabelText("0 comments")).toBeVisible();
  });

  it("creates a task from the board and refreshes the correct column", async () => {
    let tasks: Task[] = [];
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const base = baseResponse(input);
      if (base) return Promise.resolve(base);
      const url = String(input);
      if (url.endsWith(`/projects/${projectId}/tasks`) && init?.method === "POST") {
        tasks = [task];
        return Promise.resolve(jsonResponse({ success: true, data: { task } }, 201));
      }
      if (url.endsWith(`/projects/${projectId}/tasks`)) {
        return Promise.resolve(jsonResponse({ success: true, data: { tasks } }));
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp(`/projects/${projectId}/board`);

    fireEvent.click(await screen.findByRole("button", { name: "New task" }));
    fireEvent.change(screen.getByLabelText("Task title"), { target: { value: task.title } });
    fireEvent.change(screen.getByLabelText("Priority"), { target: { value: "HIGH" } });
    fireEvent.change(screen.getByLabelText("Assignee"), { target: { value: member.id } });
    fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-09-10" } });
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));

    expect(await screen.findByRole("link", { name: task.title })).toBeVisible();
    const createCall = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith(`/projects/${projectId}/tasks`) && init?.method === "POST");
    expect(createCall).toBeDefined();
    expect(JSON.parse(String(createCall?.[1]?.body))).toMatchObject({
      title: task.title,
      priority: "HIGH",
      assigneeId: member.id,
      dueDate: "2026-09-10T23:59:59.999Z",
    });
  });

  it("changes status through the accessible card selector", async () => {
    let currentTask = task;
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const base = baseResponse(input);
      if (base) return Promise.resolve(base);
      const url = String(input);
      if (url.endsWith(`/tasks/${taskId}/status`) && init?.method === "PATCH") {
        currentTask = { ...task, status: "IN_PROGRESS" };
        return Promise.resolve(jsonResponse({ success: true, data: { task: currentTask } }));
      }
      if (url.endsWith(`/projects/${projectId}/tasks`)) {
        return Promise.resolve(jsonResponse({ success: true, data: { tasks: [currentTask] } }));
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp(`/projects/${projectId}/board`);

    fireEvent.change(await screen.findByLabelText(`Status for ${task.title}`), {
      target: { value: "IN_PROGRESS" },
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/tasks/${taskId}/status`,
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "IN_PROGRESS" }) }),
    ));
    await waitFor(() => expect(screen.getByLabelText(`Status for ${task.title}`)).toHaveValue("IN_PROGRESS"));
  });

  it("edits all core task fields from the full task detail screen", async () => {
    const updatedTask = { ...task, title: "Ship the project board", priority: "URGENT", status: "REVIEW" } as const;
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const base = baseResponse(input);
      if (base) return Promise.resolve(base);
      const url = String(input);
      if (url.endsWith(`/tasks/${taskId}`) && init?.method === "PATCH") {
        return Promise.resolve(jsonResponse({ success: true, data: { task: updatedTask } }));
      }
      if (url.endsWith(`/tasks/${taskId}`)) return Promise.resolve(jsonResponse({ success: true, data: { task } }));
      if (url.endsWith(`/projects/${projectId}/tasks`)) return Promise.resolve(jsonResponse({ success: true, data: { tasks: [updatedTask] } }));
      if (url.endsWith("/tasks")) return Promise.resolve(jsonResponse({ success: true, data: { tasks: [] } }));
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp(`/tasks/${taskId}`);

    fireEvent.change(await screen.findByLabelText("Task title"), { target: { value: updatedTask.title } });
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "REVIEW" } });
    fireEvent.change(screen.getByLabelText("Priority"), { target: { value: "URGENT" } });
    fireEvent.click(screen.getByRole("button", { name: "Save task" }));

    expect(await screen.findByText("Saved")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/tasks/${taskId}`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("requires confirmation before task deletion", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const base = baseResponse(input);
      if (base) return Promise.resolve(base);
      const url = String(input);
      if (url.endsWith(`/tasks/${taskId}`) && init?.method === "DELETE") {
        return Promise.resolve(jsonResponse({ success: true, data: { message: "Task deleted successfully." } }));
      }
      if (url.endsWith(`/tasks/${taskId}`)) return Promise.resolve(jsonResponse({ success: true, data: { task } }));
      if (url.endsWith(`/projects/${projectId}/tasks`)) return Promise.resolve(jsonResponse({ success: true, data: { tasks: [] } }));
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp(`/tasks/${taskId}`);

    fireEvent.click(await screen.findByRole("button", { name: "Delete task" }));

    expect(confirm).toHaveBeenCalledWith(`Delete "${task.title}" permanently?`);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/tasks/${taskId}`,
      expect.objectContaining({ method: "DELETE" }),
    ));
  });

  it("shows assigned work on the My Tasks screen", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(jsonResponse({ success: true, data: { user } }));
      if (url.endsWith("/tasks")) return Promise.resolve(jsonResponse({ success: true, data: { tasks: [task] } }));
      return Promise.resolve(jsonResponse({ success: false }, 404));
    }));

    renderApp("/tasks");

    const heading = await screen.findByRole("heading", { name: "My tasks" });
    expect(heading).toBeVisible();
    const list = await screen.findByRole("list", { name: "Assigned tasks" });
    expect(within(list).getByRole("link", { name: task.title })).toBeVisible();
    expect(within(list).getByText(project.name)).toBeVisible();
    expect(within(list).getByText(/Overdue:/)).toBeVisible();
  });
});
