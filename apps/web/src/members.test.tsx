import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createAppQueryClient } from "./lib/query-client";

const owner = {
  id: "708fe7a5-4696-43b4-bdf1-4ef5e19f845a",
  name: "Victor Ibrahim",
  email: "victor@example.com",
  avatarUrl: null,
  createdAt: "2026-09-04T06:00:00.000Z",
  updatedAt: "2026-09-04T06:00:00.000Z",
};

const projectId = "f9534ad1-f82a-414f-ae76-b2655d881f6d";
const project = {
  id: projectId,
  name: "Website launch",
  description: "Coordinate the launch work.",
  ownerId: owner.id,
  createdAt: "2026-09-04T11:30:00.000Z",
  updatedAt: "2026-09-04T11:30:00.000Z",
  owner: { id: owner.id, name: owner.name, email: owner.email, avatarUrl: null },
  board: null,
  _count: { members: 2 },
  currentUserRole: "OWNER",
} as const;

const ownerMembership = {
  id: "30ca9548-01ed-40fe-aa50-84ce190e8dfa",
  projectId,
  userId: owner.id,
  role: "OWNER",
  joinedAt: "2026-09-04T11:30:00.000Z",
  user: project.owner,
} as const;

const memberUser = {
  id: "d5f6070d-d0bb-4cf1-86dc-680fcfe0556d",
  name: "Amina Bello",
  email: "amina@example.com",
  avatarUrl: null,
};

const memberMembership = {
  id: "f8c9466b-8c7c-4b85-b418-e11806c7387e",
  projectId,
  userId: memberUser.id,
  role: "MEMBER",
  joinedAt: "2026-09-04T12:00:00.000Z",
  user: memberUser,
} as const;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const renderMembers = () => {
  const queryClient = createAppQueryClient(true);
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/${projectId}/members`]}><App /></MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("FlowBoard project members UI", () => {
  it("shows members and owner-only management controls", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(jsonResponse({ success: true, data: { user: owner } }));
      if (url.endsWith(`/projects/${projectId}/members`)) return Promise.resolve(jsonResponse({ success: true, data: { members: [ownerMembership, memberMembership] } }));
      if (url.endsWith(`/projects/${projectId}`)) return Promise.resolve(jsonResponse({ success: true, data: { project } }));
      return Promise.resolve(jsonResponse({ success: true, data: { projects: [project] } }));
    }));

    renderMembers();

    expect(await screen.findByRole("heading", { name: "Project members" })).toBeVisible();
    expect(screen.getAllByText(owner.name).length).toBeGreaterThan(0);
    expect(screen.getByText(memberUser.name)).toBeVisible();
    expect(screen.getByRole("button", { name: `Remove ${memberUser.name}` })).toBeVisible();
    expect(screen.queryByRole("button", { name: `Remove ${owner.name}` })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search users" })).toBeVisible();
  });

  it("searches registered users and adds a member", async () => {
    let members: Array<typeof ownerMembership | typeof memberMembership> = [ownerMembership];
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(jsonResponse({ success: true, data: { user: owner } }));
      if (url.includes("/users/search?email=")) return Promise.resolve(jsonResponse({ success: true, data: { users: [memberUser] } }));
      if (url.endsWith(`/projects/${projectId}/members`) && init?.method === "POST") {
        members = [ownerMembership, memberMembership];
        return Promise.resolve(jsonResponse({ success: true, data: { member: memberMembership } }, 201));
      }
      if (url.endsWith(`/projects/${projectId}/members`)) return Promise.resolve(jsonResponse({ success: true, data: { members } }));
      if (url.endsWith(`/projects/${projectId}`)) return Promise.resolve(jsonResponse({ success: true, data: { project: { ...project, _count: { members: members.length } } } }));
      return Promise.resolve(jsonResponse({ success: true, data: { projects: [] } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderMembers();

    const emailInput = await screen.findByLabelText("User email");
    fireEvent.change(emailInput, { target: { value: memberUser.email } });
    fireEvent.click(screen.getByRole("button", { name: "Search users" }));
    fireEvent.click(await screen.findByRole("button", { name: "Add" }));

    expect(await screen.findByText(memberUser.name)).toBeVisible();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/projects/${projectId}/members`,
      expect.objectContaining({ method: "POST" }),
    ));
  });

  it("confirms removal and refreshes the member list", async () => {
    let members: Array<typeof ownerMembership | typeof memberMembership> = [ownerMembership, memberMembership];
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(jsonResponse({ success: true, data: { user: owner } }));
      if (url.endsWith(`/members/${memberUser.id}`) && init?.method === "DELETE") {
        members = [ownerMembership];
        return Promise.resolve(jsonResponse({ success: true, data: { message: "Project member removed successfully." } }));
      }
      if (url.endsWith(`/projects/${projectId}/members`)) return Promise.resolve(jsonResponse({ success: true, data: { members } }));
      if (url.endsWith(`/projects/${projectId}`)) return Promise.resolve(jsonResponse({ success: true, data: { project: { ...project, _count: { members: members.length } } } }));
      return Promise.resolve(jsonResponse({ success: true, data: { projects: [] } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderMembers();

    fireEvent.click(await screen.findByRole("button", { name: `Remove ${memberUser.name}` }));

    await waitFor(() => expect(screen.queryByText(memberUser.name)).not.toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/projects/${projectId}/members/${memberUser.id}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("hides management actions from regular members", async () => {
    const memberProject = { ...project, currentUserRole: "MEMBER" } as const;
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(jsonResponse({ success: true, data: { user: owner } }));
      if (url.endsWith(`/projects/${projectId}/members`)) return Promise.resolve(jsonResponse({ success: true, data: { members: [ownerMembership, memberMembership] } }));
      if (url.endsWith(`/projects/${projectId}`)) return Promise.resolve(jsonResponse({ success: true, data: { project: memberProject } }));
      return Promise.resolve(jsonResponse({ success: true, data: { projects: [] } }));
    }));

    renderMembers();

    expect(await screen.findByText("Only the project owner can add or remove members.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Search users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: `Remove ${memberUser.name}` })).not.toBeInTheDocument();
  });
});
