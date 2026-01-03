import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { name: "月", conversations: 240 },
  { name: "火", conversations: 380 },
  { name: "水", conversations: 520 },
  { name: "木", conversations: 410 },
  { name: "金", conversations: 650 },
  { name: "土", conversations: 320 },
  { name: "日", conversations: 280 },
];

export function ActivityChart() {
  return (
    <div className="glass rounded-xl card-shadow animate-fade-in">
      <div className="border-b border-border/50 px-6 py-4">
        <h3 className="font-semibold text-foreground">週間アクティビティ</h3>
        <p className="text-sm text-muted-foreground">過去1週間の会話数</p>
      </div>
      <div className="p-6">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(217, 33%, 17%)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="hsl(215, 20%, 65%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(215, 20%, 65%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 8%)",
                  border: "1px solid hsl(217, 33%, 17%)",
                  borderRadius: "8px",
                  color: "hsl(210, 40%, 98%)",
                }}
              />
              <Area
                type="monotone"
                dataKey="conversations"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorConversations)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
