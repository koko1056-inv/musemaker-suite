import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Set up mock functions at module scope (before vi.mock hoisting)
const mockOrder = vi.fn();
const mockSelect = vi.fn(() => ({ order: mockOrder }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockUpdate = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => {
      const result = mockFrom(...args);
      return {
        ...result,
        update: mockUpdate,
      };
    },
  },
}));

vi.mock("sonner", () => ({
  toast: vi.fn(),
}));

import { useConversations } from "./useConversations";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const fakeConversations = [
  {
    id: "conv-1",
    agent_id: "agent-1",
    phone_number: "+1234567890",
    status: "completed",
    duration_seconds: 120,
    transcript: [
      { role: "agent", text: "Hello" },
      { role: "user", text: "Hi" },
    ],
    outcome: "resolved",
    started_at: "2025-01-01T00:00:00Z",
    ended_at: "2025-01-01T00:02:00Z",
    audio_url: null,
    summary: "A test conversation",
    key_points: ["point 1"],
    is_read: false,
    metadata: { call_type: "inbound", sentiment: "positive" },
    agent: { name: "Test Agent" },
    extracted_data: [],
  },
  {
    id: "conv-2",
    agent_id: "agent-2",
    phone_number: null,
    status: "completed",
    duration_seconds: 60,
    transcript: "not-an-array",
    outcome: null,
    started_at: "2025-01-02T00:00:00Z",
    ended_at: "2025-01-02T00:01:00Z",
    audio_url: null,
    summary: null,
    key_points: "also-not-array",
    is_read: true,
    metadata: null,
    agent: { name: "Agent Two" },
    extracted_data: [],
  },
  {
    id: "conv-outbound",
    agent_id: "agent-1",
    phone_number: "+9876543210",
    status: "completed",
    duration_seconds: 30,
    transcript: [],
    outcome: null,
    started_at: "2025-01-03T00:00:00Z",
    ended_at: "2025-01-03T00:00:30Z",
    audio_url: null,
    summary: null,
    key_points: [],
    is_read: true,
    metadata: { call_type: "outbound" },
    agent: { name: "Test Agent" },
    extracted_data: [],
  },
];

describe("useConversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches conversations and filters out outbound calls", async () => {
    mockOrder.mockResolvedValue({ data: fakeConversations, error: null });

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.conversations).toHaveLength(2);
    expect(
      result.current.conversations.find((c) => c.id === "conv-outbound")
    ).toBeUndefined();
    expect(result.current.conversations[0].id).toBe("conv-1");
    expect(result.current.conversations[1].id).toBe("conv-2");
  });

  it("transforms non-array transcript and key_points to empty arrays", async () => {
    mockOrder.mockResolvedValue({ data: fakeConversations, error: null });

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const conv2 = result.current.conversations.find((c) => c.id === "conv-2");
    expect(conv2).toBeDefined();
    expect(conv2!.transcript).toEqual([]);
    expect(conv2!.key_points).toEqual([]);
  });

  it("preserves valid transcript and key_points arrays", async () => {
    mockOrder.mockResolvedValue({ data: fakeConversations, error: null });

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const conv1 = result.current.conversations.find((c) => c.id === "conv-1");
    expect(conv1).toBeDefined();
    expect(conv1!.transcript).toEqual([
      { role: "agent", text: "Hello" },
      { role: "user", text: "Hi" },
    ]);
    expect(conv1!.key_points).toEqual(["point 1"]);
  });

  it("computes unreadCount correctly", async () => {
    mockOrder.mockResolvedValue({ data: fakeConversations, error: null });

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.unreadCount).toBe(1);
  });

  it("returns empty conversations on supabase error", async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: "Some DB error" } });

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 3000 });

    expect(result.current.conversations).toEqual([]);
  });
});
