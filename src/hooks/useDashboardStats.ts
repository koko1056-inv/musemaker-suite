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
        .select('id, name, description, status, icon_name, icon_color, created_at')
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
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Parallel queries for today's calls
      const [conversationsResult, outboundResult, totalConversations, totalOutbound] = await Promise.all([
        // Today's inbound calls
        supabase
          .from('conversations')
          .select('id, status', { count: 'exact', head: false })
          .gte('started_at', todayISO),
        // Today's outbound calls
        supabase
          .from('outbound_calls')
          .select('id, status', { count: 'exact', head: false })
          .eq('workspace_id', DEMO_WORKSPACE_ID)
          .gte('created_at', todayISO),
        // Total completed conversations (for success rate)
        supabase
          .from('conversations')
          .select('id, status', { count: 'exact', head: false }),
        // Total completed outbound calls (for success rate)
        supabase
          .from('outbound_calls')
          .select('id, status', { count: 'exact', head: false })
          .eq('workspace_id', DEMO_WORKSPACE_ID),
      ]);

      const todayInbound = conversationsResult.data?.filter(c => 
        (c as any).metadata?.call_type !== 'outbound'
      ).length || 0;
      const todayOutbound = outboundResult.data?.length || 0;

      // Calculate success rate from all calls
      const allInbound = totalConversations.data || [];
      const allOutbound = totalOutbound.data || [];
      
      const inboundCompleted = allInbound.filter(c => c.status === 'completed').length;
      const outboundCompleted = allOutbound.filter(c => c.status === 'completed').length;
      const totalCalls = allInbound.length + allOutbound.length;
      
      const successRate = totalCalls > 0 
        ? Math.round(((inboundCompleted + outboundCompleted) / totalCalls) * 100)
        : 0;

      return {
        todayCount: todayInbound + todayOutbound,
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
