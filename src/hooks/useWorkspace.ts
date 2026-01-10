import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  elevenlabs_api_key: string | null;
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  google_client_id: string | null;
  google_client_secret: string | null;
  google_refresh_token: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkspaceMember {
  workspace_id: string;
  role: string;
}

export const useWorkspace = () => {
  const { user, isAuthenticated } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const DEMO_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

  // Fetch the user's workspace
  useEffect(() => {
    const fetchWorkspace = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Get the user's workspace membership
        let { data: memberData, error: memberError } = await supabase
          .from("workspace_members")
          .select("workspace_id, role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (memberError) {
          console.error("Error fetching workspace membership:", memberError);
          setIsLoading(false);
          return;
        }

        // If the user has no workspace yet, auto-join the demo workspace (current UI assumes this).
        if (!memberData) {
          const { data: insertedMember, error: insertError } = await supabase
            .from("workspace_members")
            .insert({
              user_id: user.id,
              workspace_id: DEMO_WORKSPACE_ID,
              role: "owner",
            })
            .select("workspace_id, role")
            .maybeSingle();

          if (insertError) {
            console.error("Error creating demo workspace membership:", insertError);
            setIsLoading(false);
            return;
          }

          memberData = insertedMember;
        }

        if (!memberData) {
          setIsLoading(false);
          return;
        }

        setUserRole(memberData.role);

        // Fetch the workspace details
        const { data: workspaceData, error: workspaceError } = await supabase
          .from("workspaces")
          .select("*")
          .eq("id", memberData.workspace_id)
          .maybeSingle();

        if (workspaceError) {
          console.error("Error fetching workspace:", workspaceError);
        } else {
          setWorkspace(workspaceData);
        }
      } catch (error) {
        console.error("Error in fetchWorkspace:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspace();
  }, [user]);

  // Update workspace info
  const updateWorkspace = async (updates: Partial<Pick<Workspace, "name" | "slug">>) => {
    if (!workspace) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspace.id);

      if (error) {
        console.error("Error updating workspace:", error);
        toast.error("ワークスペースの更新に失敗しました");
        return false;
      }

      setWorkspace({ ...workspace, ...updates });
      toast.success("ワークスペースを更新しました");
      return true;
    } catch (error) {
      console.error("Error in updateWorkspace:", error);
      toast.error("エラーが発生しました");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Update ElevenLabs API key
  const updateElevenLabsApiKey = async (apiKey: string) => {
    if (!workspace) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({
          elevenlabs_api_key: apiKey,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspace.id);

      if (error) {
        console.error("Error updating API key:", error);
        toast.error("APIキーの保存に失敗しました");
        return false;
      }

      setWorkspace({ ...workspace, elevenlabs_api_key: apiKey });
      toast.success("ElevenLabs APIキーを保存しました");
      return true;
    } catch (error) {
      console.error("Error in updateElevenLabsApiKey:", error);
      toast.error("エラーが発生しました");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Update Twilio credentials
  const updateTwilioCredentials = async (accountSid: string, authToken: string) => {
    if (!workspace) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({
          twilio_account_sid: accountSid,
          twilio_auth_token: authToken,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspace.id);

      if (error) {
        console.error("Error updating Twilio credentials:", error);
        toast.error("Twilio認証情報の保存に失敗しました");
        return false;
      }

      setWorkspace({ ...workspace, twilio_account_sid: accountSid, twilio_auth_token: authToken });
      toast.success("Twilio認証情報を保存しました");
      return true;
    } catch (error) {
      console.error("Error in updateTwilioCredentials:", error);
      toast.error("エラーが発生しました");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Update Google Calendar credentials
  const updateGoogleCalendarCredentials = async (clientId: string, clientSecret: string) => {
    if (!workspace) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("workspaces")
        .update({
          google_client_id: clientId,
          google_client_secret: clientSecret,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workspace.id);

      if (error) {
        console.error("Error updating Google Calendar credentials:", error);
        toast.error("Google Calendar認証情報の保存に失敗しました");
        return false;
      }

      setWorkspace({ ...workspace, google_client_id: clientId, google_client_secret: clientSecret });
      toast.success("Google Calendar認証情報を保存しました");
      return true;
    } catch (error) {
      console.error("Error in updateGoogleCalendarCredentials:", error);
      toast.error("エラーが発生しました");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Check if user is admin
  const isAdmin = userRole === "admin" || userRole === "owner";

  return {
    workspace,
    isLoading,
    isSaving,
    userRole,
    isAdmin,
    updateWorkspace,
    updateElevenLabsApiKey,
    updateTwilioCredentials,
    updateGoogleCalendarCredentials,
    isAuthenticated,
  };
};
