import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpsert = vi.fn();
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }));
const mockGetUser = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  ensureDemoWorkspaceMembership,
  DEMO_WORKSPACE_ID,
} from "./workspace";

describe("ensureDemoWorkspaceMembership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports the expected demo workspace id", () => {
    expect(DEMO_WORKSPACE_ID).toBe("00000000-0000-0000-0000-000000000001");
  });

  it("does nothing when no user is authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await ensureDemoWorkspaceMembership();

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("upserts workspace membership for an authenticated user", async () => {
    const fakeUser = { id: "user-123", email: "test@example.com" };
    mockGetUser.mockResolvedValue({
      data: { user: fakeUser },
      error: null,
    });

    mockUpsert.mockResolvedValue({ data: null, error: null });

    await ensureDemoWorkspaceMembership();

    expect(mockFrom).toHaveBeenCalledWith("workspace_members");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        user_id: "user-123",
        workspace_id: DEMO_WORKSPACE_ID,
        role: "owner",
      },
      { onConflict: "user_id,workspace_id" }
    );
  });

  it("catches and warns on errors without throwing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    mockGetUser.mockRejectedValue(new Error("Network error"));

    await expect(ensureDemoWorkspaceMembership()).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to ensure demo workspace membership:",
      expect.any(Error)
    );
  });
});
