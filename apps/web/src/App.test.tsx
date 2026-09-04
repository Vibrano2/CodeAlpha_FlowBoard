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

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const unauthenticatedResponse = () =>
  jsonResponse(
    { success: false, error: { code: "UNAUTHENTICATED", message: "Authentication is required." } },
    401,
  );

const renderApp = (initialPath: string) => {
  const queryClient = createAppQueryClient(true);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}><App /></MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("FlowBoard authentication flow", () => {
  it("redirects an unauthenticated visitor from the dashboard to login", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(unauthenticatedResponse()));
    renderApp("/dashboard");
    expect(await screen.findByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
  });

  it("renders the protected dashboard using the authenticated user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        if (String(input).endsWith("/auth/me")) {
          return Promise.resolve(jsonResponse({ success: true, data: { user } }));
        }
        if (String(input).endsWith("/projects")) {
          return Promise.resolve(jsonResponse({ success: true, data: { projects: [] } }));
        }

        return Promise.resolve(jsonResponse({
          success: true,
          data: { status: "ok", service: "flowboard-api", database: "connected", timestamp: new Date().toISOString(), uptime: 1 },
        }));
      }),
    );

    renderApp("/dashboard");
    expect(await screen.findByRole("heading", { name: "Welcome, Victor" })).toBeVisible();
    expect(screen.getByText("victor@example.com")).toBeVisible();
    expect(await screen.findByText("No projects yet")).toBeVisible();
    expect(await screen.findByText("API and database connected")).toBeVisible();
  });

  it("updates the signed-in user's profile and refreshes the shell identity", async () => {
    const updatedUser = {
      ...user,
      name: "Victor David",
      email: "victor.david@example.com",
      updatedAt: "2026-09-04T21:00:00.000Z",
    };
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(jsonResponse({ success: true, data: { user } }));
      }
      if (url.endsWith("/users/me") && init?.method === "PATCH") {
        return Promise.resolve(jsonResponse({ success: true, data: { user: updatedUser } }));
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);

    renderApp("/profile");
    fireEvent.change(await screen.findByLabelText("Display name"), {
      target: { value: updatedUser.name },
    });
    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: updatedUser.email },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Profile updated");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me",
      expect.objectContaining({ method: "PATCH", credentials: "include" }),
    );
    expect(screen.getAllByText(updatedUser.email).length).toBeGreaterThan(0);
  });

  it("logs in and navigates to the protected dashboard", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(unauthenticatedResponse());
      if (url.endsWith("/auth/login")) return Promise.resolve(jsonResponse({ success: true, data: { user } }));
      if (url.endsWith("/projects")) return Promise.resolve(jsonResponse({ success: true, data: { projects: [] } }));

      return Promise.resolve(jsonResponse({
        success: true,
        data: { status: "ok", service: "flowboard-api", database: "connected", timestamp: new Date().toISOString(), uptime: 1 },
      }));
    });
    vi.stubGlobal("fetch", fetchMock);

    renderApp("/login");
    await screen.findByRole("heading", { name: "Sign in to your workspace" });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Secure123" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: "Welcome, Victor" })).toBeVisible();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/auth/login",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("validates password confirmation before registration", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(unauthenticatedResponse()));
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/register");

    await screen.findByRole("heading", { name: "Create your account" });
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: user.name } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Secure123" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "Different123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("logs out, clears client session state, and returns to login", async () => {
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) return Promise.resolve(jsonResponse({ success: true, data: { user } }));
      if (url.endsWith("/auth/logout")) return Promise.resolve(jsonResponse({ success: true, data: { message: "Logged out successfully." } }));
      if (url.endsWith("/projects")) return Promise.resolve(jsonResponse({ success: true, data: { projects: [] } }));
      return Promise.resolve(jsonResponse({ success: false }, 503));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderApp("/dashboard");

    const signOutButtons = await screen.findAllByRole("button", { name: "Sign out" });
    fireEvent.click(signOutButtons[0]!);
    expect(await screen.findByRole("heading", { name: "Sign in to your workspace" })).toBeVisible();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/auth/logout",
      expect.objectContaining({ method: "POST" }),
    ));
  });
});
