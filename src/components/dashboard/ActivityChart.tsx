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
  { name: "Mon", conversations: 240 },
  { name: "Tue", conversations: 380 },
  { name: "Wed", conversations: 520 },
  { name: "Thu", conversations: 410 },
  { name: "Fri", conversations: 650 },
  { name: "Sat", conversations: 320 },
  { name: "Sun", conversations: 280 },
];

export function ActivityChart() {
  return (
    <div className="glass rounded-xl card-shadow animate-fade-in">
      <div className="border-b border-border/50 px-6 py-4">
        <h3 className="font-semibold text-foreground">Weekly Activity</h3>
        <p className="text-sm text-muted-foreground">Conversations over the past week</p>
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
