import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield,
  Search,
  Filter,
  Download,
  User,
  Calendar,
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Json } from "@/integrations/supabase/types";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_email?: string;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  view: { label: "閲覧", color: "bg-blue-500/10 text-blue-600" },
  create: { label: "作成", color: "bg-green-500/10 text-green-600" },
  update: { label: "更新", color: "bg-amber-500/10 text-amber-600" },
  delete: { label: "削除", color: "bg-red-500/10 text-red-600" },
  login: { label: "ログイン", color: "bg-purple-500/10 text-purple-600" },
  logout: { label: "ログアウト", color: "bg-gray-500/10 text-gray-600" },
  export: { label: "エクスポート", color: "bg-cyan-500/10 text-cyan-600" },
};

const resourceLabels: Record<string, string> = {
  agent: "エージェント",
  conversation: "会話",
  workspace: "ワークスペース",
  user: "ユーザー",
  settings: "設定",
};

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [resourceFilter, setResourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("audit_logs")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        if (actionFilter !== "all") {
          query = query.eq("action", actionFilter);
        }
        if (resourceFilter !== "all") {
          query = query.eq("resource_type", resourceFilter);
        }
        if (searchQuery) {
          query = query.or(`resource_id.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%`);
        }

        const { data, error, count } = await query;

        if (error) {
          console.error("Error fetching audit logs:", error);
          return;
        }

        setLogs(data || []);
        setTotalCount(count || 0);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [page, actionFilter, resourceFilter, searchQuery]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const exportToCSV = () => {
    const headers = ["日時", "ユーザー", "操作", "リソース", "リソースID", "詳細"];
    const rows = logs.map(log => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss", { locale: ja }),
      log.user_id || "-",
      actionLabels[log.action]?.label || log.action,
      resourceLabels[log.resource_type] || log.resource_type,
      log.resource_id || "-",
      log.details ? JSON.stringify(log.details) : "-",
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_logs_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              監査ログ
            </h1>
            <p className="text-muted-foreground mt-1">
              システムの操作履歴とセキュリティイベントを確認
            </p>
          </div>
          <Button variant="outline" onClick={exportToCSV} disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            CSVエクスポート
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              フィルター
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="リソースIDまたは詳細で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="操作" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての操作</SelectItem>
                  <SelectItem value="view">閲覧</SelectItem>
                  <SelectItem value="create">作成</SelectItem>
                  <SelectItem value="update">更新</SelectItem>
                  <SelectItem value="delete">削除</SelectItem>
                  <SelectItem value="login">ログイン</SelectItem>
                  <SelectItem value="logout">ログアウト</SelectItem>
                </SelectContent>
              </Select>
              <Select value={resourceFilter} onValueChange={setResourceFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="リソース" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="agent">エージェント</SelectItem>
                  <SelectItem value="conversation">会話</SelectItem>
                  <SelectItem value="workspace">ワークスペース</SelectItem>
                  <SelectItem value="user">ユーザー</SelectItem>
                  <SelectItem value="settings">設定</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              操作履歴
            </CardTitle>
            <CardDescription>
              {totalCount.toLocaleString()} 件の記録
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>監査ログがありません</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40">日時</TableHead>
                        <TableHead className="w-32">ユーザー</TableHead>
                        <TableHead className="w-24">操作</TableHead>
                        <TableHead className="w-28">リソース</TableHead>
                        <TableHead>詳細</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(log.created_at), "yyyy/MM/dd HH:mm", { locale: ja })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm truncate max-w-24">
                                {log.user_id ? log.user_id.slice(0, 8) + "..." : "-"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={actionLabels[log.action]?.color || "bg-gray-100"}>
                              {actionLabels[log.action]?.label || log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {resourceLabels[log.resource_type] || log.resource_type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {log.resource_id && (
                                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded mr-2">
                                  {log.resource_id.slice(0, 8)}...
                                </span>
                              )}
                              {log.details && (
                                <span className="text-xs">
                                  {JSON.stringify(log.details).slice(0, 50)}...
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalCount)} / {totalCount} 件
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AuditLogs;
