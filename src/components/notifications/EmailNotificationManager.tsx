import { useState, useMemo } from "react";
import { useEmailNotifications } from "@/hooks/useEmailNotifications";
import { useAgents } from "@/hooks/useAgents";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailSettingsForm } from "./EmailSettingsForm";
import { EmailNotificationList } from "./EmailNotificationList";

interface EmailNotificationManagerProps {
  workspaceId: string;
}

export function EmailNotificationManager({ workspaceId }: EmailNotificationManagerProps) {
  const {
    notifications,
    isLoading,
    createNotification,
    updateNotification,
    deleteNotification,
    toggleNotification,
    testEmail,
  } = useEmailNotifications(workspaceId);

  const { agents } = useAgents();

  // 全エージェントの抽出フィールドを取得
  const { data: allExtractionFields = [] } = useQuery({
    queryKey: ["all-extraction-fields-email", workspaceId],
    queryFn: async () => {
      if (!agents || agents.length === 0) return [];

      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .select("field_key, field_name, agent_id")
        .in("agent_id", agents.map(a => a.id));

      if (error) throw error;

      // field_keyでユニークにする
      const uniqueFields = new Map<string, { field_key: string; field_name: string }>();
      data?.forEach(field => {
        if (!uniqueFields.has(field.field_key)) {
          uniqueFields.set(field.field_key, { field_key: field.field_key, field_name: field.field_name });
        }
      });

      return Array.from(uniqueFields.values());
    },
    enabled: !!agents && agents.length > 0,
  });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newNotification, setNewNotification] = useState({
    name: "",
    recipient_email: "",
    notify_on_call_start: false,
    notify_on_call_end: true,
    notify_on_call_failed: true,
    include_summary: true,
    include_transcript: false,
    agent_ids: null as string[] | null,
  });
  const { toast } = useToast();

  // 選択したエージェントの抽出フィールドを取得（編集中の通知用）
  const agentIdsForFields = useMemo(() => {
    if (editingTemplateId) {
      const notification = notifications.find(n => n.id === editingTemplateId);
      return notification?.agent_ids || (agents?.map(a => a.id) || []);
    }
    return newNotification.agent_ids || (agents?.map(a => a.id) || []);
  }, [editingTemplateId, notifications, newNotification.agent_ids, agents]);

  const { data: filteredExtractionFields = [] } = useQuery({
    queryKey: ["extraction-fields-filtered-email", agentIdsForFields],
    queryFn: async () => {
      if (agentIdsForFields.length === 0) return [];

      const { data, error } = await supabase
        .from("agent_extraction_fields")
        .select("field_key, field_name, agent_id")
        .in("agent_id", agentIdsForFields);

      if (error) throw error;

      // field_keyでユニークにする
      const uniqueFields = new Map<string, { field_key: string; field_name: string }>();
      data?.forEach(field => {
        if (!uniqueFields.has(field.field_key)) {
          uniqueFields.set(field.field_key, { field_key: field.field_key, field_name: field.field_name });
        }
      });

      return Array.from(uniqueFields.values());
    },
    enabled: agentIdsForFields.length > 0,
  });

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedKey(variable);
    toast({ title: "コピーしました" });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCreate = async () => {
    if (!newNotification.name || !newNotification.recipient_email) {
      toast({
        title: "入力エラー",
        description: "名前とメールアドレスは必須です",
        variant: "destructive",
      });
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newNotification.recipient_email)) {
      toast({
        title: "入力エラー",
        description: "有効なメールアドレスを入力してください",
        variant: "destructive",
      });
      return;
    }

    await createNotification.mutateAsync(newNotification);

    setNewNotification({
      name: "",
      recipient_email: "",
      notify_on_call_start: false,
      notify_on_call_end: true,
      notify_on_call_failed: true,
      include_summary: true,
      include_transcript: false,
      agent_ids: null,
    });
    setIsCreateOpen(false);
  };

  const handleTest = async (notification: { id: string; recipient_email: string }) => {
    setTestingId(notification.id);
    await testEmail(notification.recipient_email);
    setTestingId(null);
  };

  const handleStartEditEmail = (notification: { id: string; recipient_email: string }) => {
    setEditingEmailId(notification.id);
    setEditingEmailValue(notification.recipient_email);
  };

  const handleSaveEmail = async (id: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingEmailValue)) {
      toast({
        title: "エラー",
        description: "有効なメールアドレスを入力してください",
        variant: "destructive",
      });
      return;
    }
    await updateNotification.mutateAsync({
      id,
      recipient_email: editingEmailValue,
    });
    setEditingEmailId(null);
    setEditingEmailValue("");
  };

  const handleCancelEditEmail = () => {
    setEditingEmailId(null);
    setEditingEmailValue("");
  };

  const handleStartEditTemplate = (notificationId: string, currentTemplate: string | null) => {
    setEditingTemplateId(notificationId);
    setEditingTemplate(currentTemplate || "");
  };

  const handleSaveTemplate = async (notificationId: string) => {
    await updateNotification.mutateAsync({
      id: notificationId,
      message_template: editingTemplate || null,
    });
    setEditingTemplateId(null);
    setEditingTemplate("");
  };

  const handleCancelEditTemplate = () => {
    setEditingTemplateId(null);
    setEditingTemplate("");
  };

  const handleResetTemplate = async (notificationId: string) => {
    await updateNotification.mutateAsync({
      id: notificationId,
      message_template: null,
    });
    setEditingTemplateId(null);
    setEditingTemplate("");
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ヘッダーと追加ボタン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500 rounded-xl">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">メール通知</h3>
            <p className="text-sm text-muted-foreground">
              通話イベントをメールで自動通知
            </p>
          </div>
        </div>
        <EmailSettingsForm
          isCreateOpen={isCreateOpen}
          setIsCreateOpen={setIsCreateOpen}
          newNotification={newNotification}
          setNewNotification={setNewNotification}
          handleCreate={handleCreate}
          createNotificationPending={createNotification.isPending}
        />
      </div>

      {/* 通知リスト */}
      <EmailNotificationList
        notifications={notifications}
        expandedId={expandedId}
        setExpandedId={setExpandedId}
        editingEmailId={editingEmailId}
        editingEmailValue={editingEmailValue}
        editingTemplateId={editingTemplateId}
        editingTemplate={editingTemplate}
        testingId={testingId}
        filteredExtractionFields={filteredExtractionFields}
        updateNotificationPending={updateNotification.isPending}
        toggleNotification={toggleNotification}
        updateNotification={updateNotification}
        deleteNotification={deleteNotification}
        onStartEditEmail={handleStartEditEmail}
        onSaveEmail={handleSaveEmail}
        onCancelEditEmail={handleCancelEditEmail}
        onEditingEmailValueChange={setEditingEmailValue}
        onStartEditTemplate={handleStartEditTemplate}
        onEditingTemplateChange={setEditingTemplate}
        onSaveTemplate={handleSaveTemplate}
        onCancelEditTemplate={handleCancelEditTemplate}
        onResetTemplate={handleResetTemplate}
        onTest={handleTest}
      />
    </div>
  );
}
