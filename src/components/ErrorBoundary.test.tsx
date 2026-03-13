import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

// A component that throws on render so we can exercise the boundary
function ThrowingChild({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Child content</div>;
}

describe("ErrorBoundary", () => {
  // Suppress React's console.error for caught errors during tests
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders the default fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(
      screen.getByText("エラーが発生しました")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "予期しないエラーが発生しました。ページを再読み込みしてください。"
      )
    ).toBeInTheDocument();
    expect(screen.getByText("再読み込み")).toBeInTheDocument();
  });

  it("renders a custom fallback when provided", () => {
    const customFallback = <div>Custom error fallback</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error fallback")).toBeInTheDocument();
    // The default UI should NOT be shown
    expect(
      screen.queryByText("エラーが発生しました")
    ).not.toBeInTheDocument();
  });

  it("logs the error via console.error", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      "Uncaught error:",
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });
});
