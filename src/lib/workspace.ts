import { supabase } from "@/integrations/supabase/client";

export const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export async function ensureDemoWorkspaceMembership(): Promise<void> {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    await supabase.from("workspace_members").upsert(
      {
        user_id: user.id,
        workspace_id: DEMO_WORKSPACE_ID,
        role: "owner",
      },
      { onConflict: "user_id,workspace_id" }
    );
  } catch (error) {
    console.warn("Failed to ensure demo workspace membership:", error);
  }
}
