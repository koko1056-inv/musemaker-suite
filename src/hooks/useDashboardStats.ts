import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_WORKSPACE_ID } from '@/lib/workspace';

interface DashboardStats {
  todayCount: number;
  successRate: number;
  totalAgents: number;
  publishedAgents: number;
}

export function useDashboardStats() {
  // Fetch agents with minimal data
  const { data: agents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ['dashboard-agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, description, status, icon_name, icon_color, custom_icon_url, created_at')
        .eq('workspace_id', DEMO_WORKSPACE_ID)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000, // 1 minute cache
  });

  // Fetch today's call counts only (lightweight query)
  const { data: callStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-call-stats'],
    queryFn: async () => {
      // 東京時間（JST: UTC+9）で今日の開始時刻を計算
      const now = new Date();
      const tokyoOffset = 9 * 60; // JST is UTC+9
      const localOffset = now.getTimezoneOffset();
      const tokyoTime = new Date(now.getTime() + (tokyoOffset + localOffset) * 60 * 1000);
      const todayTokyo = new Date(tokyoTime);
      todayTokyo.setHours(0, 0, 0, 0);
      // Convert back to UTC for database query
      const todayUTC = new Date(todayTokyo.getTime() - (tokyoOffset + localOffset) * 60 * 1000);
      const todayISO = todayUTC.toISOString();

      // Get agent IDs for this workspace first
      const { data: workspaceAgents } = await supabase
        .from('agents')
        .select('id')
        .eq('workspace_id', DEMO_WORKSPACE_ID);
      
      const agentIds = workspaceAgents?.map(a => a.id) || [];

      // Parallel queries for today's calls
      // Get outbound call conversation IDs to exclude from inbound count (avoid double counting)
      const { data: outboundWithConv } = await supabase
        .from('outbound_calls')
        .select('conversation_id')
        .eq('workspace_id', DEMO_WORKSPACE_ID)
        .not('conversation_id', 'is', null);
      
      const outboundConversationIds = new Set(
        outboundWithConv?.map(o => o.conversation_id).filter(Boolean) || []
      );

      const [conversationsResult, outboundResult, totalConversations, totalOutbound] = await Promise.all([
        // Today's inbound calls (filtered by workspace agents)
        agentIds.length > 0
          ? supabase
              .from('conversations')
              .select('id, status', { count: 'exact', head: false })
              .in('agent_id', agentIds)
              .gte('started_at', todayISO)
          : Promise.resolve({ data: [], error: null }),
        // Today's outbound calls
        supabase
          .from('outbound_calls')
          .select('id, status', { count: 'exact', head: false })
          .eq('workspace_id', DEMO_WORKSPACE_ID)
          .gte('created_at', todayISO),
        // Total conversations (filtered by workspace agents)
        agentIds.length > 0
          ? supabase
              .from('conversations')
              .select('id, status', { count: 'exact', head: false })
              .in('agent_id', agentIds)
          : Promise.resolve({ data: [], error: null }),
        // Total outbound calls
        supabase
          .from('outbound_calls')
          .select('id, status', { count: 'exact', head: false })
          .eq('workspace_id', DEMO_WORKSPACE_ID),
      ]);

      // Filter out conversations that are linked to outbound calls (avoid double counting)
      const todayInboundOnly = conversationsResult.data?.filter(c => 
        !outboundConversationIds.has(c.id)
      ).length || 0;
      const todayOutbound = outboundResult.data?.length || 0;

      // Calculate success rate (exclude outbound-linked conversations)
      const inboundOnly = totalConversations.data?.filter(c => 
        !outboundConversationIds.has(c.id)
      ) || [];
      const allOutbound = totalOutbound.data || [];
      
      const inboundCompleted = inboundOnly.filter(c => c.status === 'completed').length;
      const outboundCompleted = allOutbound.filter(c => c.status === 'completed').length;
      const totalCalls = inboundOnly.length + allOutbound.length;
      
      const successRate = totalCalls > 0 
        ? Math.round(((inboundCompleted + outboundCompleted) / totalCalls) * 100)
        : 0;

      return {
        todayCount: todayInboundOnly + todayOutbound,
        successRate,
      };
    },
    staleTime: 30000, // 30 second cache
  });

  const stats: DashboardStats = useMemo(() => ({
    todayCount: callStats?.todayCount || 0,
    successRate: callStats?.successRate || 0,
    totalAgents: agents.length,
    publishedAgents: agents.filter(a => a.status === 'published').length,
  }), [agents, callStats]);

  const recentAgents = useMemo(() => agents.slice(0, 4), [agents]);
  const hasAgents = agents.length > 0;

  return {
    stats,
    agents,
    recentAgents,
    hasAgents,
    isLoading: isLoadingAgents || isLoadingStats,
    isLoadingAgents,
    isLoadingStats,
  };
}
