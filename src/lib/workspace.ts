import { supabase } from "@/integrations/supabase/client";

export const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Ensures the current user is a member of the demo workspace.
 * This is called before operations that require workspace membership.
 */
export async function ensureDemoWorkspaceMembership(): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const { error } = await supabase.from("workspace_members").insert({
      user_id: user.id,
      workspace_id: DEMO_WORKSPACE_ID,
      role: "owner",
    });

    if (error) {
      // Ignore duplicate membership error
      if (!String(error.message || "").toLowerCase().includes("duplicate")) {
        console.warn("Failed to ensure demo workspace membership:", error);
      }
    }
  } catch (error) {
    console.warn("Failed to ensure demo workspace membership:", error);
  }
}
