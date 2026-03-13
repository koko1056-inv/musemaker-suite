-- Performance indexes for frequently queried columns
-- These indexes improve query performance for common access patterns

-- Conversations: frequently filtered by workspace_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_workspace
  ON conversations(workspace_id);

-- Conversations: frequently filtered by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_status
  ON conversations(status);

-- Outbound calls: frequently queried by agent_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outbound_calls_agent
  ON outbound_calls(agent_id);

-- Outbound calls: used by process-scheduled-calls (queries status='scheduled' AND scheduled_at <= now())
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_outbound_calls_scheduled
  ON outbound_calls(status, scheduled_at)
  WHERE status = 'scheduled';

-- Webhooks: filtered by workspace + active status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhooks_workspace_active
  ON webhooks(workspace_id, is_active)
  WHERE is_active = true;

-- Audit logs: queried by workspace + time range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_workspace_created
  ON audit_logs(workspace_id, created_at DESC);

-- Knowledge items: frequently joined by knowledge_base_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_items_kb
  ON knowledge_items(knowledge_base_id);

-- Slack integrations: filtered by workspace + active
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_slack_integrations_workspace_active
  ON slack_integrations(workspace_id, is_active)
  WHERE is_active = true;

-- Email notifications: filtered by workspace + active
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_notifications_workspace_active
  ON email_notifications(workspace_id, is_active)
  WHERE is_active = true;
