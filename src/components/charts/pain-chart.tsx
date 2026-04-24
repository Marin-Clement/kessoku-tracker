"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { format } from "date-fns";

interface Props {
  data: { day: string; pain_fingers: number | null; pain_wrist: number | null }[];
}

export function PainChart({ data }: Props) {
  const chart = data.map((d) => ({
    ...d,
    label: format(new Date(d.day + "T00:00:00"), "MMM d"),
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chart} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
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
            domain={[0, 10]}
          />
          <ReferenceLine y={4} stroke="#ff5067" strokeDasharray="4 4" strokeOpacity={0.6} />
          <Tooltip
            contentStyle={{
              background: "#181528",
              border: "1px solid #2a2540",
              borderRadius: "12px",
              fontSize: 12,
            }}
            labelStyle={{ color: "#f1ecff", marginBottom: "8px" }}
            itemStyle={{ color: "#f1ecff" }}
          />
          <Legend wrapperStyle={{ fontSize: 11, color: "#8e869f" }} />
          <Line
            type="monotone"
            dataKey="pain_wrist"
            name="Wrist"
            stroke="#ff5067"
            strokeWidth={2.5}
            dot={{ fill: "#ff5067", r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="pain_fingers"
            name="Fingers"
            stroke="#ffb547"
            strokeWidth={2.5}
            dot={{ fill: "#ffb547", r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
