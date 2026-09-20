"use client";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  Download,
  FileText,
  Pause,
  Play,
  Plus,
  ShieldCheck,
  Square,
} from "lucide-react";
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
import { dispatchErrors } from "./store";
import { stages } from "./seed";
const checkNames = ["样品条件", "设备与预约", "高风险实验", "实验前审核"];
export function Orchestration() {
  const s = useDo();
  const task = s.projectTasks.find((t) => t.id === s.params.get("task"));
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  if (!task)
    return (
      <Empty title="从已定版实验方案开始编排">
        <NavLink to="/do-space/plans">选择已定版方案</NavLink>
      </Empty>
    );
  const plan = s.plans.find((p) => p.id === task.planId)!;
  const errors = dispatchErrors(task, s);
  const booking = s.bookings.find(
    (b) =>
      b.taskId === task.id &&
      b.status === "已确认" &&
      b.equipmentId === task.equipmentId,
  );
  const readonly = !["草稿", "待审核"].includes(task.status);
  const eq = s.equipment.find((e) => e.id === task.equipmentId);
  return (
    <div data-prd-id="DO-ORCHESTRATE">
      <PageHeader
        title="实验自动编排"
        description={`${task.name} / 方案 V${plan.version} / ${task.id}`}
        actions={
          <>
            <Badge>{task.status}</Badge>
            <NavLink to={`/do-space/tasks/${task.id}`}>
              查看实验任务
              <ArrowRight />
            </NavLink>
          </>
        }
      />
      <div className="do-workspace">
        <div className="do-stack">
          <Panel title="任务与依赖">
            <div className="do-timeline">
              {[
                "实验方案定版",
                "生成实验任务",
                "检查样品条件",
                "匹配实验设备",
                "仪器预约",
                "确认责任人",
                "实验前审核",
                "任务下发",
              ].map((name, i) => (
                <div className="do-timeline-item" key={name}>
                  <strong style={{ fontSize: 12 }}>{name}</strong>
                  <p>
                    {i === 0
                      ? `V${plan.version} 已冻结`
                      : i === 1
                        ? task.id
                        : i === 2
                          ? `${task.sampleIds.length} 组已关联`
                          : i === 3
                            ? eq?.name
                            : i === 4
                              ? booking
                                ? "预约已确认"
                                : "待正式预约"
                              : i === 5
                                ? task.owner
                                : i === 6
                                  ? `${task.checks.length}/4 已确认`
                                  : readonly
                                    ? "已下发"
                                    : "等待人工确认"}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
          <NavLink to={`/do-space/plans/${plan.id}`}>
            <FileText />
            查看定版方案
          </NavLink>
        </div>
        <div className="do-stack">
          <Panel
            title="编排过程与人工确认"
            actions={<ShieldCheck size={17} color="#b4232d" />}
          >
            <div className="do-stack">
              <div className="do-note">
                方案已经定版。请关联满足条件的样品与设备，确认仪器预约和安全审核后下发任务。
              </div>
              <Field label={`关联样品（至少 ${plan.sampleCount} 份）`}>
                <div className="do-list">
                  {s.projectSamples.map((sample) => (
                    <label className="do-check" key={sample.id}>
                      <input
                        disabled={readonly}
                        type="checkbox"
                        checked={task.sampleIds.includes(sample.id)}
                        onChange={(e) =>
                          s.updateTask(task.id, {
                            sampleIds: e.target.checked
                              ? [...task.sampleIds, sample.id]
                              : task.sampleIds.filter((id) => id !== sample.id),
                            checks: [],
                          })
                        }
                      />
                      <span>
                        <strong>{sample.name}</strong>
                        <br />
                        <small>
                          {sample.quantity} {sample.unit} · {sample.batch} ·{" "}
                          {sample.status}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              </Field>
              <NavLink to="/do-space/samples">
                <Plus />
                登记 / 准备样品
              </NavLink>
              <Field label="执行设备">
                <select
                  disabled={readonly}
                  value={task.equipmentId}
                  onChange={(e) =>
                    s.updateTask(task.id, {
                      equipmentId: e.target.value,
                      checks: [],
                    })
                  }
                >
                  {s.equipment.map((eq) => (
                    <option value={eq.id} key={eq.id}>
                      {eq.name} · {eq.status}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="实验负责人">
                <input
                  disabled={readonly}
                  value={task.owner}
                  onChange={(e) =>
                    s.updateTask(task.id, { owner: e.target.value })
                  }
                />
              </Field>
              <Panel
                title="仪器预约"
                actions={<Badge>{booking ? "已确认" : "待预约"}</Badge>}
              >
                {booking ? (
                  <p>
                    {booking.date} {booking.start}:00–{booking.end}:00
                  </p>
                ) : (
                  <p className="do-muted">请选择机时并完成预约审核。</p>
                )}
                <div style={{ marginTop: 12 }}>
                  <NavLink to={`/do-space/bookings?task=${task.id}`}>
                    <CalendarDays />
                    {booking ? "查看预约" : "选择机时与提交预约"}
                  </NavLink>
                </div>
              </Panel>
              <h3>实验前人工确认</h3>
              {checkNames.map((name, i) => (
                <label className="do-check" key={name}>
                  <input
                    type="checkbox"
                    disabled={readonly}
                    checked={task.checks.includes(name)}
                    onChange={(e) =>
                      s.updateTask(task.id, {
                        checks: e.target.checked
                          ? [...task.checks, name]
                          : task.checks.filter((x) => x !== name),
                      })
                    }
                  />
                  <span>
                    <strong>{name}</strong>
                    <br />
                    <small>
                      {
                        [
                          "已核对样品数量、制备状态与保存条件",
                          "已确认设备能力、开放时段与预约审批",
                          "已完成高温 / 高压 / 有害试剂等风险审核",
                          "已核对实验 SOP、人员资质、应急措施与安全审批",
                        ][i]
                      }
                    </small>
                  </span>
                </label>
              ))}
            </div>
          </Panel>
        </div>
        <div className="do-stack do-artifact">
          <Panel title="执行计划">
            <dl className="do-kv">
              <dt>方案版本</dt>
              <dd>V{plan.version} · 已定版</dd>
              <dt>批次</dt>
              <dd>{task.batch}</dd>
              <dt>负责人</dt>
              <dd>{task.owner}</dd>
              <dt>样品需求</dt>
              <dd>{plan.sampleCount} 份</dd>
              <dt>实验设备</dt>
              <dd>
                {eq?.name}
                <br />
                {eq?.range}
              </dd>
              <dt>表征方法</dt>
              <dd>{plan.characterization}</dd>
              <dt>执行步骤</dt>
              <dd>
                {plan.steps.map((x, i) => (
                  <p key={i}>
                    {i + 1}. {x}
                  </p>
                ))}
              </dd>
            </dl>
          </Panel>
          <Panel title="下发检查">
            <div className="do-stack">
              {readonly ? (
                <div className="do-note success">
                  任务已下发，进入实验任务查看进度与运行记录。
                </div>
              ) : errors.length ? (
                errors.map((e) => (
                  <div className="do-row" key={e}>
                    <AlertTriangle size={15} color="#b7791f" />
                    {e}
                  </div>
                ))
              ) : (
                <div className="do-note success">
                  所有前置条件通过，等待负责人正式确认下发。
                </div>
              )}
              {error && <p role="alert">{error}</p>}
              {readonly ? (
                <NavLink to={`/do-space/tasks/${task.id}`} primary>
                  进入实验执行
                  <ArrowRight />
                </NavLink>
              ) : (
                <Button
                  variant="primary"
                  disabled={!!errors.length}
                  onClick={() => setConfirm(true)}
                >
                  确认并下发任务
                  <ArrowRight />
                </Button>
              )}
            </div>
          </Panel>
        </div>
      </div>
      <Confirm
        open={confirm}
        onClose={() => setConfirm(false)}
        title="人工确认正式下发实验任务"
        label="确认下发（模拟）"
        disabled={!!errors.length}
        onConfirm={() => {
          if (s.dispatch(task.id)) {
            setConfirm(false);
            s.go(`/do-space/tasks/${task.id}`);
          } else setError("前置条件发生变化，请重新核对样品、设备和预约。");
        }}
      >
        <div className="do-stack">
          <strong>
            {task.name} / {task.batch}
          </strong>
          <p>
            方案 V{plan.version}、负责人 {task.owner}
            、样品和设备预约已核对。高风险实验和实验前审核已由人工确认。
          </p>
          <p className="do-note">
            本演示只推进本地任务状态，不启动真实实验设备。
          </p>
        </div>
      </Confirm>
    </div>
  );
}

export function TaskList() {
  const s = useDo();
  const [tab, setTab] = useState("全部");
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("全部负责人");
  const [newTask, setNewTask] = useState(false);
  const [planId, setPlanId] = useState("");
  const rows = s.projectTasks.filter(
    (t) =>
      (tab === "全部" || t.status === tab) &&
      `${t.name} ${t.id} ${t.batch}`.includes(query) &&
      (owner === "全部负责人" || t.owner === owner),
  );
  return (
    <div data-prd-id="DO-TASKS">
      <PageHeader
        title="实验管理"
        description="汇总实验批次、执行进度与异常，让结果回到科研上下文。"
        actions={
          <Button variant="primary" onClick={() => setNewTask(true)}>
            <Plus />
            新建实验任务
          </Button>
        }
      />
      <Tabs
        items={[
          "全部",
          "草稿",
          "待审核",
          "待执行",
          "执行中",
          "已暂停",
          "异常",
          "已完成",
          "已终止",
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="do-filter">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="搜索实验名称、批次、编号…"
        />
        <select
          aria-label="实验负责人"
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
        >
          {["全部负责人", ...new Set(s.projectTasks.map((t) => t.owner))].map(
            (v) => (
              <option key={v}>{v}</option>
            ),
          )}
        </select>
        <span className="do-muted">{rows.length} 个实验任务</span>
      </div>
      <div className="do-table-wrap">
        <table className="do-table">
          <thead>
            <tr>
              <th>实验名称 / 批次</th>
              <th>方案 / 负责人</th>
              <th>当前阶段</th>
              <th>设备</th>
              <th>状态 / 进度</th>
              <th>最近更新</th>
              <th>异常</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="name">
                  <button
                    className="do-link"
                    onClick={() => s.go(`/do-space/tasks/${t.id}`)}
                  >
                    <strong>{t.name}</strong>
                  </button>
                  <small>{t.batch}</small>
                </td>
                <td>
                  V{s.plans.find((p) => p.id === t.planId)?.version}
                  <small>{t.owner}</small>
                </td>
                <td>{stages[t.step]}</td>
                <td>{s.equipment.find((e) => e.id === t.equipmentId)?.name}</td>
                <td>
                  <Badge>{t.status}</Badge>
                  <div className="do-progress" style={{ marginTop: 8 }}>
                    <i style={{ width: `${(t.step / 6) * 100}%` }} />
                  </div>
                </td>
                <td>{t.updatedAt.slice(5, 16)}</td>
                <td>
                  {t.exceptions.some((e) => !e.resolved) ? (
                    <Badge>待处置</Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      s.go(
                        ["草稿", "待审核"].includes(t.status)
                          ? `/do-space/orchestrate?task=${t.id}`
                          : `/do-space/tasks/${t.id}`,
                      )
                    }
                  >
                    {t.status === "草稿" ? "继续编排" : "详情"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty />}
      </div>
      <Modal
        open={newTask}
        onClose={() => setNewTask(false)}
        title="从已定版方案创建任务"
        footer={
          <Button
            variant="primary"
            disabled={!planId}
            onClick={() => {
              const id = s.createTask(planId);
              if (id) s.go(`/do-space/orchestrate?task=${id}`);
            }}
          >
            创建并进入编排
            <ArrowRight />
          </Button>
        }
      >
        <Field label="已定版实验方案">
          <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
            <option value="">选择方案</option>
            {s.projectPlans
              .filter((p) => p.status === "已定版")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} V{p.version}
                </option>
              ))}
          </select>
        </Field>
        {!s.projectPlans.some((p) => p.status === "已定版") && (
          <Empty title="当前课题尚无已定版方案">
            <NavLink to="/do-space/plans">前往审核与定版</NavLink>
          </Empty>
        )}
      </Modal>
    </div>
  );
}

export function TaskDetail({ id }: { id: string }) {
  const s = useDo();
  const t = s.projectTasks.find((t) => t.id === id);
  const [tab, setTab] = useState("概览");
  const [modal, setModal] = useState("");
  const [reason, setReason] = useState("");
  const [paramName, setParamName] = useState("温度");
  const [paramValue, setParamValue] = useState("");
  const [error, setError] = useState("");
  if (!t)
    return (
      <Empty title="当前课题下未找到实验任务">
        <NavLink to="/do-space/tasks">返回实验管理</NavLink>
      </Empty>
    );
  const plan = s.plans.find((p) => p.id === t.planId)!;
  const result = s.results.find((r) => r.id === t.resultId);
  const active = ["待执行", "执行中"].includes(t.status);
  const unhandled = t.exceptions.filter((e) => !e.resolved);
  const running = ["执行中", "已暂停", "异常"].includes(t.status);
  function confirm() {
    if (!t) return;
    if (modal === "pause") s.pause(id);
    if (modal === "resume" && !s.resume(id)) {
      setError("仍有未处理异常，无法恢复。");
      return;
    }
    if (modal === "exception") s.raiseException(id, reason);
    if (modal === "resolve") s.resolveException(id, reason);
    if (modal === "terminate") s.terminate(id, reason);
    if (
      modal === "parameter" &&
      !s.changeParameter(id, paramName, paramValue, reason)
    ) {
      setError("参数无效或超出设备量程，请核对数值、单位和设备能力。");
      return;
    }
    if (modal === "start") s.advance(id);
    setModal("");
    setReason("");
    setError("");
  }
  return (
    <div data-prd-id="DO-TASKS">
      <PageHeader
        title={t.name}
        description={`${t.id} / ${t.batch} / ${s.project.name} / 方案 V${plan.version}`}
        back="/do-space/tasks"
        actions={
          <>
            <Badge>{t.status}</Badge>
            <Button
              onClick={() =>
                download(
                  `${t.id}-运行记录.json`,
                  JSON.stringify(t, null, 2),
                  "application/json",
                )
              }
            >
              <Download />
              导出记录
            </Button>
            {["草稿", "待审核"].includes(t.status) ? (
              <NavLink to={`/do-space/orchestrate?task=${id}`} primary>
                继续编排
                <ArrowRight />
              </NavLink>
            ) : active ? (
              <>
                <Button
                  onClick={() => {
                    setModal("pause");
                    setError("");
                  }}
                  disabled={t.status !== "执行中"}
                >
                  <Pause />
                  暂停
                </Button>
                <Button
                  variant="primary"
                  onClick={() =>
                    t.status === "待执行" ? setModal("start") : s.advance(id)
                  }
                >
                  <Play />
                  {t.status === "待执行"
                    ? "开始执行（模拟）"
                    : t.step === 3
                      ? "模拟完成实验并采集结果"
                      : t.step === 4
                        ? "推进至表征分析"
                        : "完成实验记录"}
                </Button>
              </>
            ) : ["异常", "已暂停"].includes(t.status) ? (
              <Button
                variant="primary"
                disabled={!!unhandled.length}
                onClick={() => setModal("resume")}
              >
                <Play />
                确认恢复
              </Button>
            ) : t.resultId ? (
              <NavLink to={`/do-space/analysis?result=${t.resultId}`} primary>
                进入表征分析
                <ArrowRight />
              </NavLink>
            ) : null}
          </>
        }
      />
      {unhandled.length > 0 && (
        <div className="do-note warning" style={{ marginBottom: 18 }}>
          <div className="do-row do-between">
            <div>
              <strong>实验异常 · 执行已阻断</strong>
              <p>
                {unhandled[0].description} / 阶段：{unhandled[0].stage}
              </p>
            </div>
            <Button
              onClick={() => {
                setTab("异常");
                setReason("");
              }}
            >
              查看异常与处置
            </Button>
          </div>
        </div>
      )}
      <Panel>
        <div className="do-row do-between">
          {stages.map((stage, i) => (
            <div
              className={`do-plan-step ${i < t.step ? "complete" : i === t.step ? "current" : ""}`}
              key={stage}
            >
              <span className="do-step-dot">
                {i < t.step ? <Check size={11} /> : i + 1}
              </span>
              {stage}
            </div>
          ))}
        </div>
      </Panel>
      <div style={{ height: 15 }} />
      <Tabs
        items={[
          "概览",
          "实验步骤",
          "样品",
          "设备",
          "参数",
          "运行记录",
          "异常",
          "原始数据",
          "结果",
          "关联记录",
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === "概览" ? (
        <div className="do-two-col">
          <Panel title="实验概览">
            <dl className="do-kv">
              <dt>实验目标</dt>
              <dd>{plan.goal}</dd>
              <dt>课题</dt>
              <dd>{s.project.name}</dd>
              <dt>方案版本</dt>
              <dd>
                <NavLink to={`/do-space/plans/${plan.id}`}>
                  {plan.title} V{plan.version}
                </NavLink>
              </dd>
              <dt>负责人</dt>
              <dd>{t.owner}</dd>
              <dt>开始时间</dt>
              <dd>{t.createdAt}</dd>
              <dt>最近更新</dt>
              <dd>{t.updatedAt}</dd>
              <dt>当前阶段</dt>
              <dd>{stages[t.step]}</dd>
              <dt>设备</dt>
              <dd>{s.equipment.find((e) => e.id === t.equipmentId)?.name}</dd>
              <dt>样品</dt>
              <dd>
                {s.samples
                  .filter((x) => t.sampleIds.includes(x.id))
                  .map((x) => x.name)
                  .join("、") || "待关联"}
              </dd>
            </dl>
          </Panel>
          <Panel title="演示执行控制">
            <div className="do-stack">
              <p className="do-muted">
                手动推进实验阶段可观察采集、分析与结果状态。数据均为本地模拟。
              </p>
              <Button
                disabled={t.status !== "执行中"}
                onClick={() => {
                  setModal("exception");
                  setReason(
                    "设备温度波动超出设定范围，当前批次结果可能受影响。",
                  );
                }}
              >
                <AlertTriangle />
                模拟实验异常
              </Button>
              <Button
                disabled={!["执行中", "已暂停"].includes(t.status)}
                onClick={() => {
                  setModal("parameter");
                  setParamName(t.parameters[0]?.name || "");
                  setParamValue(t.parameters[0]?.value || "");
                  setReason("");
                }}
              >
                记录参数变更
              </Button>
              <Button
                variant="danger"
                disabled={!running && !active}
                onClick={() => {
                  setModal("terminate");
                  setReason("");
                }}
              >
                <Square />
                终止实验
              </Button>
            </div>
          </Panel>
        </div>
      ) : tab === "实验步骤" ? (
        <Panel title="方案执行步骤">
          <div className="do-timeline">
            {plan.steps.map((step, i) => (
              <div className="do-timeline-item" key={i}>
                <strong>
                  {i + 1}. {step}
                </strong>
                <p>
                  依据方案 V{plan.version}；记录由 {t.owner} 汇总
                </p>
                <Badge>
                  {t.step >= 4
                    ? "已完成"
                    : t.step === 3
                      ? "实验执行中"
                      : "待执行"}
                </Badge>
              </div>
            ))}
          </div>
        </Panel>
      ) : tab === "样品" ? (
        <div className="do-form-grid">
          {s.samples
            .filter((x) => t.sampleIds.includes(x.id))
            .map((x) => (
              <Panel
                title={x.name}
                key={x.id}
                actions={<Badge>{x.status}</Badge>}
              >
                <dl className="do-kv">
                  <dt>批次</dt>
                  <dd>{x.batch}</dd>
                  <dt>保存条件</dt>
                  <dd>{x.storage}</dd>
                  <dt>位置</dt>
                  <dd>{x.location}</dd>
                  <dt>来源</dt>
                  <dd>
                    {x.lims} / {x.eln}
                  </dd>
                </dl>
                <NavLink to="/do-space/samples">样品与流转记录</NavLink>
              </Panel>
            ))}
        </div>
      ) : tab === "设备" ? (
        <Panel title={s.equipment.find((e) => e.id === t.equipmentId)?.name}>
          <p className="do-muted">
            {s.equipment.find((e) => e.id === t.equipmentId)?.range}
          </p>
          <div className="do-row" style={{ marginTop: 18 }}>
            <NavLink to={`/do-space/equipment?equipment=${t.equipmentId}`}>
              设备详情
            </NavLink>
            <NavLink to={`/do-space/bookings?task=${t.id}`}>关联预约</NavLink>
          </div>
        </Panel>
      ) : tab === "参数" ? (
        <div className="do-stack">
          <Panel
            title="实际执行参数"
            actions={
              <Button
                disabled={!["执行中", "已暂停"].includes(t.status)}
                onClick={() => {
                  setModal("parameter");
                  setParamName(t.parameters[0]?.name || "");
                  setParamValue("");
                  setReason("");
                }}
              >
                申请参数变更
              </Button>
            }
          >
            <div className="do-table-wrap">
              <table className="do-table">
                <thead>
                  <tr>
                    <th>参数</th>
                    <th>当前值</th>
                    <th>单位</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {t.parameters.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>{p.value}</td>
                      <td>{p.unit}</td>
                      <td>{p.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
          <Panel title="参数变更记录">
            {t.changes.length ? (
              t.changes.map((c, i) => (
                <div className="do-log" key={i}>
                  <strong>
                    {c.name}：{c.old} → {c.value}
                  </strong>
                  <p>原因：{c.reason}</p>
                  <small>
                    {c.author} / {c.time} /{" "}
                    {c.approved ? "已审批确认" : "待审批"}
                  </small>
                </div>
              ))
            ) : (
              <p className="do-muted">尚无参数变更，实际参数与定版方案一致。</p>
            )}
          </Panel>
        </div>
      ) : tab === "运行记录" ? (
        <Panel title="实验运行记录">
          {t.logs.map((line, i) => (
            <div className="do-log" key={i}>
              {line}
            </div>
          ))}
        </Panel>
      ) : tab === "异常" ? (
        <div className="do-stack">
          {t.exceptions.length ? (
            t.exceptions.map((e) => (
              <Panel
                key={e.id}
                title={`${e.stage} / ${e.id}`}
                actions={
                  <Badge>{e.resolved ? "已完成处置" : "异常待处置"}</Badge>
                }
              >
                <div className="do-stack">
                  <p>{e.description}</p>
                  <dl className="do-kv">
                    <dt>影响</dt>
                    <dd>当前批次结果可能受影响，关联样品需复核。</dd>
                    <dt>来源</dt>
                    <dd>设备状态采集（模拟）</dd>
                    <dt>发现时间</dt>
                    <dd>{e.time}</dd>
                    <dt>处置记录</dt>
                    <dd>{e.resolution || "尚未提交"}</dd>
                  </dl>
                  <p className="do-note warning">
                    建议暂停当前实验、检查控制系统并记录样品状态。Agent
                    不会自动解除安全约束。
                  </p>
                  <div className="do-row">
                    <NavLink
                      to={`/do-space/equipment?equipment=${t.equipmentId}`}
                    >
                      查看设备
                    </NavLink>
                    {!e.resolved && (
                      <>
                        <Button onClick={() => setModal("pause")}>
                          暂停任务
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => {
                            setModal("resolve");
                            setReason("");
                          }}
                        >
                          提交异常处理
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Panel>
            ))
          ) : (
            <Empty title="当前实验没有异常记录" />
          )}
        </div>
      ) : tab === "原始数据" ? (
        <Panel title="原始数据与来源">
          {result ? (
            <div className="do-stack">
              <div className="do-row do-between">
                <strong>{result.name}</strong>
                <Button
                  onClick={() =>
                    download(
                      `${result.id}.csv`,
                      "x,sample_A,sample_B,computed\n" +
                        result.points
                          .map((p) => `${p.x},${p.a},${p.b},${p.computed}`)
                          .join("\n"),
                      "text/csv;charset=utf-8",
                    )
                  }
                >
                  <Download />
                  下载原始 CSV
                </Button>
              </div>
              <p>
                {result.method} / {result.points.length} 个测量点 /{" "}
                {result.createdAt}
              </p>
              <p className="do-note">
                来源：实验设备数据模拟采集，原始测量点保持不变。
              </p>
              <NavLink to={`/do-space/analysis?result=${result.id}`} primary>
                打开表征分析
                <ArrowRight />
              </NavLink>
            </div>
          ) : (
            <Empty title="等待实验结果采集">
              从上方推进实验执行后生成本地模拟数据。
            </Empty>
          )}
        </Panel>
      ) : tab === "结果" ? (
        <Panel title="实验结果">
          {result ? (
            <div className="do-stack">
              <Badge>
                {result.confirmed ? "已确认正式结论" : "待人工分析与确认"}
              </Badge>
              <p className="do-report">
                {result.report ||
                  "原始数据已采集，请进入表征分析，生成实验结果摘要。"}
              </p>
              <NavLink to={`/do-space/analysis?result=${result.id}`} primary>
                表征分析与实验结论
                <ArrowRight />
              </NavLink>
            </div>
          ) : (
            <Empty title="实验结果尚未生成" />
          )}
        </Panel>
      ) : (
        <Panel title="关联记录与追溯">
          <div className="do-stack">
            <NavLink to={`/do-space/plans/${plan.id}`}>
              定版方案 V{plan.version}
            </NavLink>
            <NavLink to={`/do-space/bookings?task=${t.id}`}>
              设备预约记录
            </NavLink>
            <NavLink to="/do-space/samples">ELN / LIMS 样品与原始记录</NavLink>
            {s.transfers
              .filter((h) => h.resultId === t.resultId)
              .map((h) => (
                <div className="do-log" key={h.id}>
                  <strong>{h.direction}</strong>
                  <p>
                    {h.time} / {h.targetId}
                  </p>
                  <NavLink to={h.href}>打开下游草稿</NavLink>
                </div>
              ))}
          </div>
        </Panel>
      )}
      <Confirm
        open={!!modal}
        onClose={() => setModal("")}
        title={
          (
            {
              pause: "人工确认暂停实验",
              resume: "人工确认恢复实验",
              exception: "记录实验异常",
              resolve: "提交异常处置与复核",
              terminate: "终止实验任务",
              parameter: "确认参数变更",
              start: "人工确认开始执行",
            } as Record<string, string>
          )[modal] || "确认操作"
        }
        onConfirm={confirm}
        disabled={
          (["exception", "resolve", "terminate", "parameter"].includes(modal) &&
            !reason.trim()) ||
          (modal === "parameter" && !paramValue.trim())
        }
      >
        <div className="do-stack">
          <strong>{t.name}</strong>
          {modal === "parameter" && (
            <>
              <Field label="变更参数">
                <select
                  value={paramName}
                  onChange={(e) => setParamName(e.target.value)}
                >
                  {t.parameters.map((p) => (
                    <option key={p.name}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <p>
                原值：{t.parameters.find((p) => p.name === paramName)?.value}
              </p>
              <Field label="新值">
                <input
                  value={paramValue}
                  onChange={(e) => setParamValue(e.target.value)}
                />
              </Field>
              <p className="do-note warning">
                确认表示已审批此变更。记录原值、新值、原因、修改人和时间；定版方案不会被覆盖。
              </p>
            </>
          )}
          {["exception", "resolve", "terminate", "parameter"].includes(
            modal,
          ) ? (
            <Field
              label={
                modal === "resolve"
                  ? "处置方案、设备复核与样品检查结果"
                  : modal === "parameter"
                    ? "参数变更原因"
                    : "原因 / 说明"
              }
            >
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="请填写具体说明"
              />
            </Field>
          ) : (
            <p>
              {modal === "resume"
                ? "确认设备与样品已复核，异常已处置，可以恢复当前实验。"
                : modal === "pause"
                  ? "暂停后保留当前阶段与记录，恢复需要再次人工确认。"
                  : "确认人员、设备、预约和安全条件后开始模拟执行。"}
            </p>
          )}
          {modal === "resolve" && (
            <p className="do-note">
              提交处理后任务保持暂停，需再次人工确认才能恢复。
            </p>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
      </Confirm>
    </div>
  );
}
