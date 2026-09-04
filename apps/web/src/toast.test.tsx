import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "./components/toast";

const TriggerButton = ({ message, tone }: { message: string; tone?: "success" | "error" }) => {
  const { showToast } = useToast();
  return (
    <button type="button" onClick={() => showToast(message, tone)}>
      Trigger toast
    </button>
  );
};

describe("Toast notifications", () => {
  it("shows a success toast and allows dismissing it", async () => {
    render(
      <ToastProvider>
        <TriggerButton message="Project created." />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger toast" }));

    expect(await screen.findByText("Project created.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));

    await waitFor(() => {
      expect(screen.queryByText("Project created.")).not.toBeInTheDocument();
    });
  });

  it("visually distinguishes error toasts", async () => {
    render(
      <ToastProvider>
        <TriggerButton message="Something went wrong." tone="error" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Trigger toast" }));

    const message = await screen.findByText("Something went wrong.");
    expect(message.closest("div")).toHaveClass("border-red-200");
  });

  it("throws when useToast is used outside of a provider", () => {
    const ThrowingComponent = () => {
      useToast();
      return null;
    };

    expect(() => render(<ThrowingComponent />)).toThrow(
      "useToast must be used within a ToastProvider.",
    );
  });
});
