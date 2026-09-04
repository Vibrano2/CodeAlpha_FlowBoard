import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createAppQueryClient } from "./lib/query-client";
import type { Activity, Comment } from "./types/collaboration";
import type { Task } from "./types/task";

const user = {
  id: "708fe7a5-4696-43b4-bdf1-4ef5e19f845a",
  name: "Victor Ibrahim",
  email: "victor@example.com",
  avatarUrl: null,
  createdAt: "2026-09-04T06:00:00.000Z",
  updatedAt: "2026-09-04T06:00:00.000Z",
};

const otherUser = {
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
  board: { id: boardId, name: "Project Board", createdAt: "2026-09-04T11:30:00.000Z", updatedAt: "2026-09-04T11:30:00.000Z" },
  _count: { members: 2 },
  currentUserRole: "OWNER",
} as const;

const task: Task = {
  id: taskId,
  projectId,
  boardId,
  title: "Build the project board",
  description: "Create four accessible Kanban columns.",
  status: "REVIEW",
  priority: "HIGH",
  assigneeId: otherUser.id,
  createdBy: user.id,
  dueDate: null,
  position: 0,
  completedAt: null,
  createdAt: "2026-09-04T14:00:00.000Z",
  updatedAt: "2026-09-04T14:00:00.000Z",
  assignee: otherUser,
  creator: project.owner,
  board: { id: boardId, name: "Project Board" },
  project: { id: projectId, name: project.name },
  _count: { comments: 2 },
};

const ownComment: Comment = {
  id: "a3959ec6-b7d8-4fe3-bc81-113685b0b348",
  taskId,
  userId: user.id,
  content: "The board is ready for review.",
  createdAt: "2026-09-04T18:00:00.000Z",
  updatedAt: "2026-09-04T18:00:00.000Z",
  user: project.owner,
};

const otherComment: Comment = {
  ...ownComment,
  id: "cc1d5794-8b4e-44b0-a18f-50d01332ebed",
  userId: otherUser.id,
  content: "I will verify it today.",
  user: otherUser,
};

const activity: Activity = {
  id: "d155067c-fd24-492f-90ec-cba3ff750738",
  projectId,
  taskId,
  actorId: user.id,
  action: "COMMENT_ADDED",
  metadata: { commentId: ownComment.id },
  createdAt: ownComment.createdAt,
  actor: project.owner,
  task: { id: taskId, title: task.title },
};

const memberships = [
  { id: "30ca9548-01ed-40fe-aa50-84ce190e8dfa", projectId, userId: user.id, role: "OWNER", joinedAt: project.createdAt, user: project.owner },
  { id: "f8c9466b-8c7c-4b85-b418-e11806c7387e", projectId, userId: otherUser.id, role: "MEMBER", joinedAt: project.createdAt, user: otherUser },
] as const;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const renderApp = (path: string) => render(
  <QueryClientProvider client={createAppQueryClient(true)}>
    <MemoryRouter initialEntries={[path]}><App /></MemoryRouter>
  </QueryClientProvider>,
);

const detailBaseResponse = (input: RequestInfo | URL) => {
  const url = String(input);
  if (url.endsWith("/auth/me")) return jsonResponse({ success: true, data: { user } });
  if (url.endsWith(`/tasks/${taskId}`)) return jsonResponse({ success: true, data: { task } });
  if (url.endsWith(`/projects/${projectId}/members`)) return jsonResponse({ success: true, data: { members: memberships } });
  if (url.endsWith(`/projects/${projectId}`)) return jsonResponse({ success: true, data: { project } });
  if (url.includes(`/projects/${projectId}/activity`)) return jsonResponse({ success: true, data: { activities: [activity] } });
  return null;
};

