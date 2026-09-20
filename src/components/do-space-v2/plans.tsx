"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Download,
  FileText,
  GitBranch,
  GitCompareArrows,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Confirm,
  Empty,
  Field,
  Modal,
  NavLink,
  PageHeader,
  Panel,
  SearchBox,
  Tabs,
  download,
  useDo,
} from "./ui";
import type { Plan } from "./types";
import { parameterRangeErrors } from "./store";
import { dateNow } from "./seed";

export function planMarkdown(p: Plan) {
  return `# ${p.title}\n\n方案：${p.id} · V${p.version} · ${p.status}\n课题：${p.project}\n负责人：${p.owner}\n\n## 目标\n${p.goal}\n\n## 科学假设\n${p.hypothesis}\n\n## 材料与样品\n${p.materials}\n样品数量：${p.sampleCount}，重复：${p.repeats}\n对照组：${p.control}\n\n## 参数\n${p.parameters.map((v) => `- ${v.name}：${v.value} ${v.unit}；来源：${v.source}；${v.confirmed ? "已人工确认" : "待人工确认"}`).join("\n")}\n\n## 实验步骤\n${p.steps.map((v, i) => `${i + 1}. ${v}`).join("\n")}\n\n## 表征与预期输出\n${p.characterization}\n${p.output}\n\n## 风险\n${p.risks.join("\n")}\n\n## 证据\n${p.evidence.map((e) => `### ${e.title}（${e.type}）\n${e.content}`).join("\n\n")}\n\n## 审核记录\n${p.reviews.map((r) => `${r.time} ${r.author} · ${r.action}：${r.content}`).join("\n")}\n\n说明：本地演示方案。`;
}
function ParameterTable({
  plan,
  confirm = false,
}: {
  plan: Plan;
  confirm?: boolean;
}) {
  const s = useDo();
  return (
    <>
      <div className="do-table-wrap">
        <table className="do-table">
          <thead>
            <tr>
              <th>参数</th>
              <th>取值 / 单位</th>
              <th>来源</th>
              <th>确认状态</th>
            </tr>
          </thead>
          <tbody>
            {plan.parameters.map((v, i) => (
              <tr key={`${v.name}-${i}`}>
                <td>{v.name}</td>
                <td>
                  {v.value} {v.unit}
                </td>
                <td>{v.source}</td>
                <td>
                  <Badge>{v.confirmed ? "已确认" : "待人工确认"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {confirm &&
        plan.status !== "已定版" &&
        plan.parameters.some((v) => !v.confirmed) && (
          <Button
            style={{ marginTop: 12 }}
            onClick={() => {
              s.confirmParameters(plan.id);
              toast.success("参数来源与取值已人工确认");
            }}
          >
            <Check />
            确认以上参数与来源
          </Button>
        )}
    </>
  );
}
export function Artifact({
  plan,
  compact = false,
}: {
  plan: Plan;
  compact?: boolean;
}) {
  return (
    <div className="do-panel do-artifact" data-prd-id="DO-AGENT">
      <div className="do-artifact-title">
        <div className="do-row do-between">
          <span className="do-muted" style={{ fontSize: 11 }}>
            Experiment Plan
          </span>
          <Badge>{plan.status}</Badge>
        </div>
        <h2 style={{ marginTop: 9 }}>{plan.title}</h2>
        <small>
          V{plan.version} · {plan.owner} · {plan.method}
        </small>
      </div>
      <section className="do-artifact-section">
        <h3>实验目标</h3>
        <p>{plan.goal}</p>
        <h3 style={{ marginTop: 12 }}>科学假设</h3>
        <p>{plan.hypothesis}</p>
      </section>
      <section className="do-artifact-section">
        <div className="do-row do-between">
          <h3>材料与样品</h3>
          <Badge>
            {plan.sampleCount} 份 / {plan.repeats} 次重复
          </Badge>
        </div>
        <p>{plan.materials}</p>
        <p>对照组：{plan.control}</p>
      </section>
      <section className="do-artifact-section">
        <h3>变量与固定条件</h3>
        <ParameterTable plan={plan} />
      </section>
      <section className="do-artifact-section">
        <h3>实验步骤</h3>
        <ol>
          {plan.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>
      {!compact && (
        <>
          <section className="do-artifact-section">
            <h3>表征方法与预期输出</h3>
            <p>{plan.characterization}</p>
            <p>{plan.output}</p>
          </section>
          <section className="do-artifact-section">
            <h3>风险与安全要求</h3>
            {plan.risks.map((r, i) => (
              <p key={i}>{r}</p>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
function EditPlan({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const s = useDo();
  const [draft, setDraft] = useState(() => structuredClone(plan));
  const [error, setError] = useState("");
  function save() {
    if (
      !draft.title.trim() ||
      !draft.goal.trim() ||
      draft.sampleCount < 1 ||
      draft.repeats < 1 ||
      draft.parameters.some((p) => !p.name.trim() || !p.value.trim()) ||
      !draft.steps.filter(Boolean).length
    ) {
      setError("请填写方案名称、目标、有效样品数、参数和实验步骤。");
      return;
    }
    s.updatePlan(plan.id, {
      ...draft,
      status: "草稿",
      reviews: [
        ...plan.reviews,
        {
          action: "修改方案",
          content: "人工编辑方案，原审核意见保留；修改后需重新会签。",
          author: "张博士",
          time: dateNow(),
        },
      ],
      parameters: draft.parameters.map((p, i) => ({
        ...p,
        confirmed:
          JSON.stringify(p) === JSON.stringify(plan.parameters[i])
            ? p.confirmed
            : false,
      })),
    });
    toast.success("方案已保存；内容变更后需重新会签");
    onClose();
  }
  const field = (
    label: string,
    key: keyof Pick<
      Plan,
      | "title"
      | "goal"
      | "hypothesis"
      | "materials"
      | "control"
      | "characterization"
      | "output"
    >,
    long = false,
  ) => (
    <Field label={label}>
      {long ? (
        <textarea
          value={draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      ) : (
        <input
          value={draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        />
      )}
    </Field>
  );
  return (
    <Modal
      wide
      open
      onClose={onClose}
      title={`编辑实验方案 V${plan.version}`}
      footer={
        <>
          <span role="alert">{error}</span>
          <Button onClick={onClose}>取消</Button>
          <Button variant="primary" onClick={save}>
            保存方案
          </Button>
        </>
      }
    >
      <div className="do-stack">
        {field("方案名称", "title")}
        {field("实验目标", "goal", true)}
        {field("科学假设", "hypothesis", true)}
        <div className="do-form-grid">
          {field("材料 / 试剂", "materials")}
          <Field label="推荐设备">
            <select
              value={draft.equipmentId}
              onChange={(e) =>
                setDraft({ ...draft, equipmentId: e.target.value })
              }
            >
              {s.equipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="样品总数">
            <input
              type="number"
              min="1"
              value={draft.sampleCount}
              onChange={(e) =>
                setDraft({ ...draft, sampleCount: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="每组重复次数">
            <input
              type="number"
              min="1"
              value={draft.repeats}
              onChange={(e) =>
                setDraft({ ...draft, repeats: Number(e.target.value) })
              }
            />
          </Field>
          {field("对照组", "control")}
          {field("表征方法", "characterization")}
        </div>
        <h3>参数配置</h3>
        {draft.parameters.map((p, i) => (
          <div className="do-form-grid" key={i}>
            <Field label="参数名称">
              <input
                value={p.name}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    parameters: draft.parameters.map((v, j) =>
                      i === j ? { ...v, name: e.target.value } : v,
                    ),
                  })
                }
              />
            </Field>
            <Field label="参数值">
              <input
                value={p.value}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    parameters: draft.parameters.map((v, j) =>
                      i === j
                        ? {
                            ...v,
                            value: e.target.value,
                            source: "人工输入",
                            confirmed: false,
                          }
                        : v,
                    ),
                  })
                }
              />
            </Field>
            <Field label="单位">
              <input
                value={p.unit}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    parameters: draft.parameters.map((v, j) =>
                      i === j ? { ...v, unit: e.target.value } : v,
                    ),
                  })
                }
              />
            </Field>
            <Field label="参数来源">
              <select
                value={p.source}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    parameters: draft.parameters.map((v, j) =>
                      i === j
                        ? { ...v, source: e.target.value, confirmed: false }
                        : v,
                    ),
                  })
                }
              >
                {[
                  "文献",
                  "标准",
                  "计算结果",
                  "历史实验",
                  "AI 建议",
                  "人工输入",
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </Field>
          </div>
        ))}
        <Button
          onClick={() =>
            setDraft({
              ...draft,
              parameters: [
                ...draft.parameters,
                {
                  name: "",
                  value: "",
                  unit: "",
                  source: "人工输入",
                  confirmed: false,
                },
              ],
            })
          }
        >
          <Plus />
          增加参数
        </Button>
        <Field label="实验步骤（每行一步）">
          <textarea
            value={draft.steps.join("\n")}
            onChange={(e) =>
              setDraft({ ...draft, steps: e.target.value.split("\n") })
            }
          />
        </Field>
        {field("预期输出", "output", true)}
        <Field label="风险与安全要求（每行一项）">
          <textarea
            value={draft.risks.join("\n")}
            onChange={(e) =>
              setDraft({ ...draft, risks: e.target.value.split("\n") })
            }
          />
        </Field>
      </div>
    </Modal>
  );
}
export function RiskPanel({ plan }: { plan: Plan }) {
  const s = useDo();
  const eq = s.equipment.find((e) => e.id === plan.equipmentId);
  const missing = plan.parameters.filter((p) => !p.confirmed).length;
  return (
    <div className="do-stack">
      {parameterRangeErrors(plan.parameters, plan.equipmentId, s.equipment).map(
        (message) => (
          <p key={message} className="do-note warning">
            {message}，请调整参数或选择匹配设备。
          </p>
        ),
      )}
      <div className="do-note warning">
        风险检查用于辅助审核；人工定版、实验前安全审核与操作资质确认仍需分别完成。
      </div>
      {plan.risks.map((r, i) => (
        <div className="do-row" key={i}>
          <ShieldCheck size={17} color="#aa791e" />
          <span>{r}</span>
          <Badge>人工检查</Badge>
        </div>
      ))}
      <Panel title="约束与标准核对">
        <dl className="do-kv">
          <dt>设备能力</dt>
          <dd>
            {eq?.name} / {eq?.range}
            <br />
            <Badge>{eq?.status ?? "设备待匹配"}</Badge>
          </dd>
          <dt>参数来源</dt>
          <dd>{missing ? `${missing} 项待人工确认` : "全部参数已确认"}</dd>
          <dt>样品需求</dt>
          <dd>
            {plan.sampleCount} 份；每组 {plan.repeats}{" "}
            次重复，按最终变量组合复核样品数
          </dd>
          <dt>作业规程</dt>
          <dd>
            SOP-EXP-012（演示条目）：检漏、量程校验、培训资质、原始记录与异常处置
          </dd>
          <dt>安全审批</dt>
          <dd>进入编排后单独确认高风险实验与实验前审核</dd>
        </dl>
      </Panel>
    </div>
  );
}
const candidateRoutes = [
  {
    name: "低成本验证",
    count: 6,
    coverage: "1 个温度 × 2 个压力",
    hours: 4,
    risk: "中",
    info: "初步趋势验证",
  },
  {
    name: "完整参数矩阵",
    count: 36,
    coverage: "4 个温度 × 3 个压力",
    hours: 18,
    risk: "较高",
    info: "覆盖主效应与交互作用",
  },
  {
    name: "重点敏感参数验证",
    count: 18,
    coverage: "3 个温度 × 2 个压力",
    hours: 9,
    risk: "中",
    info: "聚焦敏感区间，兼顾成本",
  },
];
function CompareRoutes({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const s = useDo();
  function choose(i: number) {
    const route = candidateRoutes[i];
    const temps =
      plan.parameters[0]?.value.split("/").map((v) => v.trim()) ?? [];
    const press =
      plan.parameters[1]?.value.split("/").map((v) => v.trim()) ?? [];
    const matrix =
      i === 0
        ? [temps.slice(0, 1).join(" / "), press.join(" / ")]
        : i === 1
          ? [
              [...temps, String(Number(temps.at(-1) || 0) + 20)].join(" / "),
              [...press, String(Number(press.at(-1) || 0) + 2)].join(" / "),
            ]
          : [temps.join(" / "), press.join(" / ")];
    s.updatePlan(plan.id, {
      route: route.name,
      sampleCount: route.count,
      materials: plan.materials.replace(/18 (份|件|片)/, `${route.count} $1`),
      parameters: plan.parameters.map((p, j) =>
        j < 2
          ? { ...p, value: matrix[j], source: "AI 建议", confirmed: false }
          : p,
      ),
      status: "草稿",
      reviews: [
        ...plan.reviews,
        {
          action: "调整路线",
          content: `采用${route.name}，重新核对参数并会签。`,
          author: "张博士",
          time: dateNow(),
        },
      ],
    });
    toast.success(`已选择${route.name}，请复核参数与设备量程`);
    onClose();
  }
  return (
    <Modal wide open onClose={onClose} title="候选实验路线比较">
      <div className="do-table-wrap">
        <table className="do-table">
          <thead>
            <tr>
              <th>比较维度</th>
              {candidateRoutes.map((r, i) => (
                <th key={r.name}>
                  方案 {String.fromCharCode(65 + i)}
                  <br />
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["样品数量", ...candidateRoutes.map((r) => `${r.count} 份`)],
              ["参数覆盖", ...candidateRoutes.map((r) => r.coverage)],
              ["预计机时", ...candidateRoutes.map((r) => `${r.hours} h`)],
              ["风险等级", ...candidateRoutes.map((r) => r.risk)],
              ["预计信息量", ...candidateRoutes.map((r) => r.info)],
            ].map((row) => (
              <tr key={row[0]}>
                {row.map((v, i) => (
                  <td key={i}>{v}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td>选择路线</td>
              {candidateRoutes.map((r, i) => (
                <td key={r.name}>
                  <Button
                    variant={i === 2 ? "primary" : "default"}
                    disabled={plan.status === "已定版"}
                    onClick={() => choose(i)}
                  >
                    采用方案 {String.fromCharCode(65 + i)}
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="do-muted" style={{ marginTop: 15 }}>
        候选路线为催化温压梯度演示。最终参数可在方案编辑器中调整，选择后须重新确认与会签。
      </p>
    </Modal>
  );
}
export function Agent() {
  const s = useDo();
  const plan = s.projectPlans.find((p) => p.id === s.params.get("plan"));
  const [edit, setEdit] = useState(false);
  const [compare, setCompare] = useState(false);
  const [risk, setRisk] = useState(s.params.get("action") === "risk");
  const [chat, setChat] = useState("");
  const [progress, setProgress] = useState(plan?.status === "草稿" ? 0 : 8);
  const [generating, setGenerating] = useState(plan?.status === "草稿");
  const [tab, setTab] = useState("设计过程");
  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(
      () => setProgress((p) => Math.min(8, p + 1)),
      380,
    );
    return () => clearInterval(timer);
  }, [generating]);
  useEffect(() => {
    if (progress === 8 && generating) {
      setGenerating(false);
      if (plan) {
        s.updatePlan(plan.id, {
          status: "待确认",
          messages: [
            ...plan.messages,
            {
              role: "assistant",
              content: `已根据实验目标整理设计计划并生成结构化方案。\n采用「${plan.route}」，计划 ${plan.sampleCount} 份样品、每组 ${plan.repeats} 次重复。\n请核对右侧参数来源和设备范围，确认后进入会签。`,
            },
          ],
        });
      }
    }
  }, [progress, generating, plan, s]);
  if (!plan)
    return (
      <Empty title="未选择当前课题的实验方案">
        <NavLink to="/do-space">返回首页创建实验方案</NavLink>
      </Empty>
    );
  function send() {
    if (!chat.trim()) return;
    s.updatePlan(plan!.id, {
      messages: [
        ...plan!.messages,
        { role: "user", content: chat },
        {
          role: "assistant",
          content: `已记录调整要求：“${chat}”。\n请通过「编辑方案」核对并修改具体变量；“比较方案”可选择参数覆盖与样品规模；“检查风险”可查看设备、参数来源及安全约束。修改内容将保留在方案版本中。`,
        },
      ],
    });
    setChat("");
  }
  const process = [
    "明确实验目标",
    "读取文献与计算依据",
    "设计候选实验路线",
    "生成参数范围",
    "推荐材料与样品",
    "推荐设备与表征方法",
    "风险与标准检查",
    "生成实验方案",
    "人工审核与定版",
  ];
  return (
    <div data-prd-id="DO-AGENT">
      <PageHeader
        title="实验方案设计与生成"
        description={`${s.project.name} / ${plan.title} / V${plan.version}`}
        actions={
          <>
            <Badge>{generating ? "正在生成" : plan.status}</Badge>
            <Button
              onClick={() => {
                if (plan.status === "已定版") {
                  s.go(`/do-space/agent?plan=${s.newVersion(plan.id)}`);
                } else setEdit(true);
              }}
            >
              <Pencil />
              {plan.status === "已定版" ? "创建新版本" : "编辑方案"}
            </Button>
            <NavLink to={`/do-space/plans/${plan.id}`} primary>
              进入审核与会签
              <ArrowRight />
            </NavLink>
          </>
        }
      />
      <div className="do-workspace">
        <div className="do-stack">
          <Panel title="任务与上下文">
            <p className="do-section-label">实验目标</p>
            <p style={{ fontSize: 12 }}>{plan.goal}</p>
            <div className="do-context-list" style={{ marginTop: 22 }}>
              {plan.evidence.map((e, i) => (
                <div className="do-context-item" key={`${e.id}-${i}`}>
                  <Badge>{e.type}</Badge>
                  <strong style={{ marginTop: 5 }}>{e.title}</strong>
                  <p>{e.content.slice(0, 90)}</p>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="设计计划">
            {process.map((item, i) => (
              <div
                className={`do-plan-step ${i < progress ? "complete" : i === progress ? "current" : ""}`}
                key={item}
              >
                <span className="do-step-dot">
                  {i < progress ? <Check size={11} /> : i + 1}
                </span>
                {item}
              </div>
            ))}
          </Panel>
        </div>
        <div className="do-stack">
          <Panel
            title="实验设计 Agent"
            actions={<Sparkles size={17} color="#b4232d" />}
          >
            <Tabs
              items={["设计过程", "参数确认"]}
              value={tab}
              onChange={setTab}
            />
            {tab === "设计过程" ? (
              <div className="do-stack">
                <div>
                  <div className="do-chat-label">
                    <Bot size={15} />
                    AI4S 实验设计助手
                  </div>
                  <div className="do-message">
                    我将结合研究依据，设计可审核、可执行的实验方案。先明确变量与对照组，再检查样品、设备和安全条件。
                  </div>
                </div>
                {plan.messages.map((m, i) => (
                  <div
                    key={i}
                    className={`do-message ${m.role === "user" ? "user" : ""}`}
                  >
                    {m.content}
                  </div>
                ))}
                {generating && (
                  <div className="do-note" role="status">
                    <Sparkles
                      size={15}
                      style={{ display: "inline", marginRight: 8 }}
                    />
                    {process[progress]}…{" "}
                    <div className="do-progress" style={{ marginTop: 10 }}>
                      <i style={{ width: `${(progress / 8) * 100}%` }} />
                    </div>
                  </div>
                )}
                <div className="do-row">
                  <Button
                    disabled={generating}
                    onClick={() => setCompare(true)}
                  >
                    <GitCompareArrows />
                    比较方案
                  </Button>
                  <Button disabled={generating} onClick={() => setRisk(true)}>
                    <ShieldCheck />
                    检查风险
                  </Button>
                </div>
              </div>
            ) : (
              <ParameterTable plan={plan} confirm />
            )}
            <div className="do-chat-compose">
              <textarea
                aria-label="补充实验要求"
                placeholder="补充实验要求，例如：减少样品数量…"
                value={chat}
                onChange={(e) => setChat(e.target.value)}
              />
              <Button
                variant="primary"
                disabled={
                  !chat.trim() || generating || plan.status === "已定版"
                }
                onClick={send}
                aria-label="发送实验要求"
              >
                <Send />
              </Button>
            </div>
          </Panel>
          <div className="do-note">
            方案与参数由演示逻辑生成。AI
            建议默认待人工确认；完成会签和定版后，才能进入实验编排。
          </div>
          <Panel title="推荐设备">
            <h3>{s.equipment.find((e) => e.id === plan.equipmentId)?.name}</h3>
            <p className="do-muted" style={{ margin: "8px 0" }}>
              {s.equipment.find((e) => e.id === plan.equipmentId)?.range}
            </p>
            <NavLink to={`/do-space/equipment?equipment=${plan.equipmentId}`}>
              查看设备能力
              <ArrowRight />
            </NavLink>
          </Panel>
        </div>
        <Artifact plan={plan} />
      </div>
      {edit && (
        <EditPlan key={plan.id} plan={plan} onClose={() => setEdit(false)} />
      )}{" "}
      {compare && (
        <CompareRoutes plan={plan} onClose={() => setCompare(false)} />
      )}
      <Modal
        open={risk}
        onClose={() => setRisk(false)}
        title="风险与标准检查"
        wide
      >
        <RiskPanel plan={plan} />
      </Modal>
    </div>
  );
}

export function PlanList() {
  const s = useDo();
  const [tab, setTab] = useState(
    s.params.get("view") === "compare" ? "修改对比" : "我的方案",
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [selected, setSelected] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);
  const rows = s.projectPlans.filter(
    (p) =>
      `${p.title} ${p.id}`.includes(query) &&
      (status === "全部状态" || p.status === status) &&
      (tab === "已定版方案"
        ? p.status === "已定版"
        : tab === "会签与审核"
          ? ["待会签", "审核中", "已退回", "待确认"].includes(p.status)
          : true),
  );
  return (
    <div data-prd-id="DO-PLAN">
      <PageHeader
        title="实验方案"
        description="把实验目标沉淀为可审核、可追溯的结构化方案。"
        actions={
          <NavLink to="/do-space" primary>
            <Plus />
            新建方案
          </NavLink>
        }
      />
      <Tabs
        items={[
          "我的方案",
          "方案模板",
          "方案版本",
          "会签与审核",
          "已定版方案",
          "修改对比",
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "方案模板" ? (
        <div className="do-form-grid">
          {["催化活性验证", "页岩真三轴实验", "材料稳定性实验"].map((t) => (
            <Panel key={t} title={t}>
              <p className="do-muted" style={{ marginBottom: 18 }}>
                包含实验目标、变量矩阵、材料与样品、设备及风险检查。
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  const id = s.createPlan(
                    `${t}方案`,
                    s.project.id,
                    s.project.name,
                    t,
                  );
                  s.go(`/do-space/agent?plan=${id}`);
                }}
              >
                使用模板
                <ArrowRight />
              </Button>
            </Panel>
          ))}
        </div>
      ) : (
        <>
          <div className="do-filter">
            <SearchBox value={query} onChange={setQuery} />
            <select
              aria-label="方案状态"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {[
                "全部状态",
                "草稿",
                "待确认",
                "待会签",
                "审核中",
                "已退回",
                "已定版",
                "已废止",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <span className="do-muted">{rows.length} 个方案</span>
            <Button
              style={{ marginLeft: "auto" }}
              disabled={selected.length !== 2}
              onClick={() => setComparing(true)}
            >
              <GitCompareArrows />
              比较所选方案（{selected.length}/2）
            </Button>
          </div>
          <div className="do-table-wrap">
            <table className="do-table">
              <thead>
                <tr>
                  <th>选择</th>
                  <th>方案名称</th>
                  <th>课题</th>
                  <th>状态</th>
                  <th>版本</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`选择 ${p.title} V${p.version}`}
                        checked={selected.includes(p.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected.slice(-1), p.id]
                              : selected.filter((id) => id !== p.id),
                          )
                        }
                      />
                    </td>
                    <td className="name">
                      <button
                        className="do-link"
                        onClick={() => s.go(`/do-space/plans/${p.id}`)}
                      >
                        {p.title}
                      </button>
                      <small>{p.method}</small>
                    </td>
                    <td>{p.project}</td>
                    <td>
                      <Badge>{p.status}</Badge>
                    </td>
                    <td>V{p.version}</td>
                    <td>{p.updatedAt.slice(0, 16)}</td>
                    <td>
                      <Button
                        variant="ghost"
                        onClick={() => s.go(`/do-space/plans/${p.id}`)}
                      >
                        详情
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <Empty />}
          </div>
        </>
      )}
      <Modal
        wide
        open={comparing}
        onClose={() => setComparing(false)}
        title="方案修改对比"
      >
        <PlanDiff plans={s.plans.filter((p) => selected.includes(p.id))} />
      </Modal>
    </div>
  );
}
function PlanDiff({ plans }: { plans: Plan[] }) {
  if (plans.length < 2) return <Empty title="至少需要两个方案或版本进行对比" />;
  const [a, b] = plans;
  const fields = [
    ["实验目标", a.goal, b.goal],
    ["样品数", String(a.sampleCount), String(b.sampleCount)],
    ["对照组", a.control, b.control],
    ["实验步骤", a.steps.join(" → "), b.steps.join(" → ")],
    [
      "参数",
      a.parameters.map((v) => `${v.name} ${v.value} ${v.unit}`).join("\n"),
      b.parameters.map((v) => `${v.name} ${v.value} ${v.unit}`).join("\n"),
    ],
    ["风险", a.risks.join("\n"), b.risks.join("\n")],
  ];
  return (
    <div className="do-table-wrap">
      <table className="do-table">
        <thead>
          <tr>
            <th>字段</th>
            <th>
              {a.title} V{a.version}
            </th>
            <th>
              {b.title} V{b.version}
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map(([name, old, value]) => (
            <tr
              key={name}
              style={old !== value ? { background: "#fff8ee" } : {}}
            >
              <td>
                {name}
                {old !== value && <Badge>已修改</Badge>}
              </td>
              <td style={{ whiteSpace: "pre-wrap" }}>{old}</td>
              <td style={{ whiteSpace: "pre-wrap" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function PlanDetail({ id }: { id: string }) {
  const s = useDo();
  const p = s.projectPlans.find((p) => p.id === id);
  const [tab, setTab] = useState("方案内容");
  const [edit, setEdit] = useState(false);
  const [risk, setRisk] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [opinion, setOpinion] = useState(
    "已核对参数来源、样品需求和设备范围，同意进入下一阶段。",
  );
  const [evidence, setEvidence] = useState("");
  const [notice, setNotice] = useState("");
  if (!p)
    return (
      <Empty title="当前课题下未找到此方案">
        <NavLink to="/do-space/plans">返回方案列表</NavLink>
      </Empty>
    );
  const versions = s.projectPlans
    .filter((v) => v.familyId === p.familyId)
    .sort((a, b) => a.version - b.version);
  const rangeErrors = parameterRangeErrors(
    p.parameters,
    p.equipmentId,
    s.equipment,
  );
  const canFinalize =
    rangeErrors.length === 0 &&
    p.status === "待确认" &&
    p.parameters.every((v) => v.confirmed) &&
    p.reviews.at(-1)?.action === "同意";
  function review(action: string) {
    if (!opinion.trim()) return;
    s.review(id, action, opinion);
    setNotice(`已记录${action}，会签时间与意见已保存。`);
  }
  return (
    <div data-prd-id="DO-PLAN">
      <PageHeader
        title={p.title}
        description={`${p.project}　·　V${p.version}　·　${p.owner}　·　更新 ${p.updatedAt.slice(0, 16)}`}
        back="/do-space/plans"
        actions={
          <>
            <Badge>{p.status}</Badge>
            <Button
              onClick={() =>
                download(`${p.title}-V${p.version}.md`, planMarkdown(p))
              }
            >
              <Download />
              导出
            </Button>
            <Button
              onClick={() => s.go(`/do-space/agent?plan=${s.newVersion(id)}`)}
            >
              <GitBranch />
              生成新版本
            </Button>
            {p.status === "已定版" ? (
              <Button
                variant="primary"
                onClick={() => {
                  const task = s.createTask(id);
                  if (task) s.go(`/do-space/orchestrate?task=${task}`);
                }}
              >
                进入实验执行
                <ArrowRight />
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setEdit(true)}>
                <Pencil />
                编辑方案
              </Button>
            )}
          </>
        }
      />
      {notice && (
        <p
          role="status"
          className="do-note success"
          style={{ marginBottom: 14 }}
        >
          {notice}
        </p>
      )}
      <Tabs
        items={[
          "方案内容",
          "参数",
          "版本",
          "修改对比",
          "审核与会签",
          "证据依据",
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "方案内容" ? (
        <div className="do-two-col">
          <Artifact plan={p} />
          <div className="do-stack">
            <Panel title="方案流程">
              {p.steps.map((step, i) => (
                <div className="do-plan-step complete" key={i}>
                  <span className="do-step-dot">{i + 1}</span>
                  {step}
                </div>
              ))}
            </Panel>
            <Panel title="审核与执行">
              <p className="do-muted" style={{ marginBottom: 15 }}>
                先复核参数、完成会签，再由方案负责人确认定版。
              </p>
              <div className="do-stack">
                <Button onClick={() => setRisk(true)}>
                  <ShieldCheck />
                  检查风险与标准
                </Button>
                <Button onClick={() => setTab("审核与会签")}>
                  <FileText />
                  查看会签记录
                </Button>
                {p.status !== "已定版" && (
                  <Button variant="primary" onClick={() => setTab("参数")}>
                    核对方案参数
                  </Button>
                )}
              </div>
            </Panel>
          </div>
        </div>
      ) : tab === "参数" ? (
        <Panel
          title="参数与来源"
          actions={
            <Badge>
              {p.parameters.filter((v) => !v.confirmed).length} 项待确认
            </Badge>
          }
        >
          <ParameterTable plan={p} confirm />
          <p className="do-muted" style={{ marginTop: 15 }}>
            人工编辑参数后，确认状态与会签结论会重置。已定版内容只能创建新版本修改。
          </p>
        </Panel>
      ) : tab === "版本" ? (
        <Panel title="方案版本历史">
          <div className="do-timeline">
            {versions.map((v) => (
              <div className="do-timeline-item" key={v.id}>
                <div className="do-row">
                  <strong>
                    V{v.version} · {v.title}
                  </strong>
                  <Badge>{v.status}</Badge>
                </div>
                <p>
                  {v.updatedAt} / {v.owner} /{" "}
                  {v.reviews.at(-1)?.content || "人工编辑中的方案草稿"}
                </p>
                <Button onClick={() => s.go(`/do-space/plans/${v.id}`)}>
                  查看此版本
                </Button>
              </div>
            ))}
          </div>
        </Panel>
      ) : tab === "修改对比" ? (
        <PlanDiff plans={versions.slice(-2)} />
      ) : tab === "证据依据" ? (
        <div className="do-form-grid">
          {p.evidence.map((e, i) => (
            <Panel
              key={`${e.id}-${i}`}
              title={e.title}
              actions={<Badge>{e.type}</Badge>}
            >
              <p className="do-muted" style={{ whiteSpace: "pre-wrap" }}>
                {e.content.slice(0, 180)}
              </p>
              <Button
                style={{ marginTop: 14 }}
                onClick={() =>
                  setEvidence(
                    `${e.title}\n\n${e.content}\n\n来源编号：${e.sourceId || e.id}`,
                  )
                }
              >
                查看证据详情
              </Button>
              {e.href && <NavLink to={e.href}>打开来源</NavLink>}
            </Panel>
          ))}
        </div>
      ) : (
        <div className="do-two-col">
          <Panel title="审核与会签">
            <div className="do-timeline">
              {p.reviews.length ? (
                p.reviews.map((r, i) => (
                  <div className="do-timeline-item" key={i}>
                    <div className="do-row">
                      <strong>{r.author}</strong>
                      <Badge>{r.action}</Badge>
                    </div>
                    <p>{r.content}</p>
                    <small>{r.time}</small>
                  </div>
                ))
              ) : (
                <p className="do-muted">尚未发起会签。</p>
              )}
            </div>
            {p.status !== "已定版" && (
              <div className="do-stack" style={{ marginTop: 22 }}>
                <Field label="审核意见 / 会签说明">
                  <textarea
                    value={opinion}
                    onChange={(e) => setOpinion(e.target.value)}
                  />
                </Field>
                {p.status === "审核中" ? (
                  <div className="do-row">
                    <Button
                      disabled={!opinion.trim()}
                      onClick={() => review("退回")}
                    >
                      退回
                    </Button>
                    <Button
                      disabled={!opinion.trim()}
                      onClick={() => review("要求修改")}
                    >
                      要求修改
                    </Button>
                    <Button
                      variant="primary"
                      disabled={!opinion.trim()}
                      onClick={() => review("同意")}
                    >
                      <Check />
                      模拟审核人同意
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    disabled={
                      !opinion.trim() || p.parameters.some((v) => !v.confirmed)
                    }
                    onClick={() => review("发起会签")}
                  >
                    <Send />
                    {p.status === "已退回" ? "修改后重新提交" : "发起会签"}
                  </Button>
                )}
                <p className="do-muted">
                  {p.parameters.some((v) => !v.confirmed)
                    ? "还有参数待人工确认，请先进入“参数”页签。"
                    : "演示审核以王研究员身份记录意见，操作后立即保存。"}
                </p>
              </div>
            )}
          </Panel>
          <Panel
            title="人工定版"
            actions={<ShieldCheck size={17} color="#b4232d" />}
          >
            <div className="do-stack">
              {rangeErrors.map((message) => (
                <p className="do-note warning" key={message}>
                  {message}
                </p>
              ))}
              <p>
                定版后冻结当前版本。执行任务始终关联该版本，后续修改请生成新版本。
              </p>
              <Badge>
                {canFinalize
                  ? "审核通过，可定版"
                  : p.status === "已定版"
                    ? "已定版"
                    : "等待参数确认与会签通过"}
              </Badge>
              <Button
                variant="primary"
                disabled={!canFinalize}
                onClick={() => setConfirm("finalize")}
              >
                <CheckCircle2 />
                确认定版
              </Button>
            </div>
          </Panel>
        </div>
      )}
      {edit && <EditPlan plan={p} onClose={() => setEdit(false)} />}
      <Modal
        wide
        open={risk}
        onClose={() => setRisk(false)}
        title="风险与标准检查"
      >
        <RiskPanel plan={p} />
      </Modal>
      <Modal open={!!evidence} onClose={() => setEvidence("")} title="证据依据">
        <p style={{ whiteSpace: "pre-wrap" }}>{evidence}</p>
      </Modal>
      <Confirm
        open={confirm === "finalize"}
        onClose={() => setConfirm("")}
        title="确认实验方案定版"
        onConfirm={() => {
          if (s.finalize(id)) {
            setConfirm("");
            setNotice(`V${p.version} 已定版，现在可进入实验执行。`);
          } else setNotice("定版条件未满足，请核对参数与会签。");
        }}
      >
        <div className="do-stack">
          <strong>
            {p.title} / V{p.version}
          </strong>
          <p>
            确认已核对实验目标、全部参数来源、样品与设备要求，以及风险和标准依据。本操作冻结当前版本。
          </p>
          <Badge>参数已确认 · 会签已同意</Badge>
        </div>
      </Confirm>
    </div>
  );
}
