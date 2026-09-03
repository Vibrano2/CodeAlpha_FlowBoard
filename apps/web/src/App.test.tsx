import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("FlowBoard application shell", () => {
  it("renders real empty states and reports a healthy API connection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              status: "ok",
              service: "flowboard-api",
              database: "connected",
              timestamp: new Date().toISOString(),
              uptime: 1,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("heading", { name: "Welcome to FlowBoard" })).toBeVisible();
    expect(screen.getByText("No projects yet")).toBeVisible();
    expect(await screen.findByText("API and database connected")).toBeVisible();
  });
});
