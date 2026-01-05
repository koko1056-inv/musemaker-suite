import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PhoneNumber {
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
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const fetchPhoneNumbers = async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("twilio-phone-numbers", {
        body: { action: "list", workspaceId },
      });

      if (error) throw error;
      setPhoneNumbers(data.phoneNumbers || []);
    } catch (error: any) {
      console.error("Error fetching phone numbers:", error);
      toast({
        title: "エラー",
        description: error.message || "電話番号の取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncFromTwilio = async () => {
    if (!workspaceId) return;

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("twilio-phone-numbers", {
        body: { action: "list", workspaceId },
      });

      if (error) throw error;
      setPhoneNumbers(data.phoneNumbers || []);
      toast({
        title: "同期完了",
        description: "Twilioから電話番号を同期しました",
      });
    } catch (error: any) {
      console.error("Error syncing phone numbers:", error);
      toast({
        title: "エラー",
        description: error.message || "同期に失敗しました",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const assignToAgent = async (phoneNumberSid: string, agentId: string) => {
    if (!workspaceId) return;

    try {
      const { error } = await supabase.functions.invoke("twilio-phone-numbers", {
        body: { action: "assign", workspaceId, phoneNumberSid, agentId },
      });

      if (error) throw error;

      setPhoneNumbers((prev) =>
        prev.map((p) =>
          p.phone_number_sid === phoneNumberSid ? { ...p, agent_id: agentId } : p
        )
      );

      toast({
        title: "割り当て完了",
        description: "電話番号をエージェントに割り当てました",
      });
    } catch (error: any) {
      console.error("Error assigning phone number:", error);
      toast({
        title: "エラー",
        description: error.message || "割り当てに失敗しました",
        variant: "destructive",
      });
    }
  };

  const unassignFromAgent = async (phoneNumberSid: string) => {
    if (!workspaceId) return;

    try {
      const { error } = await supabase.functions.invoke("twilio-phone-numbers", {
        body: { action: "unassign", workspaceId, phoneNumberSid },
      });

      if (error) throw error;

      setPhoneNumbers((prev) =>
        prev.map((p) =>
          p.phone_number_sid === phoneNumberSid ? { ...p, agent_id: null, agents: null } : p
        )
      );

      toast({
        title: "解除完了",
        description: "電話番号の割り当てを解除しました",
      });
    } catch (error: any) {
      console.error("Error unassigning phone number:", error);
      toast({
        title: "エラー",
        description: error.message || "解除に失敗しました",
        variant: "destructive",
      });
    }
  };

  const updateLabel = async (phoneNumberSid: string, label: string) => {
    if (!workspaceId) return;

    try {
      const { error } = await supabase.functions.invoke("twilio-phone-numbers", {
        body: { action: "updateLabel", workspaceId, phoneNumberSid, label },
      });

      if (error) throw error;

      setPhoneNumbers((prev) =>
        prev.map((p) =>
          p.phone_number_sid === phoneNumberSid ? { ...p, label } : p
        )
      );

      toast({
        title: "更新完了",
        description: "ラベルを更新しました",
      });
    } catch (error: any) {
      console.error("Error updating label:", error);
      toast({
        title: "エラー",
        description: error.message || "更新に失敗しました",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchPhoneNumbers();
    }
  }, [workspaceId]);

  return {
    phoneNumbers,
    isLoading,
    isSyncing,
    syncFromTwilio,
    assignToAgent,
    unassignFromAgent,
    updateLabel,
    refetch: fetchPhoneNumbers,
  };
}