describe("FlowBoard comments and activity UI", () => {
  it("shows task comments, activity, and author-only controls", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const base = detailBaseResponse(input);
      if (base) return Promise.resolve(base);
      if (String(input).endsWith(`/tasks/${taskId}/comments`)) return Promise.resolve(jsonResponse({ success: true, data: { comments: [ownComment, otherComment] } }));
      return Promise.resolve(jsonResponse({ success: false }, 404));
    }));

    renderApp(`/tasks/${taskId}`);

    expect(await screen.findByText(ownComment.content)).toBeVisible();
    expect(screen.getByText(otherComment.content)).toBeVisible();
    expect(screen.getByRole("button", { name: `Edit comment by ${user.name}` })).toBeVisible();
    expect(screen.getByRole("button", { name: `Delete comment by ${user.name}` })).toBeVisible();
    expect(screen.queryByRole("button", { name: `Edit comment by ${otherUser.name}` })).not.toBeInTheDocument();
    expect(screen.getByText(/added a comment/)).toBeVisible();
  });

  it("adds a trimmed comment and renders it immediately", async () => {
    const newComment = { ...ownComment, content: "Please review the mobile layout." };
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const base = detailBaseResponse(input);
      if (base) return Promise.resolve(base);
      const url = String(input);
      if (url.endsWith(`/tasks/${taskId}/comments`) && init?.method === "POST") return Promise.resolve(jsonResponse({ success: true, data: { comment: newComment } }, 201));
      if (url.endsWith(`/tasks/${taskId}/comments`)) return Promise.resolve(jsonResponse({ success: true, data: { comments: [] } }));
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp(`/tasks/${taskId}`);

    const commentInput = await screen.findByLabelText("Add a comment");
    fireEvent.change(commentInput, { target: { value: `  ${newComment.content}  ` } });
    fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

    expect(await screen.findByText(newComment.content)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/tasks/${taskId}/comments`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ content: newComment.content }) }),
    );
  });

  it("edits the signed-in user's own comment", async () => {
    const updatedComment = { ...ownComment, content: "The updated board is ready." };
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const base = detailBaseResponse(input);
      if (base) return Promise.resolve(base);
      const url = String(input);
      if (url.endsWith(`/comments/${ownComment.id}`) && init?.method === "PATCH") return Promise.resolve(jsonResponse({ success: true, data: { comment: updatedComment } }));
      if (url.endsWith(`/tasks/${taskId}/comments`)) return Promise.resolve(jsonResponse({ success: true, data: { comments: [ownComment] } }));
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp(`/tasks/${taskId}`);

    fireEvent.click(await screen.findByRole("button", { name: `Edit comment by ${user.name}` }));
    fireEvent.change(screen.getByLabelText("Edit comment"), { target: { value: updatedComment.content } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByLabelText("Edit comment")).not.toBeInTheDocument());
    expect(screen.getByText(updatedComment.content)).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/comments/${ownComment.id}`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("confirms and deletes the signed-in user's own comment", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const base = detailBaseResponse(input);
      if (base) return Promise.resolve(base);
      const url = String(input);
      if (url.endsWith(`/comments/${ownComment.id}`) && init?.method === "DELETE") return Promise.resolve(jsonResponse({ success: true, data: { message: "Comment deleted successfully." } }));
      if (url.endsWith(`/tasks/${taskId}/comments`)) return Promise.resolve(jsonResponse({ success: true, data: { comments: [ownComment] } }));
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp(`/tasks/${taskId}`);

    fireEvent.click(await screen.findByRole("button", { name: `Delete comment by ${user.name}` }));

    expect(confirm).toHaveBeenCalledWith("Delete this comment?");
    await waitFor(() => expect(screen.queryByText(ownComment.content)).not.toBeInTheDocument());
  });

  it("renders the project activity screen", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(jsonResponse({ success: true, data: { user } }));
      if (url.endsWith(`/projects/${projectId}/activity`)) return Promise.resolve(jsonResponse({ success: true, data: { activities: [activity] } }));
      if (url.endsWith(`/projects/${projectId}`)) return Promise.resolve(jsonResponse({ success: true, data: { project } }));
      return Promise.resolve(jsonResponse({ success: false }, 404));
    }));

    renderApp(`/projects/${projectId}/activity`);

    expect(await screen.findByRole("heading", { name: "Project activity" })).toBeVisible();
    expect(screen.getByText(/added a comment/)).toBeVisible();
    expect(screen.getByRole("link", { name: task.title })).toHaveAttribute("href", `/tasks/${taskId}`);
  });
});
