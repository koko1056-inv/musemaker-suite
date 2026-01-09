import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PhoneNumber {
  id: string;
  phone_number: string;
  phone_number_sid: string;
  label: string | null;
  agent_id: string | null;
  status: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
  };
  created_at: string;
  agents?: {
    id: string;
    name: string;
  } | null;
}

export function usePhoneNumbers(workspaceId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: phoneNumbers = [], isLoading } = useQuery({
    queryKey: ['phone-numbers', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase.functions.invoke('twilio-phone-numbers', {
        body: { action: 'list', workspaceId },
      });

      if (error) throw error;
      return (data.phoneNumbers || []) as PhoneNumber[];
    },
    enabled: !!workspaceId,
    staleTime: 60000, // 1 minute
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { data, error } = await supabase.functions.invoke('twilio-phone-numbers', {
        body: { action: 'list', workspaceId },
      });

      if (error) throw error;
      return (data.phoneNumbers || []) as PhoneNumber[];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['phone-numbers', workspaceId], data);
      toast.success('Twilioから電話番号を同期しました');
    },
    onError: (error: Error) => {
      console.error('Error syncing phone numbers:', error);
      toast.error(error.message || '同期に失敗しました');
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ phoneNumberSid, agentId }: { phoneNumberSid: string; agentId: string }) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { error } = await supabase.functions.invoke('twilio-phone-numbers', {
        body: { action: 'assign', workspaceId, phoneNumberSid, agentId },
      });

      if (error) throw error;
      return { phoneNumberSid, agentId };
    },
    onSuccess: ({ phoneNumberSid, agentId }) => {
      queryClient.setQueryData<PhoneNumber[]>(['phone-numbers', workspaceId], (old) =>
        old?.map((p) =>
          p.phone_number_sid === phoneNumberSid ? { ...p, agent_id: agentId } : p
        )
      );
      toast.success('電話番号をエージェントに割り当てました');
    },
    onError: (error: Error) => {
      console.error('Error assigning phone number:', error);
      toast.error(error.message || '割り当てに失敗しました');
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (phoneNumberSid: string) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { error } = await supabase.functions.invoke('twilio-phone-numbers', {
        body: { action: 'unassign', workspaceId, phoneNumberSid },
      });

      if (error) throw error;
      return phoneNumberSid;
    },
    onSuccess: (phoneNumberSid) => {
      queryClient.setQueryData<PhoneNumber[]>(['phone-numbers', workspaceId], (old) =>
        old?.map((p) =>
          p.phone_number_sid === phoneNumberSid ? { ...p, agent_id: null, agents: null } : p
        )
      );
      toast.success('電話番号の割り当てを解除しました');
    },
    onError: (error: Error) => {
      console.error('Error unassigning phone number:', error);
      toast.error(error.message || '解除に失敗しました');
    },
  });

  const updateLabelMutation = useMutation({
    mutationFn: async ({ phoneNumberSid, label }: { phoneNumberSid: string; label: string }) => {
      if (!workspaceId) throw new Error('Workspace ID required');

      const { error } = await supabase.functions.invoke('twilio-phone-numbers', {
        body: { action: 'updateLabel', workspaceId, phoneNumberSid, label },
      });

      if (error) throw error;
      return { phoneNumberSid, label };
    },
    onSuccess: ({ phoneNumberSid, label }) => {
      queryClient.setQueryData<PhoneNumber[]>(['phone-numbers', workspaceId], (old) =>
        old?.map((p) =>
          p.phone_number_sid === phoneNumberSid ? { ...p, label } : p
        )
      );
      toast.success('ラベルを更新しました');
    },
    onError: (error: Error) => {
      console.error('Error updating label:', error);
      toast.error(error.message || '更新に失敗しました');
    },
  });

  const syncFromTwilio = useCallback(() => syncMutation.mutateAsync(), [syncMutation]);

  const assignToAgent = useCallback(
    (phoneNumberSid: string, agentId: string) =>
      assignMutation.mutateAsync({ phoneNumberSid, agentId }),
    [assignMutation]
  );

  const unassignFromAgent = useCallback(
    (phoneNumberSid: string) => unassignMutation.mutateAsync(phoneNumberSid),
    [unassignMutation]
  );

  const updateLabel = useCallback(
    (phoneNumberSid: string, label: string) =>
      updateLabelMutation.mutateAsync({ phoneNumberSid, label }),
    [updateLabelMutation]
  );

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['phone-numbers', workspaceId] });
  }, [queryClient, workspaceId]);

  return {
    phoneNumbers,
    isLoading,
    isSyncing: syncMutation.isPending,
    syncFromTwilio,
    assignToAgent,
    unassignFromAgent,
    updateLabel,
    refetch,
  };
}
