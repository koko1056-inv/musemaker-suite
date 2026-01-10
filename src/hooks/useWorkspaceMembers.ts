import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./useWorkspace";
import { toast } from "sonner";
import { useCallback } from "react";

interface WorkspaceMember {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string;
  name: string;
  email: string;
  initials: string;
}

interface WorkspaceInvitation {
  id: string;
  email: string;
  role: "owner" | "admin" | "member";
  expires_at: string;
  created_at: string;
}

export const useWorkspaceMembers = () => {
  const { workspace, isAdmin } = useWorkspace();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["workspace-members", workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];

      const { data: workspaceMembers, error } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", workspace.id);

      if (error) throw error;

      const memberIds = workspaceMembers.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", memberIds);

      return workspaceMembers.map((member): WorkspaceMember => {
        const profile = profiles?.find((p) => p.id === member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          created_at: member.created_at,
          name:
            profile?.full_name ||
            profile?.email?.split("@")[0] ||
            "Unknown",
          email: profile?.email || "",
          initials: (profile?.full_name || profile?.email || "U")
            .slice(0, 2)
            .toUpperCase(),
        };
      });
    },
    enabled: !!workspace?.id,
    staleTime: 60000,
  });

  const invitationsQuery = useQuery({
    queryKey: ["workspace-invitations", workspace?.id],
    queryFn: async () => {
      if (!workspace?.id) return [];

      const { data, error } = await supabase
        .from("workspace_invitations")
        .select("id, email, role, expires_at, created_at")
        .eq("workspace_id", workspace.id)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WorkspaceInvitation[];
    },
    enabled: !!workspace?.id && isAdmin,
    staleTime: 60000,
  });

  const inviteMutation = useMutation({
    mutationFn: async ({
      email,
      role,
    }: {
      email: string;
      role: "admin" | "member";
    }) => {
      if (!workspace?.id) throw new Error("ワークスペースが見つかりません");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("認証が必要です");

      const { error } = await supabase.from("workspace_invitations").insert({
        workspace_id: workspace.id,
        email: email.toLowerCase().trim(),
        role,
        invited_by: user.id,
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error("このメールアドレスにはすでに招待を送信済みです");
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("招待を送信しました");
      queryClient.invalidateQueries({
        queryKey: ["workspace-invitations", workspace?.id],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "招待の送信に失敗しました");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({
      memberId,
      newRole,
    }: {
      memberId: string;
      newRole: "admin" | "member";
    }) => {
      const { data, error } = await supabase.rpc("update_member_role", {
        p_member_id: memberId,
        p_new_role: newRole,
      });

      if (error) throw error;
      if (!data) throw new Error("役割の変更に失敗しました");
    },
    onMutate: async ({ memberId, newRole }) => {
      await queryClient.cancelQueries({
        queryKey: ["workspace-members", workspace?.id],
      });

      const previousMembers = queryClient.getQueryData<WorkspaceMember[]>([
        "workspace-members",
        workspace?.id,
      ]);

      queryClient.setQueryData<WorkspaceMember[]>(
        ["workspace-members", workspace?.id],
        (old) =>
          old?.map((m) =>
            m.id === memberId ? { ...m, role: newRole } : m
          )
      );

      return { previousMembers };
    },
    onSuccess: () => {
      toast.success("役割を変更しました");
    },
    onError: (error: Error, _, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          ["workspace-members", workspace?.id],
          context.previousMembers
        );
      }
      toast.error(error.message || "役割の変更に失敗しました");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspace?.id],
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { data, error } = await supabase.rpc("remove_workspace_member", {
        p_member_id: memberId,
      });

      if (error) throw error;
      if (!data) throw new Error("メンバーの削除に失敗しました");
    },
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({
        queryKey: ["workspace-members", workspace?.id],
      });

      const previousMembers = queryClient.getQueryData<WorkspaceMember[]>([
        "workspace-members",
        workspace?.id,
      ]);

      queryClient.setQueryData<WorkspaceMember[]>(
        ["workspace-members", workspace?.id],
        (old) => old?.filter((m) => m.id !== memberId)
      );

      return { previousMembers };
    },
    onSuccess: () => {
      toast.success("メンバーを削除しました");
    },
    onError: (error: Error, _, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(
          ["workspace-members", workspace?.id],
          context.previousMembers
        );
      }
      toast.error(error.message || "メンバーの削除に失敗しました");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", workspace?.id],
      });
    },
  });

  const cancelInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("workspace_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;
    },
    onMutate: async (invitationId) => {
      await queryClient.cancelQueries({
        queryKey: ["workspace-invitations", workspace?.id],
      });

      const previousInvitations = queryClient.getQueryData<
        WorkspaceInvitation[]
      >(["workspace-invitations", workspace?.id]);

      queryClient.setQueryData<WorkspaceInvitation[]>(
        ["workspace-invitations", workspace?.id],
        (old) => old?.filter((i) => i.id !== invitationId)
      );

      return { previousInvitations };
    },
    onSuccess: () => {
      toast.success("招待をキャンセルしました");
    },
    onError: (error: Error, _, context) => {
      if (context?.previousInvitations) {
        queryClient.setQueryData(
          ["workspace-invitations", workspace?.id],
          context.previousInvitations
        );
      }
      toast.error("招待のキャンセルに失敗しました");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-invitations", workspace?.id],
      });
    },
  });

  const refetch = useCallback(() => {
    membersQuery.refetch();
    invitationsQuery.refetch();
  }, [membersQuery, invitationsQuery]);

  return {
    members: membersQuery.data ?? [],
    invitations: invitationsQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    isLoadingInvitations: invitationsQuery.isLoading,
    invite: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    updateRole: updateRoleMutation.mutateAsync,
    isUpdatingRole: updateRoleMutation.isPending,
    removeMember: removeMemberMutation.mutateAsync,
    isRemovingMember: removeMemberMutation.isPending,
    cancelInvitation: cancelInvitationMutation.mutateAsync,
    isCancellingInvitation: cancelInvitationMutation.isPending,
    refetch,
    isAdmin,
  };
};
