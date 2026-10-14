"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { bucket: "p5", value: 0.82 },
  { bucket: "p25", value: 0.94 },
  { bucket: "p50", value: 1.06 },
  { bucket: "p75", value: 1.18 },
  { bucket: "p95", value: 1.34 },
];

export function RiskChart() {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="bucket" />
        <YAxis />
        <Tooltip />
        <Area dataKey="value" stroke="#0f766e" fill="#99f6e4" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
