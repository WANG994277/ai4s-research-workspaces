"use client";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  FileText,
  Flame,
  Users,
  Compass,
  ChartColumnIncreasing,
  Database,
  TriangleAlert,
  Send,
  Sparkles,
} from "lucide-react";
import {
  colors,
  directions,
  evidenceTypes,
  news,
  number,
  sumEvidence,
  type Evidence,
  type Direction,
} from "./data";
import {
  Badge,
  Chart,
  Donut,
  Empty,
  Meter,
  Metrics,
  More,
  Panel,
  Select,
  Tabs,
  type Metric,
  type ChartRow,
} from "./ui";
export type OpenDetail = (title: string, content: ReactNode) => void;
export function MetricInfo({ metric }: { metric: Metric }) {
  return (
    <>
      <h3>
        {metric.label}：{metric.value}
      </h3>
      <p>
        按已提交的组织、领域、时间与来源条件统计。数量来自当前筛选的历史演示记录；得分、预测与研判为预设的示例指标，不作为正式科研结论。
      </p>
      <p>点击图表的“数据表”可核对分项数值。页面快照截止 2024-12-10。</p>
    </>
  );
}
function inspectMetric(open: OpenDetail) {
  return (metric: Metric) =>
    open("指标口径与明细", <MetricInfo metric={metric} />);
}
export function NewsList({
  ids,
  open,
  filter = "全部",
  availableEvidence,
}: {
  ids: string[];
  open: OpenDetail;
  filter?: string;
  availableEvidence: Evidence[];
}) {
  const items = news.filter(
    (n) =>
      ids.includes(n.direction) &&
      (filter === "全部" || n.type === filter) &&
      availableEvidence.some(
        (r) =>
          r.direction === n.direction &&
          r.type === n.type &&
          r.year === Number(n.date.slice(0, 4)),
      ),
  );
  return items.length ? (
    <div>
      {items.map((n) => (
        <article className="ck-news" key={n.id}>
          <Badge
            tone={
              n.type === "论文" ? "red" : n.type === "标准" ? "green" : "blue"
            }
          >
            {n.type}
          </Badge>
          <div>
            <button
              className="ck-news-title"
              onClick={() =>
                open(
                  n.title,
                  <>
                    <p>
                      {n.institution} · {n.date}
                    </p>
                    <p>
                      本条为“
                      {directions.find((d) => d.id === n.direction)?.name}
                      ”方向的示例证据，摘要用于演示证据定位。真实全文及引用需在来源数据库中核验。
                    </p>
                    <div className="ck-tags">
                      {n.tags.map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                    <p>证据状态：待核验 · 收录于历史专题快照</p>
                  </>,
                )
              }
            >
              {n.title}
            </button>
            <div className="ck-news-meta">
              <span>{n.institution}</span>
              <time>{n.date}</time>
            </div>
            <div className="ck-tags">
              {n.tags.map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  ) : (
    <Empty message="该分类暂无最新动态" />
  );
}
export function TrendView({
  rows,
  open,
}: {
  rows: Evidence[];
  open: OpenDetail;
}) {
  const [type, setType] = useState("论文");
  const [ranking, setRanking] = useState("热点关键词");
  const [distribution, setDistribution] = useState("研究主题");
  const [grouping, setGrouping] = useState("按地区");
  const [interval, setInterval] = useState("年度");
  const ids = [...new Set(rows.map((r) => r.direction))];
  const totals = directions
    .filter((d) => ids.includes(d.id))
    .map((d) => ({
      name: d.name,
      value: sumEvidence(rows.filter((r) => r.direction === d.id)),
      id: d.id,
    }))
    .sort((a, b) => b.value - a.value);
  const chartKeys =
    grouping === "按地区"
      ? ["中国", "美国", "欧洲"]
      : ["勘探开发研究院", "石油化工研究院", "海洋工程研究院"];
  const data: ChartRow[] = [...new Set(rows.map((r) => r.year))].sort().map(
    (year) =>
      Object.fromEntries([
        ["name", String(year)],
        ...chartKeys.map((key) => [
          key,
          sumEvidence(
            rows.filter(
              (r) =>
                r.year === year &&
                (grouping === "按地区" ? r.country === key : r.org === key),
            ),
            type === "机构" ? undefined : type,
          ),
        ]),
      ]) as ChartRow,
  );
  const chartData =
    interval === "累计"
      ? data.map(
          (d, i) =>
            Object.fromEntries([
              ["name", d.name],
              ...chartKeys.map((k) => [
                k,
                data.slice(0, i + 1).reduce((n, r) => n + Number(r[k]), 0),
              ]),
            ]) as ChartRow,
        )
      : data;
  const sources = [...new Set(rows.map((r) => r.source))].map((source) => ({
    name: source,
    value: sumEvidence(rows.filter((r) => r.source === source)),
  }));
  const institutions = [...new Set(rows.map((r) => r.institution))]
    .map((name) => ({
      name,
      value: sumEvidence(rows.filter((r) => r.institution === name)),
      country: rows.find((r) => r.institution === name)!.country,
    }))
    .sort((a, b) => b.value - a.value);
  const topicData =
    distribution === "研究主题"
      ? [
          ...totals.slice(0, 5),
          {
            name: "其他",
            value: totals.slice(5).reduce((n, r) => n + r.value, 0),
          },
        ].filter((r) => r.value > 0)
      : ["智能勘探", "低碳转化", "生产优化"].map((name, i) => ({
          name,
          value: totals
            .filter((_, j) => j % 3 === i)
            .reduce((n, r) => n + r.value, 0),
        }));
  return (
    <>
      <Metrics
        items={[
          { label: "论文数", value: sumEvidence(rows, "论文"), icon: FileText },
          { label: "专利数", value: sumEvidence(rows, "专利"), icon: Compass },
          { label: "标准数", value: sumEvidence(rows, "标准"), icon: BookOpen },
          { label: "核心机构数", value: institutions.length, icon: Users },
          { label: "热点主题数", value: ids.length, icon: Flame },
        ]}
        onInspect={inspectMetric(open)}
      />
      <div className="ck-trend-grid">
        <Panel
          title="多源趋势分析"
          className="ck-trend-main"
          action={
            <div className="flex gap-2">
              <Select
                compact
                label="趋势分组"
                value={grouping}
                options={["按地区", "按机构"]}
                onChange={setGrouping}
              />
              <Select
                compact
                label="统计方式"
                value={interval}
                options={["年度", "累计"]}
                onChange={setInterval}
              />
            </div>
          }
        >
          <Tabs
            label="趋势证据类型"
            items={["论文", "专利", "标准", "机构"]}
            value={type}
            onChange={setType}
          />
          <Chart
            data={chartData}
            keys={chartKeys}
            kind="area"
            height={250}
            label={
              type === "机构"
                ? "机构关联成果数（条）"
                : `${type}数（${type === "论文" ? "篇" : "条"}）`
            }
          />
        </Panel>
        <Panel title="热点关键词 / 热点主题榜">
          <Tabs
            label="热点排行"
            items={["热点关键词", "热点主题榜"]}
            value={ranking}
            onChange={setRanking}
          />
          <table className="ck-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{ranking === "热点关键词" ? "关键词" : "主题"}</th>
                <th>证据量</th>
                <th>热度</th>
              </tr>
            </thead>
            <tbody>
              {totals.slice(0, 10).map((t, i) => (
                <tr key={t.id}>
                  <td className="rank">{i + 1}</td>
                  <td>
                    <button
                      className="ck-row-button"
                      onClick={() =>
                        open(
                          t.name,
                          <>
                            <p>该专题共收录 {number(t.value)} 条聚合证据。</p>
                            <p>
                              主题对应的论文、专利、标准与科研项目在战略方向研判中共同展示；热度为预设示例评分。
                            </p>
                          </>,
                        )
                      }
                    >
                      {ranking === "热点关键词"
                        ? t.name
                            .replace("智能地质建模", "")
                            .replace("全链条技术", "")
                        : t.name}
                    </button>
                  </td>
                  <td>{number(t.value)}</td>
                  <td className="up">
                    {directions.find((d) => d.id === t.id)?.heat}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <aside className="ck-news-column">
          <Panel
            title="最新动态"
            action={
              <More
                onClick={() =>
                  open(
                    "最新科研动态",
                    <NewsList ids={ids} open={open} availableEvidence={rows} />,
                  )
                }
              />
            }
          >
            <NewsList ids={ids} open={open} availableEvidence={rows} />
          </Panel>
          <Panel
            title="数据来源概览"
            action={
              <More
                onClick={() =>
                  open(
                    "数据来源与统计口径",
                    <>
                      <p>
                        当前样本按数据库来源聚合，每条聚合记录包含领域、组织、年度与证据类型。统计单位是收录量，跨源去重需在真实接入后完成。
                      </p>
                      {sources.map((s) => (
                        <p key={s.name}>
                          {s.name}：{number(s.value)} 条
                        </p>
                      ))}
                    </>,
                  )
                }
              />
            }
          >
            {sources.map((s, i) => (
              <div className="ck-source" key={s.name}>
                <span>{s.name}</span>
                <progress
                  max={sumEvidence(rows)}
                  value={s.value}
                  style={{ accentColor: colors[i], color: colors[i] }}
                />
                <span>
                  {((s.value / Math.max(1, sumEvidence(rows))) * 100).toFixed(
                    1,
                  )}
                  %
                </span>
              </div>
            ))}
          </Panel>
        </aside>
        <div className="ck-trend-bottom">
          <Panel
            title="重点机构观察"
            action={
              <More
                onClick={() =>
                  open(
                    "机构观察口径",
                    <p>
                      机构成果数按当前筛选后的历史演示记录汇总。真实机构消歧与排名系统尚未接入。
                    </p>,
                  )
                }
              />
            }
          >
            <table className="ck-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>机构名称</th>
                  <th>国家/地区</th>
                  <th>相关成果数</th>
                  <th>观察状态</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((r, i) => (
                  <tr key={r.name}>
                    <td className="rank">{i + 1}</td>
                    <td>
                      <button
                        className="ck-row-button"
                        onClick={() =>
                          open(
                            r.name,
                            <>
                              <p>国家 / 地区：{r.country}</p>
                              <p>
                                关联成果：{number(r.value)} 条（历史演示记录）。
                              </p>
                              <p>
                                重点关注：科研合作、论文影响及专利布局。真实机构统计待接入。
                              </p>
                            </>,
                          )
                        }
                      >
                        {r.name}
                      </button>
                    </td>
                    <td>{r.country}</td>
                    <td>{number(r.value)}</td>
                    <td>
                      <Badge tone="green">持续跟踪</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="专题分布">
            <Tabs
              label="专题分布维度"
              items={["研究主题", "应用场景"]}
              value={distribution}
              onChange={setDistribution}
            />
            <Donut
              data={topicData}
              label="关联证据"
              onSelect={(name) =>
                open(
                  name,
                  <p>
                    当前所选专题的证据分布来自当前筛选范围，点击战略方向研判可继续查看方向对比。
                  </p>,
                )
              }
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
export function StrategyView({
  rows,
  open,
  onRequest,
  requests,
}: {
  rows: Evidence[];
  open: OpenDetail;
  onRequest: (direction: Direction) => void;
  requests: string[];
}) {
  const [selectedId, setSelectedId] = useState("deep");
  const [sort, setSort] = useState<"heat" | "opportunity" | "uncertainty">(
    "heat",
  );
  const [ascending, setAscending] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newsType, setNewsType] = useState("全部");
  const list = directions
    .filter((d) => rows.some((r) => r.direction === d.id))
    .sort((a, b) => (ascending ? 1 : -1) * (a[sort] - b[sort]));
  const selected = list.find((d) => d.id === selectedId) ?? list[0];
  if (!selected) return <Empty />;
  const current = rows.filter((r) => r.direction === selected.id);
  const data = list.slice(0, 5).map((d) => ({
    name: d.name.slice(0, 6),
    ...Object.fromEntries(
      evidenceTypes.map((t) => [
        t,
        sumEvidence(
          rows.filter((r) => r.direction === d.id),
          t,
        ),
      ]),
    ),
  }));
  const sortBy = (key: typeof sort) => {
    setAscending(sort === key ? !ascending : false);
    setSort(key);
  };
  return (
    <>
      <Metrics
        items={[
          {
            label: "待研判方向数",
            value: list.filter((d) => !d.confirmed).length,
            icon: Compass,
          },
          {
            label: "高机会方向",
            value: list.filter((d) => d.opportunity >= 80).length,
            icon: ChartColumnIncreasing,
          },
          {
            label: "专家已确认方向",
            value: list.filter((d) => d.confirmed).length,
            icon: Users,
          },
          {
            label: "高不确定方向",
            value: list.filter((d) => d.uncertainty >= 45).length,
            icon: TriangleAlert,
            tone: 4,
          },
          {
            label: "证据覆盖率",
            value: `${Math.round((new Set(rows.map((r) => `${r.direction}-${r.type}`)).size / (list.length * evidenceTypes.length)) * 100)}%`,
            icon: Database,
            tone: 3,
          },
        ]}
        onInspect={inspectMetric(open)}
      />
      <div className="ck-two-grid">
        <Panel
          title="技术方向对比"
          action={
            <span className="text-[11px] text-slate-500">
              基于多源证据的综合研判
            </span>
          }
        >
          <div className="ck-table-wrap">
            <table className="ck-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>技术方向</th>
                  <th>
                    <button onClick={() => sortBy("heat")}>热度 ↕</button>
                  </th>
                  <th>成熟度</th>
                  <th>
                    <button onClick={() => sortBy("opportunity")}>
                      机会度 ↕
                    </button>
                  </th>
                  <th>
                    <button onClick={() => sortBy("uncertainty")}>
                      不确定性 ↕
                    </button>
                  </th>
                  <th>证据数</th>
                  <th>专家确认状态</th>
                </tr>
              </thead>
              <tbody>
                {list.map((d, i) => (
                  <tr
                    key={d.id}
                    className={selected.id === d.id ? "selected" : ""}
                  >
                    <td className="rank">{i + 1}</td>
                    <td>
                      <button
                        className="ck-row-button"
                        aria-pressed={selected.id === d.id}
                        onClick={() => setSelectedId(d.id)}
                      >
                        {d.name}
                      </button>
                    </td>
                    <td>
                      <Meter
                        value={d.heat}
                        color={colors[0]}
                        label={`${d.name}热度`}
                      />
                    </td>
                    <td>
                      <Meter value={d.maturity} label={`${d.name}成熟度`} />
                    </td>
                    <td>
                      <Meter
                        value={d.opportunity}
                        color={colors[2]}
                        label={`${d.name}机会度`}
                      />
                    </td>
                    <td>
                      <Meter
                        value={d.uncertainty}
                        color={colors[4]}
                        label={`${d.name}不确定性`}
                      />
                    </td>
                    <td>
                      {number(
                        sumEvidence(rows.filter((r) => r.direction === d.id)),
                      )}
                    </td>
                    <td>
                      <Badge
                        tone={
                          d.confirmed
                            ? "green"
                            : requests.includes(d.id)
                              ? "blue"
                              : "orange"
                        }
                      >
                        {d.confirmed
                          ? "已确认"
                          : requests.includes(d.id)
                            ? "确认申请中"
                            : "待确认"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title={`多源证据（${selected.name}）`}>
          <div className="ck-evidence-grid">
            {evidenceTypes.map((t, i) => {
              const Icon = [FileText, Compass, BookOpen, Database][i];
              return (
                <button
                  className="ck-evidence"
                  key={t}
                  style={{ backgroundColor: `${colors[i]}05` }}
                  onClick={() =>
                    open(
                      `${selected.name} · 相关${t}`,
                      <>
                        <p>
                          {number(sumEvidence(current, t))}{" "}
                          条历史聚合证据；按当前筛选口径统计。
                        </p>
                        <Chart
                          data={[...new Set(current.map((r) => r.year))].map(
                            (y) => ({
                              name: String(y),
                              数量: sumEvidence(
                                current.filter((r) => r.year === y),
                                t,
                              ),
                            }),
                          )}
                          keys={["数量"]}
                          label={`${t}年度统计`}
                          height={220}
                        />
                      </>,
                    )
                  }
                >
                  <Icon size={28} color={colors[i]} />
                  <div>
                    <h3>相关{t}</h3>
                    <b>{number(sumEvidence(current, t))}</b>
                    <small>查看年度证据分布</small>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="ck-expert">
            <button
              className="ck-button primary"
              disabled={selected.confirmed || requests.includes(selected.id)}
              onClick={() => onRequest(selected)}
            >
              <Send size={14} />
              {selected.confirmed
                ? "专家已确认"
                : requests.includes(selected.id)
                  ? "已保存确认申请"
                  : "发起专家确认"}
            </button>
          </div>
          <div className="ck-detail-block">
            <div className="flex justify-between">
              <h3>方向简介</h3>
              <button
                className="ck-more"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "收起" : "展开"}⌄
              </button>
            </div>
            <p className="ck-description">
              {selected.name}
              面向复杂科研场景，融合机理研究、多源数据与人工智能方法，支撑技术验证与工程应用。
              {expanded &&
                " 当前需要持续核验数据质量、跨场景泛化能力及工程化成本；以中试验证和专家评审作为后续研判依据，保留证据版本与评审意见。"}
            </p>
          </div>
        </Panel>
      </div>
      <div className="ck-three-grid">
        <Panel title="证据分布与对比">
          <Chart
            data={data}
            keys={[...evidenceTypes]}
            kind="bar"
            stack
            label="各方向证据数量（条）"
            height={218}
          />
        </Panel>
        <Panel
          title="研判结论与建议"
          action={
            <Badge tone="purple">
              <Sparkles size={11} />
              AI 示例
            </Badge>
          }
        >
          <div className="ck-conclusion">
            结论：
            {selected.opportunity >= 75
              ? "该方向具有较高发展机会，建议重点论证。"
              : "该方向仍需补充验证，建议持续跟踪。"}
          </div>
          <p className="ck-description">
            围绕{selected.name}，当前收录 {number(sumEvidence(current))}{" "}
            条多源证据。成熟度 {selected.maturity}，不确定性{" "}
            {selected.uncertainty}。需结合适用场景与数据质量进一步验证。
          </p>
          <h3 className="mt-3">建议下一步工作</h3>
          <ol className="ck-steps">
            <li>开展机理与算法融合研究，提升可解释性</li>
            <li>建设多源样本数据集，补充独立验证</li>
            <li>布局典型场景试验，形成可复核证据</li>
            <li>组织领域专家进行阶段性研判</li>
          </ol>
        </Panel>
        <Panel title="最新证据动态">
          <Tabs
            label="证据动态类型"
            value={newsType}
            items={["全部", "论文", "专利", "标准"]}
            onChange={setNewsType}
          />
          <NewsList
            ids={[selected.id]}
            open={open}
            filter={newsType}
            availableEvidence={current}
          />
        </Panel>
      </div>
    </>
  );
}
