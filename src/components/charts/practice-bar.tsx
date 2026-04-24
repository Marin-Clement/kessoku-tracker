"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { format } from "date-fns";

interface Props {
  data: { day: string; total_minutes: number }[];
}

export function PracticeBarChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(new Date(d.day + "T00:00:00"), "EEE"),
  }));
  const max = Math.max(...data.map((d) => d.total_minutes), 1);
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8e869f", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#8e869f", fontSize: 11 }}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,79,134,0.08)" }}
            contentStyle={{
              background: "#181528",
              border: "1px solid #2a2540",
              borderRadius: "12px",
              fontSize: 12,
            }}
            labelStyle={{ color: "#f1ecff", marginBottom: "8px" }}
            itemStyle={{ color: "#f1ecff" }}
            formatter={(v) => [`${v} min`, "Practice"]}
          />
          <Bar dataKey="total_minutes" radius={[6, 6, 0, 0]}>
            {chartData.map((d, idx) => (
              <Cell
                key={idx}
                fill={d.total_minutes >= max * 0.66 ? "#ff4f86" : "#a77dff"}
                opacity={d.total_minutes === 0 ? 0.15 : 0.9}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
