"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";

interface Props {
  logs: { created_at: string; current_bpm: number }[];
  target_bpm: number | null;
}

export function BpmLineChart({ logs, target_bpm }: Props) {
  const data = logs.map((l, i) => ({
    idx: i,
    bpm: l.current_bpm,
    label: format(new Date(l.created_at.replace(" ", "T") + "Z"), "MMM d"),
  }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
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
            domain={["dataMin - 10", (dataMax: number) => Math.max(dataMax, target_bpm ?? 0) + 10]}
          />
          {target_bpm && (
            <ReferenceLine
              y={target_bpm}
              stroke="#ff4f86"
              strokeDasharray="4 4"
              label={{ value: `Target ${target_bpm}`, fill: "#ff4f86", fontSize: 11, position: "insideTopRight" }}
            />
          )}
          <Tooltip
            contentStyle={{
              background: "#181528",
              border: "1px solid #2a2540",
              borderRadius: "12px",
              fontSize: 12,
            }}
            labelStyle={{ color: "#f1ecff", marginBottom: "8px" }}
            itemStyle={{ color: "#f1ecff" }}
            formatter={(v) => [`${v} BPM`, "Current"]}
          />
          <Line
            type="monotone"
            dataKey="bpm"
            stroke="#a77dff"
            strokeWidth={2.5}
            dot={{ fill: "#a77dff", r: 4, strokeWidth: 0 }}
            activeDot={{ fill: "#ff4f86", r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
