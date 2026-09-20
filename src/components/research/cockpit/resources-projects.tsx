"use client";
import { useState } from "react";
import {
  Cpu,
  PieChart,
  Server,
  Database,
  Users,
  ClipboardList,
  SlidersHorizontal,
  Clock3,
  Share2,
  FolderOpen,
  Flag,
  TriangleAlert,
  FileText,
  CircleDollarSign,
  CheckCircle2,
  Circle,
  CircleDot,
} from "lucide-react";
import {
  colors,
  number,
  type ResourceRecord,
  type ProjectRecord,
} from "./data";
import {
  Badge,
  Chart,
  Donut,
  Empty,
  InfoBar,
  Metrics,
  More,
  Panel,
  Risk,
  Tabs,
} from "./ui";
import { MetricInfo, type OpenDetail } from "./trend-strategy";
export function ResourcesView({
  rows,
  open,
  onCoordinate,
}: {
  rows: ResourceRecord[];
  open: OpenDetail;
  onCoordinate: (r: ResourceRecord) => void;
}) {
  const [category, setCategory] = useState("算力资源");
  const active = rows.filter((r) => r.category === category);
  const utilization = active.length
    ? active.reduce((n, r) => n + r.utilization, 0) / active.length
    : 0;
  const data = active.map((r) => ({
    name: r.type === "GPU" ? r.name.split("-")[0] : r.name.slice(0, 5),
    申请量: r.demand,
    占用量: r.occupied,
    可用容量: r.available,
    排队情况: r.pending,
  }));
  const bottlenecks = [...active].sort((a, b) => b.utilization - a.utilization);
  const unit =
    category === "算力资源"
      ? "核时 / 万"
      : category === "科研设备"
        ? "机时 / 小时"
        : "投入 / 人天";
  const forecast = Array.from({ length: 6 }, (_, i) => ({
    name: `2025-0${i + 1}`,
    预测利用率: Math.min(
      100,
      Math.round(utilization - 10 + [0, 6, 11, 8, 4, 4][i]),
    ),
    建议调度后: Math.max(
      0,
      Math.round(utilization - 28 + [0, 5, 9, 5, 2, 2][i]),
    ),
  }));
  return (
    <>
      <InfoBar>
        基于多源数据的资源供需分析与智能建议，为资源统筹配置提供决策支持，不替代任何审批流程。
      </InfoBar>
      <Metrics
        items={[
          {
            label: "资源申请量",
            value: active.reduce((n, r) => n + r.demand, 0),
            icon: Cpu,
            tone: 1,
          },
          {
            label: "资源占用率",
            value: `${utilization.toFixed(1)}%`,
            icon: PieChart,
            tone: 2,
          },
          {
            label: "可调配资源",
            value: active.filter((r) => r.utilization < 85).length,
            icon: Server,
            tone: 3,
          },
          {
            label: "资源空闲率",
            value: `${active.length ? (100 - utilization).toFixed(1) : "0.0"}%`,
            icon: Database,
            tone: 4,
          },
          { label: "资源单元数", value: active.length, icon: Users, tone: 3 },
          {
            label: "待协调事项",
            value: active.reduce((n, r) => n + r.queue, 0),
            icon: ClipboardList,
            tone: 0,
          },
        ]}
        onInspect={(m) => open("资源指标口径", <MetricInfo metric={m} />)}
      />
      <Tabs
        label="资源类型"
        items={["算力资源", "科研设备", "科研人员"]}
        value={category}
        onChange={setCategory}
      />
      {active.length ? (
        <div className="ck-resource-grid">
          <Panel title={`${category}供需情况`}>
            <Chart
              data={data}
              keys={["申请量", "占用量", "可用容量", "排队情况"]}
              kind="bar"
              label={unit}
              palette={[colors[1], colors[2], colors[4], colors[0]]}
              height={244}
            />
          </Panel>
          <Panel
            title="资源瓶颈预警"
            action={
              <More
                label="查看全部"
                onClick={() =>
                  open(
                    "全部资源预警",
                    <ResourceTable
                      rows={bottlenecks}
                      onCoordinate={onCoordinate}
                    />,
                  )
                }
              />
            }
          >
            <table className="ck-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>资源名称</th>
                  <th>类型</th>
                  <th>当前利用率</th>
                  <th>风险</th>
                </tr>
              </thead>
              <tbody>
                {bottlenecks.map((r, i) => (
                  <tr key={r.id}>
                    <td className="rank">{i + 1}</td>
                    <td>
                      <button
                        className="ck-row-button"
                        onClick={() => onCoordinate(r)}
                      >
                        {r.name}
                      </button>
                    </td>
                    <td>{r.type}</td>
                    <td>{r.utilization}%</td>
                    <td>
                      <Risk
                        value={
                          r.utilization >= 85
                            ? "高"
                            : r.utilization >= 70
                              ? "中"
                              : "低"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="AI 智能建议" className="ck-recommendations">
            <div>
              {[
                {
                  title: "调度建议",
                  icon: SlidersHorizontal,
                  color: colors[1],
                  lines: [
                    `优先关注 ${bottlenecks[0].name} 的资源压力`,
                    `将非紧急${category === "算力资源" ? "训练" : "使用"}任务调整至低峰时段`,
                    "按任务紧急度与资源约束生成协调清单",
                  ],
                },
                {
                  title: "错峰建议",
                  icon: Clock3,
                  color: colors[2],
                  lines: [
                    "提前申报连续占用时间，减少临时等待",
                    "引导大规模任务避开 9:00—11:00 高峰",
                    "提供夜间使用窗口，提升资源利用率",
                  ],
                },
                {
                  title: "共享建议",
                  icon: Share2,
                  color: colors[3],
                  lines: [
                    "推动跨课题资源共享，提高整体利用率",
                    "建立共享预约机制，减少资源闲置",
                    "协调跨部门合作与资源开放时段",
                  ],
                },
              ].map((a) => (
                <section className="ck-advice" key={a.title}>
                  <h3>
                    <a.icon size={23} color={a.color} />
                    {a.title}
                    <span className="ml-auto">
                      <Badge>3 条建议</Badge>
                    </span>
                  </h3>
                  <ul>
                    {a.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                  <button
                    className="ck-more"
                    onClick={() => onCoordinate(bottlenecks[0])}
                  >
                    创建协调记录 <span aria-hidden="true">→</span>
                  </button>
                </section>
              ))}
            </div>
          </Panel>
          <Panel
            title="当前需求资源列表"
            action={
              <More
                label="查看全部"
                onClick={() =>
                  open(
                    "当前资源需求",
                    <ResourceTable rows={active} onCoordinate={onCoordinate} />,
                  )
                }
              />
            }
          >
            <ResourceTable
              rows={active.slice(0, 5)}
              onCoordinate={onCoordinate}
            />
          </Panel>
          <Panel
            title={`未来资源利用率预测（${category === "算力资源" ? "算力" : category === "科研设备" ? "设备" : "人员"}）`}
            action={
              <More
                label="查看详情"
                onClick={() =>
                  open(
                    "预测模型与假设",
                    <>
                      <p>
                        以当前资源平均利用率 {utilization.toFixed(1)}%
                        为基准，演示未来六个月的资源压力和错峰调度情景。
                      </p>
                      <p>
                        这是预设情景曲线，未连接容量规划或实时预测模型，不作为生产配额与资源承诺。
                      </p>
                    </>,
                  )
                }
              />
            }
          >
            <Chart
              data={forecast}
              keys={["预测利用率", "建议调度后"]}
              percent
              label="预测情景 · 非实际监控"
              height={211}
            />
          </Panel>
        </div>
      ) : (
        <Empty message="该类资源在当前范围内暂无记录" />
      )}
    </>
  );
}
function ResourceTable({
  rows,
  onCoordinate,
}: {
  rows: ResourceRecord[];
  onCoordinate: (r: ResourceRecord) => void;
}) {
  return (
    <div className="ck-table-wrap">
      <table className="ck-table">
        <thead>
          <tr>
            <th>资源名称</th>
            <th>当前容量</th>
            <th>利用率</th>
            <th>排队</th>
            <th>建议操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.capacity}</td>
              <td className={r.utilization >= 85 ? "up" : ""}>
                {r.utilization}%
              </td>
              <td>{r.queue}</td>
              <td>
                <button className="ck-link" onClick={() => onCoordinate(r)}>
                  {r.utilization >= 90
                    ? "扩容 / 调度"
                    : r.utilization >= 80
                      ? "错峰使用"
                      : "协调使用"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ProjectDetail({
  project: p,
  open,
  initialTab = "项目概况",
}: {
  project: ProjectRecord;
  open: OpenDetail;
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const done = p.milestones.filter(m => m.status === "已完成").length;
  return (
    <>
      <h3 className="ck-detail-title">{p.name}</h3>
      <dl className="ck-details">
        <div>
          <dt>项目编号</dt>
          <dd>{p.code}</dd>
        </div>
        <div>
          <dt>来源系统</dt>
          <dd>{p.source}</dd>
        </div>
        <div>
          <dt>负责人</dt>
          <dd>{p.owner}</dd>
        </div>
        <div>
          <dt>立项年度</dt>
          <dd>2021</dd>
        </div>
        <div>
          <dt>所属组织</dt>
          <dd>{p.org}</dd>
        </div>
        <div>
          <dt>研究周期</dt>
          <dd>2021 - 2025</dd>
        </div>
        <div>
          <dt>项目状态</dt>
          <dd>
            <Badge>{p.status}</Badge>
          </dd>
        </div>
        <div>
          <dt>经费规模</dt>
          <dd>{number(p.budget)} 万元</dd>
        </div>
      </dl>
      <Tabs
        label="项目详情分类"
        items={["项目概况", "关联任务", "关联成果", "风险记录"]}
        value={tab}
        onChange={setTab}
      />
      {tab === "项目概况" ? (
        <>
          <h3>项目简介</h3>
          <p className="ck-description mt-2">
            面向{p.field}，围绕“{p.name}
            ”开展理论、关键技术与工程装备协同攻关，形成可复用、可推广的技术体系。当前
            {p.phase}。
          </p>
          <h3 className="mt-4">整体进度</h3>
          <div className="ck-large-progress">
            <progress max={100} value={p.progress} aria-label="项目整体进度" />
            <b>{p.progress}%</b>
          </div>
          <p className="ck-description">
            计划进度 {Math.max(0, p.progress - 3)}%　 |　 实际进度 {p.progress}
            %　 |　 较计划 +3%
          </p>
          <div className="ck-detail-block">
            <h3>关键里程碑</h3>
            <Milestones items={p.milestones} />
          </div>
        </>
      ) : tab === "关联任务" ? (
        <div className="space-y-3">
          {[
            "样本数据整理与质量复核",
            "技术方案论证与实验验证",
            "阶段报告编制与内部评审",
          ].map((t, i) => (
            <div key={t} className="ck-detail-block">
              <h3>{t}</h3>
              <p className="ck-description">
                负责人：{p.owner} · 截止：2024-12-{20 + i * 3}
              </p>
              <Badge tone={i < done ? "green" : "blue"}>
                {i < done ? "已完成" : "进行中"}
              </Badge>
            </div>
          ))}
        </div>
      ) : tab === "关联成果" ? (
        <div className="space-y-3">
          {["阶段技术研究报告", "实验验证数据集", "关键技术方法专利交底书"].map(
            (t) => (
              <button
                key={t}
                className="ck-row-button ck-detail-block"
                onClick={() =>
                  open(
                    t,
                    <>
                      <p>关联项目：{p.name}</p>
                      <p>
                        成果来源：{p.source} · 负责人：{p.owner}
                      </p>
                      <p>
                        当前为关联成果演示记录，正式全文与版本需在来源系统中查看。
                      </p>
                    </>,
                  )
                }
              >
                <FileText size={16} className="inline mr-2" />
                {t}
                <p className="ck-description">已归档 · 查看详情</p>
              </button>
            ),
          )}
        </div>
      ) : (
        <RiskTable project={p} open={open} />
      )}
      <div className="ck-detail-actions">
        <button
          className="ck-button"
          onClick={() =>
            open(
              "来源系统连接状态",
              <>
                <p>来源系统：{p.source}</p>
                <p>项目编号：{p.code}</p>
                <p>
                  尚未配置正式系统深链与单点登录。本页保留来源、编号与快照用于对照。
                </p>
              </>,
            )
          }
        >
          查看来源系统
        </button>
        <button
          className="ck-button primary"
          onClick={() =>
            open(
              "项目完整明细",
              <div className="ck">
                <ProjectDetail project={p} open={open} />
              </div>,
            )
          }
        >
          查看明细
        </button>
      </div>
    </>
  );
}
function Milestones({ items }: { items: ProjectRecord["milestones"] }) {
  return (
    <ol className="ck-milestones">
      {items.map((m) => {
        const Icon =
          m.status === "已完成"
            ? CheckCircle2
            : m.status === "进行中"
              ? CircleDot
              : Circle;
        return (
          <li key={m.id}>
            <Icon size={17} />
            <span>{m.name}</span>
            <time>{m.date}</time>
            <Badge
              tone={
                m.status === "已完成"
                  ? "green"
                  : m.status === "进行中"
                    ? "blue"
                    : "gray"
              }
            >
              {m.status}
            </Badge>
          </li>
        );
      })}
    </ol>
  );
}
function RiskTable({
  project: p,
  open,
}: {
  project: ProjectRecord;
  open: OpenDetail;
}) {
  return (
    <table className="ck-table">
      <thead>
        <tr>
          <th>风险描述</th>
          <th>级别</th>
          <th>状态</th>
          <th>预计影响</th>
        </tr>
      </thead>
      <tbody>
        {[
          "地层压力预测不确定性",
          "关键装备可靠性不足",
          "现场试验数据不足",
          "环保审批存在不确定性",
          "关键人才流失风险",
        ].map((r, i) => (
          <tr key={r}>
            <td>
              <button
                className="ck-row-button"
                onClick={() =>
                  open(
                    r,
                    <>
                      <p>关联项目：{p.name}</p>
                      <p>
                        责任人：{p.owner} · 风险状态：
                        {i < 2 ? "处理中" : "跟踪中"}
                      </p>
                      <p>
                        应对措施：组织专项评估、补充试验数据，按里程碑复查。演示记录不涉及真实审批。
                      </p>
                    </>,
                  )
                }
              >
                {r}
              </button>
            </td>
            <td>
              <Risk value={i < 2 ? p.risk : i < 4 ? "中" : "低"} />
            </td>
            <td>
              <Badge tone={i < 2 ? "blue" : "gray"}>
                {i < 2 ? "进行中" : "跟踪中"}
              </Badge>
            </td>
            <td className="up">{i % 2 === 0 ? "进度延迟" : "成本增加"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export function ProjectsView({
  rows,
  open,
  initialId,
}: {
  rows: ProjectRecord[];
  open: OpenDetail;
  initialId?: string;
}) {
  const [selectedId, setSelectedId] = useState(initialId ?? "p1");
  const selected = rows.find((p) => p.id === selectedId) ?? rows[0];
  if (!selected) return <Empty />;
  const budget = rows.reduce((n, p) => n + p.budget, 0);
  const spent = rows.reduce(
    (n, p) => n + Math.round((p.budget * p.progress) / 100),
    0,
  );
  const progressData = Array.from({ length: 12 }, (_, i) => ({
    name: `${i + 1}月`,
    计划进度: Math.round(
      ((rows.reduce((n, p) => n + Math.max(0, p.progress - 3), 0) /
        rows.length) *
        (i + 1)) /
        12,
    ),
    实际进度: Math.round(
      ((rows.reduce((n, p) => n + p.progress, 0) / rows.length) * (i + 1)) / 12,
    ),
  }));
  return (
    <>
      <Metrics
        items={[
          {
            label: "在管重大项目",
            value: rows.length,
            icon: FolderOpen,
            tone: 1,
          },
          {
            label: "重点里程碑",
            value: rows.reduce(
              (n, p) => n + Number(p.milestone.split("/")[1]),
              0,
            ),
            icon: Flag,
            tone: 2,
          },
          {
            label: "高风险项目",
            value: rows.filter((p) => p.risk === "高").length,
            icon: TriangleAlert,
            tone: 0,
          },
          {
            label: "已完成里程碑",
            value: rows.reduce(
              (n, p) => n + Number(p.milestone.split("/")[0]),
              0,
            ),
            icon: FileText,
            tone: 3,
          },
          {
            label: "经费执行率",
            value: `${((spent / budget) * 100).toFixed(1)}%`,
            icon: CircleDollarSign,
            tone: 4,
          },
        ]}
        onInspect={(m) => open("项目指标口径", <MetricInfo metric={m} />)}
      />
      <div className="ck-project-grid">
        <div className="ck-project-left">
          <Panel title="重大项目列表">
            <div className="ck-table-wrap">
              <table className="ck-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>项目名称</th>
                    <th>里程碑</th>
                    <th>阶段摘要</th>
                    <th>风险</th>
                    <th>成果进度</th>
                    <th>来源系统</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p, i) => (
                    <tr
                      key={p.id}
                      className={selected.id === p.id ? "selected" : ""}
                    >
                      <td>{i + 1}</td>
                      <td>
                        <button
                          className="ck-row-button"
                          aria-pressed={selected.id === p.id}
                          onClick={() => setSelectedId(p.id)}
                        >
                          {p.name}
                        </button>
                      </td>
                      <td>{p.milestone}</td>
                      <td>{p.phase}</td>
                      <td>
                        <Risk value={p.risk} />
                      </td>
                      <td>
                        <span className="ck-meter">
                          <progress
                            max={100}
                            value={p.progress}
                            style={{
                              accentColor: i % 2 ? colors[1] : colors[2],
                              color: i % 2 ? colors[1] : colors[2],
                            }}
                            aria-label={`${p.name}进度`}
                          />
                          <span>{p.progress}%</span>
                        </span>
                      </td>
                      <td>{p.source}</td>
                      <td>
                        <button
                          className="ck-link"
                          onClick={() => setSelectedId(p.id)}
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <div className="ck-project-subgrid">
            <Panel
              title="里程碑时间线"
              action={
                <More
                  label="查看全部"
                  onClick={() =>
                    open(
                      `${selected.name} · 里程碑`,
                      <div className="ck">
                        <Milestones items={selected.milestones} />
                      </div>,
                    )
                  }
                />
              }
            >
              <div className="ck-timeline">
                {selected.milestones.map((m) => {
                  const Icon =
                    m.status === "已完成"
                      ? CheckCircle2
                      : m.status === "进行中"
                        ? CircleDot
                        : Circle;
                  return (
                    <div key={m.id}>
                      <time>{m.date.slice(0, 7)}</time>
                      <p>{m.shortName}</p>
                      <Icon size={18} />
                      <Badge
                        tone={
                          m.status === "已完成"
                            ? "green"
                            : m.status === "进行中"
                              ? "blue"
                              : "gray"
                        }
                      >
                        {m.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Panel>
            <Panel title="风险问题列表">
              <RiskTable project={selected} open={open} />
            </Panel>
            <Panel
              title="经费执行摘要（万元）"
              action={
                <More
                  label="详情"
                  onClick={() =>
                    open(
                      "经费执行明细",
                      <>
                        <p>项目：{selected.name}</p>
                        <p>预算：{number(selected.budget)} 万元</p>
                        <p>
                          已执行：
                          {number(
                            Math.round(
                              (selected.budget * selected.progress) / 100,
                            ),
                          )}{" "}
                          万元；本例按示例进度计算。
                        </p>
                      </>,
                    )
                  }
                />
              }
            >
              <Donut
                label="已执行"
                total={number(
                  Math.round((selected.budget * selected.progress) / 100),
                )}
                data={[
                  {
                    name: "已执行",
                    value: Math.round(
                      (selected.budget * selected.progress) / 100,
                    ),
                  },
                  {
                    name: "待执行",
                    value:
                      selected.budget -
                      Math.round((selected.budget * selected.progress) / 100),
                  },
                ]}
              />
              <div className="ck-small-stats">
                <div>
                  <b>{number(selected.budget)}</b>
                  <span>经费规模</span>
                </div>
                <div>
                  <b>{selected.progress}%</b>
                  <span>执行率</span>
                </div>
              </div>
            </Panel>
          </div>
          <Panel title="跨项目进度趋势">
            <Chart
              data={progressData}
              keys={["计划进度", "实际进度"]}
              percent
              palette={[colors[2], colors[1]]}
              height={132}
              label="年度进度均值 · 示例轨迹"
            />
          </Panel>
        </div>
        <Panel title="项目穿透详情" action={<Badge>{selected.status}</Badge>}>
          <ProjectDetail key={selected.id} project={selected} open={open} />
        </Panel>
      </div>
    </>
  );
}
