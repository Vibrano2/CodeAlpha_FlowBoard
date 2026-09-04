import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { ToastProvider } from "./components/toast";
import { createAppQueryClient } from "./lib/query-client";
import type { Notification } from "./types/notification";

const user = {
  id: "708fe7a5-4696-43b4-bdf1-4ef5e19f845a",
  name: "Victor Ibrahim",
  email: "victor@example.com",
  avatarUrl: null,
  createdAt: "2026-09-04T06:00:00.000Z",
  updatedAt: "2026-09-04T06:00:00.000Z",
};

const notification: Notification = {
  id: "fd9fcd20-ff98-4fd3-8945-a0c503b65e09",
  userId: user.id,
  type: "TASK_ASSIGNED",
  title: "New task assignment",
  message: "You were assigned \"Build the project board\" in Website launch.",
  projectId: "f9534ad1-f82a-414f-ae76-b2655d881f6d",
  taskId: "d56d146a-d851-49d4-b205-6397d4a3a789",
  isRead: false,
  createdAt: "2026-09-04T21:00:00.000Z",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const renderNotifications = () => render(
  <QueryClientProvider client={createAppQueryClient(true)}>
    <MemoryRouter initialEntries={["/notifications"]}><ToastProvider><App /></ToastProvider></MemoryRouter>
  </QueryClientProvider>,
);

describe("FlowBoard notifications UI", () => {
  it("shows unread notifications with a related task link", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(jsonResponse({ success: true, data: { user } }));
      }
      if (url.endsWith("/notifications")) {
        return Promise.resolve(jsonResponse({
          success: true,
          data: { notifications: [notification], unreadCount: 1 },
        }));
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    }));

    renderNotifications();

    expect(await screen.findByRole("heading", { name: "Notifications" })).toBeVisible();
    expect(await screen.findByText(notification.message)).toBeVisible();
    expect(screen.getByText("Unread")).toBeVisible();
    expect(screen.getByRole("link", { name: "View task" })).toHaveAttribute(
      "href",
      `/tasks/${notification.taskId}`,
    );
    expect(screen.getAllByLabelText("1 unread notifications").length).toBeGreaterThan(0);
  });

  it("marks one notification as read without a page refresh", async () => {
    const readNotification = { ...notification, isRead: true };
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(jsonResponse({ success: true, data: { user } }));
      }
      if (url.endsWith(`/notifications/${notification.id}/read`) && init?.method === "PATCH") {
        return Promise.resolve(jsonResponse({ success: true, data: { notification: readNotification } }));
      }
      if (url.endsWith("/notifications")) {
        return Promise.resolve(jsonResponse({
          success: true,
          data: { notifications: [notification], unreadCount: 1 },
        }));
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderNotifications();

    fireEvent.click(await screen.findByRole("button", { name: "Mark as read" }));

    await waitFor(() => expect(screen.getByText("Read")).toBeVisible());
    expect(screen.queryByRole("button", { name: "Mark as read" })).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:4000/api/v1/notifications/${notification.id}/read`,
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("marks all notifications as read and renders the empty state", async () => {
    let notifications = [notification];
    const fetchMock = vi.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(jsonResponse({ success: true, data: { user } }));
      }
      if (url.endsWith("/notifications/read-all") && init?.method === "PATCH") {
        notifications = notifications.map((item) => ({ ...item, isRead: true }));
        return Promise.resolve(jsonResponse({ success: true, data: { updatedCount: 1 } }));
      }
      if (url.endsWith("/notifications")) {
        return Promise.resolve(jsonResponse({
          success: true,
          data: { notifications, unreadCount: notifications.some((item) => !item.isRead) ? 1 : 0 },
        }));
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    });
    vi.stubGlobal("fetch", fetchMock);
    renderNotifications();

    fireEvent.click(await screen.findByRole("button", { name: "Mark all as read" }));
    await waitFor(() => expect(screen.getByText("0 unread")).toBeVisible());
    expect(screen.getByText("Read")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Mark all as read" })).not.toBeInTheDocument();
  });

  it("shows an honest empty state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(jsonResponse({ success: true, data: { user } }));
      }
      if (url.endsWith("/notifications")) {
        return Promise.resolve(jsonResponse({
          success: true,
          data: { notifications: [], unreadCount: 0 },
        }));
      }
      return Promise.resolve(jsonResponse({ success: false }, 404));
    }));

    renderNotifications();
    expect(await screen.findByRole("heading", { name: "No notifications yet" })).toBeVisible();
  });
});
