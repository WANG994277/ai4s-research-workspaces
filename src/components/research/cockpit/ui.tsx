"use client";
import { useId, useState, type ReactNode, type ComponentType } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Table2,
  ChartNoAxesCombined,
  SearchX,
  Info,
} from "lucide-react";
import { colors, number } from "./data";
export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`ck-panel ${className}`}>
      <header className="ck-panel-heading">
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
export function More({
  onClick,
  label = "查看更多",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button className="ck-more" onClick={onClick}>
      {label}
      <ChevronRight size={13} />
    </button>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <label className={compact ? "ck-select compact" : "ck-select"}>
      <span className={compact ? "sr-only" : ""}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
export function Tabs({
  items,
  value,
  onChange,
  label,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="ck-tabs" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          key={item}
          aria-pressed={value === item}
          className={value === item ? "active" : ""}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
export function Badge({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`ck-badge ${tone}`}>{children}</span>;
}
export function Risk({ value }: { value: string }) {
  return (
    <Badge tone={value === "高" ? "red" : value === "中" ? "orange" : "green"}>
      {value}
    </Badge>
  );
}
export function Empty({
  onReset,
  message = "当前筛选条件下暂无数据",
}: {
  onReset?: () => void;
  message?: string;
}) {
  return (
    <div className="ck-empty">
      <SearchX size={28} />
      <strong>{message}</strong>
      <span>试试其他条件或扩大时间范围</span>
      {onReset && (
        <button className="ck-button" onClick={onReset}>
          重置筛选
        </button>
      )}
    </div>
  );
}
export function InfoBar({ children }: { children: ReactNode }) {
  return (
    <div className="ck-info">
      <Info size={16} />
      <span>{children}</span>
    </div>
  );
}
export function Meter({
  value,
  color = colors[1],
  label,
}: {
  value: number;
  color?: string;
  label?: string;
}) {
  return (
    <span className="ck-meter">
      <progress
        aria-label={label ?? "指标得分"}
        max={100}
        value={value}
        style={{ accentColor: color, color }}
      />
      <span style={{ color }}>{value}</span>
    </span>
  );
}
export type Metric = {
  label: string;
  value: string | number;
  change?: string;
  icon: ComponentType<{ size?: number }>;
  tone?: number;
  points?: number[];
};
export function Metrics({
  items,
  onInspect,
}: {
  items: Metric[];
  onInspect: (m: Metric) => void;
}) {
  return (
    <div
      className="ck-metrics"
      style={{ gridTemplateColumns: `repeat(${items.length},minmax(0,1fr))` }}
    >
      {items.map((m, i) => (
        <MetricCard
          key={m.label}
          metric={m}
          index={i}
          onClick={() => onInspect(m)}
        />
      ))}
    </div>
  );
}
function MetricCard({
  metric: m,
  index,
  onClick,
}: {
  metric: Metric;
  index: number;
  onClick: () => void;
}) {
  const Icon = m.icon;
  const color = colors[m.tone ?? index % colors.length];
  const down = m.change?.startsWith("-");
  const id = useId().replace(/:/g, "");
  return (
    <button
      className="ck-metric"
      onClick={onClick}
      aria-label={`${m.label} ${m.value}，查看指标口径`}
    >
      <span
        className="ck-metric-icon"
        style={{ color, backgroundColor: `${color}10` }}
      >
        <Icon size={25} />
      </span>
      <div className="ck-metric-content">
        <span className="ck-metric-label">{m.label}</span>
        <strong>
          {typeof m.value === "number" ? number(m.value) : m.value}
        </strong>
        <span className="ck-change">
          {m.change ? (
            <>
              <span>同比</span>
              <b className={down ? "down" : "up"}>
                {m.change}
                {down ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
              </b>
            </>
          ) : (
            <span>当前筛选范围</span>
          )}
        </span>
      </div>
      <div className="ck-spark" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={(m.points ?? [9, 22, 20, 32, 30, 45, 43, 59]).map((v) => ({
              v,
            }))}
          >
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="linear"
              dataKey="v"
              stroke={color}
              fill={`url(#${id})`}
              strokeWidth={1.4}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </button>
  );
}
export type ChartRow = { name: string; [key: string]: string | number };
export function Chart({
  data,
  keys,
  kind = "line",
  height = 250,
  stack = false,
  label = "统计图",
  palette = colors,
  percent = false,
}: {
  data: ChartRow[];
  keys: string[];
  kind?: "line" | "bar" | "area";
  height?: number;
  stack?: boolean;
  label?: string;
  palette?: string[];
  percent?: boolean;
}) {
  const [table, setTable] = useState(false);
  const common = { data, margin: { top: 12, right: 12, left: -12, bottom: 0 } };
  const axes = [
    <CartesianGrid key="grid" stroke="#EAF0F6" vertical={kind !== "bar"} />,
    <XAxis
      key="x"
      dataKey="name"
      tick={{ fontSize: 11, fill: "#586A82" }}
      tickLine={false}
      axisLine={{ stroke: "#D8E1EB" }}
      interval={0}
    />,
    <YAxis
      key="y"
      tick={{ fontSize: 11, fill: "#586A82" }}
      tickLine={false}
      axisLine={false}
      tickFormatter={(v) => `${v}${percent ? "%" : ""}`}
    />,
    <Tooltip
      key="tooltip"
      contentStyle={{
        fontSize: 12,
        border: "1px solid #E5EBF2",
        borderRadius: 6,
      }}
    />,
    <Legend
      key="legend"
      iconType="circle"
      iconSize={7}
      wrapperStyle={{ fontSize: 11, paddingBottom: 12 }}
      verticalAlign="top"
    />,
  ];
  return (
    <div className="ck-chart">
      <div className="ck-chart-toolbar">
        <span>{label}</span>
        <button
          className="ck-more"
          aria-label={`${table ? "显示图表" : "查看数据表"}：${label}`}
          onClick={() => setTable(!table)}
        >
          {table ? <ChartNoAxesCombined size={13} /> : <Table2 size={13} />}
          {table ? "图表" : "数据表"}
        </button>
      </div>
      {table ? (
        <div className="ck-chart-table" style={{ height }}>
          <table className="ck-table">
            <caption className="sr-only">{label}</caption>
            <thead>
              <tr>
                <th>维度</th>
                {keys.map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.name}>
                  <td>{d.name}</td>
                  {keys.map((k) => (
                    <td key={k}>
                      {number(Number(d[k] ?? 0))}
                      {percent ? "%" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          style={{ height, width: "100%", minWidth: 0 }}
          role="img"
          aria-label={`${label}，可切换数据表查看完整数据`}
        >
          <ResponsiveContainer width="100%" height="100%">
            {kind === "bar" ? (
              <BarChart {...common}>
                {axes}
                {keys.map((k, i) => (
                  <Bar
                    key={k}
                    dataKey={k}
                    fill={palette[i % palette.length]}
                    radius={[2, 2, 0, 0]}
                    stackId={stack ? "total" : undefined}
                    maxBarSize={34}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            ) : kind === "area" ? (
              <AreaChart {...common}>
                {axes}
                {keys.map((k, i) => (
                  <Area
                    key={k}
                    dataKey={k}
                    type="linear"
                    stroke={palette[i % palette.length]}
                    fill={palette[i % palette.length]}
                    fillOpacity={0.045}
                    strokeWidth={1.8}
                    dot={{ r: 3, strokeWidth: 1, stroke: "#fff" }}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart {...common}>
                {axes}
                {keys.map((k, i) => (
                  <Line
                    key={k}
                    dataKey={k}
                    stroke={palette[i % palette.length]}
                    strokeWidth={1.8}
                    dot={{ r: 3 }}
                    strokeDasharray={k.includes("预测") ? "4 4" : undefined}
                    connectNulls
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
export function Donut({
  data,
  total,
  label,
  onSelect,
}: {
  data: { name: string; value: number }[];
  total?: string;
  label: string;
  onSelect?: (name: string) => void;
}) {
  const sum = data.reduce((n, d) => n + d.value, 0);
  return (
    <div className="ck-donut">
      <div
        className="ck-ring"
        role="img"
        aria-label={`${label}：${data.map((d) => `${d.name}${d.value}`).join("，")}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="65%"
              outerRadius="94%"
              paddingAngle={1}
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={colors[(i + 1) % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="ck-ring-label">
          <strong>{total ?? number(sum)}</strong>
          <span>{label}</span>
        </div>
      </div>
      <div className="ck-donut-legend">
        {data.map((d, i) => (
          <button
            key={d.name}
            disabled={!onSelect}
            onClick={() => onSelect?.(d.name)}
          >
            <span
              className="ck-dot"
              style={{ backgroundColor: colors[(i + 1) % colors.length] }}
            />
            <span>{d.name}</span>
            <b>{sum ? ((d.value / sum) * 100).toFixed(1) : "0"}%</b>
          </button>
        ))}
      </div>
    </div>
  );
}
