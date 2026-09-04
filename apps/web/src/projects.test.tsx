import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { createAppQueryClient } from "./lib/query-client";

const user = {
  id: "708fe7a5-4696-43b4-bdf1-4ef5e19f845a",
  name: "Victor Ibrahim",
  email: "victor@example.com",
  avatarUrl: null,
  createdAt: "2026-09-04T06:00:00.000Z",
  updatedAt: "2026-09-04T06:00:00.000Z",
};

const project = {
  id: "f9534ad1-f82a-414f-ae76-b2655d881f6d",
  name: "Website launch",
  description: "Coordinate the launch work.",
  ownerId: user.id,
  createdAt: "2026-09-04T11:30:00.000Z",
  updatedAt: "2026-09-04T11:30:00.000Z",
  owner: { id: user.id, name: user.name, email: user.email, avatarUrl: null },
  board: {
    id: "7a23762d-075d-4c99-a82c-2e2ae7553402",
    name: "Project Board",
    createdAt: "2026-09-04T11:30:00.000Z",
    updatedAt: "2026-09-04T11:30:00.000Z",
  },
  _count: { members: 1 },
  currentUserRole: "OWNER",
} as const;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const renderApp = (initialPath: string) => {
  const queryClient = createAppQueryClient(true);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}><App /></MemoryRouter>
    </QueryClientProvider>,
  );
};

const authResponse = () => jsonResponse({ success: true, data: { user } });

describe("FlowBoard project UI", () => {
  it("clears client authentication and redirects when a protected API returns 401", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      if (String(input).endsWith("/auth/me")) return Promise.resolve(authResponse());
      return Promise.resolve(jsonResponse({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Authentication is required." },
      }, 401));
    }));

    renderApp("/dashboard");

    expect(await screen.findByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
  });

  it("shows real owned and shared project data on the dashboard", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(authResponse());
      if (url.endsWith("/projects")) return Promise.resolve(jsonResponse({ success: true, data: { projects: [project] } }));
      return Promise.resolve(jsonResponse({ success: false }, 503));
    }));

    renderApp("/dashboard");

    expect(await screen.findByRole("heading", { name: project.name })).toBeVisible();
    expect(screen.getByText("Owner")).toBeVisible();
    expect(screen.getByText("1 member")).toBeVisible();
    expect(screen.queryByText("No projects yet")).not.toBeInTheDocument();
  });

  it("creates a project and opens its overview", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(authResponse());
      if (url.endsWith("/projects") && init?.method === "POST") {
        return Promise.resolve(jsonResponse({ success: true, data: { project } }, 201));
      }
      return Promise.resolve(jsonResponse({ success: true, data: { projects: [] } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/projects/new");

    await screen.findByRole("heading", { name: "Create a project" });
    fireEvent.change(screen.getByLabelText("Project name"), { target: { value: project.name } });
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: project.description } });
    fireEvent.click(screen.getByRole("button", { name: "Create project" }));

    expect(await screen.findByRole("heading", { name: project.name, level: 1 })).toBeVisible();
    expect(screen.getByText("Project Board")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/projects",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("updates owner-only project settings", async () => {
    const updatedProject = { ...project, name: "Updated website launch", updatedAt: "2026-09-04T12:30:00.000Z" };
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(authResponse());
      if (url.endsWith(`/projects/${project.id}`) && init?.method === "PATCH") {
        return Promise.resolve(jsonResponse({ success: true, data: { project: updatedProject } }));
      }
      if (url.endsWith(`/projects/${project.id}`)) {
        return Promise.resolve(jsonResponse({ success: true, data: { project } }));
      }
      return Promise.resolve(jsonResponse({ success: true, data: { projects: [updatedProject] } }));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp(`/projects/${project.id}/settings`);

    const nameInput = await screen.findByLabelText("Project name");
    fireEvent.change(nameInput, { target: { value: updatedProject.name } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/projects/${project.id}`,
      expect.objectContaining({ method: "PATCH" }),
    ));
    expect(await screen.findByDisplayValue(updatedProject.name)).toBeVisible();
  });

  it("requires confirmation before deleting an owned project", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(authResponse());
      if (url.endsWith(`/projects/${project.id}`) && init?.method === "DELETE") {
        return Promise.resolve(jsonResponse({ success: true, data: { message: "Project deleted successfully." } }));
      }
      if (url.endsWith(`/projects/${project.id}`)) return Promise.resolve(jsonResponse({ success: true, data: { project } }));
      if (url.endsWith("/projects")) return Promise.resolve(jsonResponse({ success: true, data: { projects: [] } }));
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp(`/projects/${project.id}/settings`);

    fireEvent.click(await screen.findByRole("button", { name: "Delete project" }));

    expect(confirm).toHaveBeenCalled();
    expect(await screen.findByRole("heading", { name: "My projects" })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/projects/${project.id}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
