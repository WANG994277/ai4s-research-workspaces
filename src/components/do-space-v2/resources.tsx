"use client";
import { useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Link2,
  Plus,
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
import { bookingError } from "./store";
import { dateNow } from "./seed";
import type { Equipment as EquipmentType, Booking } from "./types";
const sampleStatuses = [
  "待制备",
  "已制备",
  "待实验",
  "实验中",
  "待检测",
  "检测中",
  "已完成",
  "已归档",
  "异常",
];
export function Samples() {
  const s = useDo();
  const [tab, setTab] = useState("样品管理");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [type, setType] = useState("全部类型");
  const [selected, setSelected] = useState("");
  const [creating, setCreating] = useState(false);
  const [record, setRecord] = useState("");
  const [trace, setTrace] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    batch: "S20260921",
    type: "粉末",
    quantity: 18,
    unit: "份",
    status: "待制备",
    storage: "干燥避光 / 室温",
    location: "实验楼 A · 样品柜 03",
    taskId: "",
    eln: "",
    lims: "",
  });
  const sample = s.projectSamples.find((x) => x.id === selected);
  const rows = s.projectSamples.filter(
    (x) =>
      `${x.name} ${x.batch} ${x.id}`.includes(query) &&
      (status === "全部状态" || x.status === status) &&
      (type === "全部类型" || x.type === type),
  );
  function save() {
    if (
      !draft.name.trim() ||
      !draft.batch.trim() ||
      draft.quantity < 1 ||
      !draft.location.trim()
    ) {
      setError("请填写样品名称、批次、有效数量和保存位置。");
      return;
    }
    const id = s.addSample({
      ...draft,
      projectId: s.project.id,
      traces: [`${dateNow()} · 张博士登记样品摘要，来源台账待核实`],
    });
    setCreating(false);
    setSelected(id);
    setError("");
  }
  return (
    <div data-prd-id="DO-SAMPLES">
      <PageHeader
        title="实验样品与记录"
        description="建立样品、实验与检测的关联，追溯每一次流转。"
        actions={
          <>
            <Button
              onClick={() =>
                download(
                  "样品摘要.csv",
                  "编号,名称,批次,状态,数量,位置\n" +
                    rows
                      .map((x) =>
                        [
                          x.id,
                          x.name,
                          x.batch,
                          x.status,
                          x.quantity,
                          x.location,
                        ]
                          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                          .join(","),
                      )
                      .join("\n"),
                  "text/csv;charset=utf-8",
                )
              }
            >
              <Download />
              导出摘要
            </Button>
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus />
              登记样品
            </Button>
          </>
        }
      />
      <Tabs
        items={["样品管理", "批次管理", "流转记录", "ELN / LIMS 关联"]}
        value={tab}
        onChange={setTab}
      />
      <p className="do-note" style={{ marginBottom: 16 }}>
        AI4S 展示样品与记录摘要并关联实验任务；正式样品台账、原始实验记录仍以
        ELN / LIMS 为权威来源。
      </p>
      <div className="do-filter">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="搜索样品名称、批次、编号…"
        />
        <select
          aria-label="样品类型"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {["全部类型", "粉末", "固体样品", "液体", "薄膜"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="样品状态"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["全部状态", ...sampleStatuses].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      {tab === "样品管理" || tab === "ELN / LIMS 关联" ? (
        <div className="do-table-wrap">
          <table className="do-table">
            <thead>
              <tr>
                {[
                  "样品名称",
                  "类型 / 批次",
                  "当前状态",
                  "数量",
                  "保存条件 / 位置",
                  tab === "样品管理" ? "关联实验" : "权威来源",
                  "操作",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id}>
                  <td>
                    <strong>{x.name}</strong>
                    <small>{x.id}</small>
                  </td>
                  <td>
                    {x.type}
                    <small>{x.batch}</small>
                  </td>
                  <td>
                    <Badge>{x.status}</Badge>
                  </td>
                  <td>
                    {x.quantity} {x.unit}
                  </td>
                  <td>
                    {x.storage}
                    <small>{x.location}</small>
                  </td>
                  <td>
                    {tab === "样品管理" ? (
                      x.taskId ? (
                        <NavLink to={`/do-space/tasks/${x.taskId}`}>
                          {x.taskId}
                        </NavLink>
                      ) : (
                        "尚未关联"
                      )
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setRecord(
                            `${x.eln || "ELN 待关联"} / ${x.lims || "LIMS 待关联"}\n\n样品：${x.name}\n批次：${x.batch}\n记录摘要：样品制备、保存条件与检测结果登记。\n来源：ELN / LIMS 演示适配器。\n当前未连接外部系统，展示本地权威记录模拟摘要。`,
                          )
                        }
                      >
                        <Link2 />
                        查看来源摘要
                      </Button>
                    )}
                  </td>
                  <td>
                    <Button variant="ghost" onClick={() => setSelected(x.id)}>
                      详情
                      <ArrowRight />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <Empty />}
        </div>
      ) : tab === "批次管理" ? (
        <div className="do-form-grid">
          {[...new Set(rows.map((x) => x.batch))].map((batch) => (
            <Panel title={batch} key={batch}>
              <div className="do-stack">
                {rows
                  .filter((x) => x.batch === batch)
                  .map((x) => (
                    <button
                      className="do-sample-choice"
                      key={x.id}
                      onClick={() => setSelected(x.id)}
                    >
                      <strong>{x.name}</strong>
                      <p>
                        {x.quantity} {x.unit} / {x.location}
                      </p>
                      <Badge>{x.status}</Badge>
                    </button>
                  ))}
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <Panel title="样品流转时间线">
          <div className="do-timeline">
            {rows.flatMap((x) =>
              x.traces.map((t, i) => (
                <div className="do-timeline-item" key={`${x.id}-${i}`}>
                  <strong>{x.name}</strong>
                  <p>{t}</p>
                  <Button variant="ghost" onClick={() => setSelected(x.id)}>
                    查看样品
                  </Button>
                </div>
              )),
            )}
          </div>
        </Panel>
      )}
      <Modal
        drawer
        open={!!sample}
        onClose={() => setSelected("")}
        title={sample?.name ?? "样品详情"}
      >
        {sample && (
          <div className="do-stack">
            <Badge>{sample.status}</Badge>
            <dl className="do-kv">
              <dt>样品编号</dt>
              <dd>{sample.id}</dd>
              <dt>批次</dt>
              <dd>{sample.batch}</dd>
              <dt>保存条件</dt>
              <dd>{sample.storage}</dd>
              <dt>当前位置</dt>
              <dd>{sample.location}</dd>
              <dt>数量</dt>
              <dd>
                {sample.quantity} {sample.unit}
              </dd>
              <dt>所属检测</dt>
              <dd>{sample.lims || "LIMS 待关联"}</dd>
              <dt>原始记录</dt>
              <dd>{sample.eln || "ELN 待关联"}</dd>
            </dl>
            <Field label="样品状态摘要">
              <select
                value={sample.status}
                onChange={(e) =>
                  s.updateSample(sample.id, {
                    status: e.target.value,
                    traces: [
                      ...sample.traces,
                      `${dateNow()} · 张博士更新状态摘要：${sample.status} → ${e.target.value}`,
                    ],
                  })
                }
              >
                {sampleStatuses.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="关联实验任务">
              <select
                value={sample.taskId}
                onChange={(e) =>
                  s.updateSample(sample.id, {
                    taskId: e.target.value,
                    traces: [
                      ...sample.traces,
                      `${dateNow()} · 关联任务 ${e.target.value || "已取消关联"}`,
                    ],
                  })
                }
              >
                <option value="">未关联</option>
                {s.projectTasks.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <h3>流转记录</h3>
            {sample.traces.map((t, i) => (
              <div className="do-log" key={i}>
                {t}
              </div>
            ))}
            <Field label="记录流转说明">
              <textarea
                placeholder="例如：从制样室移交到测试中心，接收人李工"
                value={trace}
                onChange={(e) => setTrace(e.target.value)}
              />
            </Field>
            <Button
              disabled={!trace.trim()}
              onClick={() => {
                s.updateSample(sample.id, {
                  traces: [...sample.traces, `${dateNow()} · 张博士：${trace}`],
                });
                setTrace("");
              }}
            >
              保存流转记录
            </Button>
          </div>
        )}
      </Modal>
      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="登记样品摘要"
        wide
        footer={
          <>
            <span role="alert">{error}</span>
            <Button onClick={() => setCreating(false)}>取消</Button>
            <Button variant="primary" onClick={save}>
              保存样品
            </Button>
          </>
        }
      >
        <div className="do-form-grid">
          {(
            [
              ["样品名称", "name"],
              ["批次", "batch"],
              ["保存条件", "storage"],
              ["当前位置", "location"],
              ["ELN 记录编号", "eln"],
              ["LIMS 样品编号", "lims"],
            ] as const
          ).map(([label, key]) => (
            <Field label={label} key={key}>
              <input
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </Field>
          ))}
          <Field label="样品类型">
            <select
              value={draft.type}
              onChange={(e) => setDraft({ ...draft, type: e.target.value })}
            >
              {["粉末", "固体样品", "液体", "薄膜"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="数量">
            <input
              type="number"
              min="1"
              value={draft.quantity}
              onChange={(e) =>
                setDraft({ ...draft, quantity: Number(e.target.value) })
              }
            />
          </Field>
          <Field label="单位">
            <input
              value={draft.unit}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
            />
          </Field>
          <Field label="初始状态">
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              {sampleStatuses.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
      <Modal open={!!record} onClose={() => setRecord("")} title="来源系统记录">
        <p style={{ whiteSpace: "pre-wrap" }}>{record}</p>
      </Modal>
    </div>
  );
}

export function Equipment() {
  const s = useDo();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部状态");
  const [type, setType] = useState("全部类型");
  const [tab, setTab] = useState("设备目录");
  const [selected, setSelected] = useState(s.params.get("equipment") || "");
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<EquipmentType, "id">>({
    name: "",
    type: "催化反应",
    status: "空闲",
    access: "待核实",
    range: "",
    organization: "能源催化实验室",
    sharing: "课题组内",
    hours: "周一至周五 08:00–18:00",
    condition: "需操作培训",
    owner: "",
    source: "人工登记摘要",
  });
  const [error, setError] = useState("");
  const item = s.equipment.find((e) => e.id === selected);
  const rows = s.equipment.filter(
    (e) =>
      `${e.name} ${e.id} ${e.range}`.includes(query) &&
      (status === "全部状态" || e.status === status) &&
      (type === "全部类型" || e.type === type),
  );
  return (
    <div data-prd-id="DO-EQUIPMENT">
      <PageHeader
        title="实验设备纳管与共享"
        description="从实验任务出发，查看设备能力、可用状态与共享条件。"
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <Plus />
            登记设备
          </Button>
        }
      />
      <Tabs
        items={["设备目录", "设备能力", "接入状态", "共享管理"]}
        value={tab}
        onChange={setTab}
      />
      <div className="do-filter">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="搜索设备名称、编号、能力…"
        />
        <select
          aria-label="设备分类"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {["全部类型", ...new Set(s.equipment.map((e) => e.type))].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
        <select
          aria-label="设备状态"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {["全部状态", "空闲", "使用中", "维护中", "停用"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      <div className="do-table-wrap">
        <table className="do-table">
          <thead>
            <tr>
              <th>设备名称</th>
              <th>设备分类</th>
              <th>业务状态</th>
              <th>接入状态</th>
              <th>
                {tab === "共享管理"
                  ? "共享范围"
                  : tab === "接入状态"
                    ? "来源系统"
                    : "能力 / 量程"}
              </th>
              <th>所属单位</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>{e.name}</strong>
                  <small>{e.id}</small>
                </td>
                <td>{e.type}</td>
                <td>
                  <Badge>{e.status}</Badge>
                </td>
                <td>
                  <Badge>{e.access}</Badge>
                </td>
                <td>
                  {tab === "共享管理"
                    ? e.sharing
                    : tab === "接入状态"
                      ? e.source
                      : e.range}
                </td>
                <td>{e.organization}</td>
                <td>
                  <Button variant="ghost" onClick={() => setSelected(e.id)}>
                    详情
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty />}
      </div>
      <div className="do-note" style={{ marginTop: 18 }}>
        业务状态与接入状态分别记录。未接入设备可展示人工核实摘要，状态与能力以来源系统和设备负责人确认为准。
      </div>
      <Modal
        drawer
        open={!!item}
        onClose={() => setSelected("")}
        title={item?.name ?? "设备详情"}
        footer={
          item && (
            <NavLink to={`/do-space/bookings?equipment=${item.id}`} primary>
              <CalendarDays />
              查看可预约时间
            </NavLink>
          )
        }
      >
        {item && (
          <div className="do-stack">
            <div className="do-row">
              <Badge>{item.status}</Badge>
              <Badge>{item.access}</Badge>
            </div>
            <dl className="do-kv">
              <dt>设备编号</dt>
              <dd>{item.id}</dd>
              <dt>能力与参数</dt>
              <dd>{item.range}</dd>
              <dt>所属单位</dt>
              <dd>{item.organization}</dd>
              <dt>共享范围</dt>
              <dd>{item.sharing}</dd>
              <dt>开放时段</dt>
              <dd>{item.hours}</dd>
              <dt>使用条件</dt>
              <dd>{item.condition}</dd>
              <dt>预约规则</dt>
              <dd>工作日开放，提前申请，管理员确认后生效。</dd>
              <dt>设备负责人</dt>
              <dd>{item.owner}</dd>
              <dt>来源系统</dt>
              <dd>{item.source}</dd>
            </dl>
            <Panel title="运行数据摘要">
              <p className="do-muted">
                {item.access === "已接入"
                  ? "演示采集：2026-09-21 10:30 / 最近心跳正常 / 当前无新告警。"
                  : "尚未完整接入，实时运行数据不可用；请由负责人核实。"}
              </p>
            </Panel>
            <Panel title="关联预约">
              {s.bookings
                .filter((b) => b.equipmentId === item.id)
                .map((b) => (
                  <p key={b.id}>
                    {b.date} {b.start}:00–{b.end}:00 <Badge>{b.status}</Badge>
                  </p>
                ))}
              {!s.bookings.some((b) => b.equipmentId === item.id) && (
                <p className="do-muted">暂无已登记预约</p>
              )}
            </Panel>
          </div>
        )}
      </Modal>
      <Modal
        wide
        open={creating}
        onClose={() => setCreating(false)}
        title="登记设备摘要"
        footer={
          <>
            <span role="alert">{error}</span>
            <Button
              variant="primary"
              onClick={() => {
                if (
                  !draft.name.trim() ||
                  !draft.range.trim() ||
                  !draft.owner.trim()
                ) {
                  setError("请填写设备名称、能力范围和负责人。");
                  return;
                }
                s.addEquipment(draft);
                setCreating(false);
                setError("");
              }}
            >
              保存设备
            </Button>
          </>
        }
      >
        <div className="do-form-grid">
          {(
            [
              ["设备名称", "name"],
              ["设备分类", "type"],
              ["能力与参数", "range"],
              ["所属单位", "organization"],
              ["共享范围", "sharing"],
              ["使用条件", "condition"],
              ["负责人", "owner"],
              ["来源系统", "source"],
            ] as const
          ).map(([label, key]) => (
            <Field label={label} key={key}>
              <input
                value={draft[key]}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
              />
            </Field>
          ))}
          <Field label="业务状态">
            <select
              value={draft.status}
              onChange={(e) => setDraft({ ...draft, status: e.target.value })}
            >
              {["空闲", "使用中", "维护中", "停用"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="接入状态">
            <select
              value={draft.access}
              onChange={(e) => setDraft({ ...draft, access: e.target.value })}
            >
              {["已接入", "部分接入", "未接入", "待核实"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function dateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function Bookings() {
  const s = useDo();
  const task = s.projectTasks.find((t) => t.id === s.params.get("task"));
  const [tab, setTab] = useState("预约日历");
  const [query, setQuery] = useState("");
  const [week, setWeek] = useState(0);
  const [equipmentId, setEquipment] = useState(
    task?.equipmentId || s.params.get("equipment") || "EQ-01",
  );
  const [planId, setPlan] = useState(
    task?.planId || s.projectPlans.find((p) => p.status === "已定版")?.id || "",
  );
  const [taskId, setTaskId] = useState(task?.id || "");
  const [sampleId, setSample] = useState(
    task?.sampleIds[0] || s.projectSamples[0]?.id || "",
  );
  const [date, setDate] = useState("2026-09-22");
  const [start, setStart] = useState(8);
  const [end, setEnd] = useState(10);
  const [owner, setOwner] = useState(task?.owner || "张博士");
  const [purpose, setPurpose] = useState("参数梯度验证与样品检测");
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<{ id: string; status: string } | null>(
    null,
  );
  const [selected, setSelected] = useState<Booking | null>(null);
  const device = s.equipment.find((e) => e.id === equipmentId);
  const data = {
    projectId: s.project.id,
    planId,
    taskId,
    equipmentId,
    date,
    start,
    end,
    sampleId,
    owner,
    purpose,
  };
  const error = bookingError(data, s);
  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date("2026-09-21T12:00:00");
    d.setDate(d.getDate() + week * 7 + i);
    return dateStr(d);
  });
  const visibleBookings = s.bookings.filter(
    (b) => b.projectId === s.project.id,
  );
  function submit() {
    const id = s.book(data);
    if (id) {
      setConfirm(false);
      setNotice("预约已提交，等待管理员确认。可在“我的预约”模拟审核。");
      setTab("我的预约");
    } else setNotice(bookingError(data, s));
  }
  return (
    <div data-prd-id="DO-BOOKINGS">
      <PageHeader
        title="实验仪器预约"
        description="选择设备与可用时段，核对样品和实验条件后提交预约。"
        actions={
          taskId ? (
            <NavLink to={`/do-space/orchestrate?task=${taskId}`}>
              返回实验编排
              <ArrowRight />
            </NavLink>
          ) : undefined
        }
      />
      <Tabs
        items={["预约日历", "我的预约", "预约规则"]}
        value={tab}
        onChange={setTab}
      />
      {notice && (
        <p
          role="status"
          className="do-note success"
          style={{ marginBottom: 16 }}
        >
          {notice}
        </p>
      )}
      {tab === "预约日历" ? (
        <div className="do-three-col">
          <Panel title="设备筛选">
            <div className="do-stack">
              <SearchBox
                value={query}
                onChange={setQuery}
                placeholder="查找仪器…"
              />
              {s.equipment
                .filter((e) => e.name.includes(query))
                .map((e) => (
                  <button
                    className={`do-sample-choice ${equipmentId === e.id ? "do-picked" : ""}`}
                    key={e.id}
                    onClick={() => setEquipment(e.id)}
                  >
                    <strong>{e.name}</strong>
                    <p>{e.type}</p>
                    <Badge>{e.status}</Badge>
                  </button>
                ))}
            </div>
          </Panel>
          <Panel title={device?.name} actions={<CalendarDays size={16} />}>
            <div className="do-row do-between" style={{ marginBottom: 16 }}>
              <div className="do-row">
                <Button
                  aria-label="上一周"
                  onClick={() => setWeek((v) => v - 1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  aria-label="下一周"
                  onClick={() => setWeek((v) => v + 1)}
                >
                  <ChevronRight />
                </Button>
              </div>
              <strong>
                {dates[0].slice(5)} – {dates[4].slice(5)}
              </strong>
              <Button onClick={() => setWeek(0)}>演示本周</Button>
            </div>
            <div className="do-calendar">
              <div className="cal-head">时间</div>
              {dates.map((d, i) => (
                <div className="cal-head" key={d}>
                  {d.slice(5)}
                  <br />周{["一", "二", "三", "四", "五"][i]}
                </div>
              ))}
              {[8, 10, 12, 14, 16].flatMap((h) => [
                <div className="cal-time" key={`time-${h}`}>
                  {h}:00
                </div>,
                ...dates.map((d) => {
                  const b = s.bookings.find(
                    (b) =>
                      b.equipmentId === equipmentId &&
                      b.date === d &&
                      !["已取消", "已过期"].includes(b.status) &&
                      h < b.end &&
                      h + 2 > b.start,
                  );
                  return (
                    <button
                      key={`${d}-${h}`}
                      aria-label={`${d} ${h}:00 ${b ? "已预约" : "可预约"}`}
                      className={
                        b
                          ? "cal-booked"
                          : date === d && start === h
                            ? "cal-selected"
                            : ""
                      }
                      onClick={() => {
                        setDate(d);
                        setStart(h);
                        setEnd(h + 2);
                        if (b) setSelected(b);
                      }}
                    >
                      {b ? (
                        <>
                          {b.purpose}
                          <br />
                          {b.owner}
                        </>
                      ) : date === d && start === h ? (
                        "已选时段"
                      ) : (
                        "可预约"
                      )}
                    </button>
                  );
                }),
              ])}
            </div>
            <div className="do-row" style={{ marginTop: 13 }}>
              <Badge>已预约</Badge>
              <span className="do-muted" style={{ fontSize: 11 }}>
                点击空白时段选择机时 · 单格 2 小时
              </span>
            </div>
          </Panel>
          <Panel title="预约信息">
            <div className="do-stack">
              <Field label="实验方案">
                <select
                  value={planId}
                  onChange={(e) => {
                    setPlan(e.target.value);
                    setTaskId("");
                  }}
                >
                  <option value="">选择已定版方案</option>
                  {s.projectPlans
                    .filter((p) => p.status === "已定版")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} V{p.version}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="关联实验任务">
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                >
                  <option value="">不关联任务</option>
                  {s.projectTasks
                    .filter((t) => t.planId === planId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="实验样品">
                <select
                  value={sampleId}
                  onChange={(e) => setSample(e.target.value)}
                >
                  <option value="">选择样品</option>
                  {s.projectSamples.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="预约日期">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
              <div className="do-form-grid">
                <Field label="开始（时）">
                  <input
                    type="number"
                    min="8"
                    max="17"
                    value={start}
                    onChange={(e) => setStart(Number(e.target.value))}
                  />
                </Field>
                <Field label="结束（时）">
                  <input
                    type="number"
                    min="9"
                    max="18"
                    value={end}
                    onChange={(e) => setEnd(Number(e.target.value))}
                  />
                </Field>
              </div>
              <Field label="负责人">
                <input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                />
              </Field>
              <Field label="实验用途">
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </Field>
              <p
                role="status"
                className={`do-note ${error ? "warning" : "success"}`}
              >
                {error || "冲突检查通过，可发起预约。"}
              </p>
              <Button
                variant="primary"
                disabled={!!error}
                onClick={() => setConfirm(true)}
              >
                提交预约
                <ArrowRight />
              </Button>
            </div>
          </Panel>
        </div>
      ) : tab === "我的预约" ? (
        <div className="do-table-wrap">
          <table className="do-table">
            <thead>
              <tr>
                <th>设备 / 预约编号</th>
                <th>时间</th>
                <th>用途 / 样品</th>
                <th>负责人</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.map((b) => (
                <tr key={b.id}>
                  <td>
                    {s.equipment.find((e) => e.id === b.equipmentId)?.name}
                    <small>{b.id}</small>
                  </td>
                  <td>
                    {b.date}
                    <small>
                      {b.start}:00–{b.end}:00
                    </small>
                  </td>
                  <td>
                    {b.purpose}
                    <small>
                      {s.samples.find((x) => x.id === b.sampleId)?.name}
                    </small>
                  </td>
                  <td>{b.owner}</td>
                  <td>
                    <Badge>{b.status}</Badge>
                  </td>
                  <td>
                    <div className="do-row">
                      {b.status === "审批中" && (
                        <Button
                          onClick={() =>
                            setAction({ id: b.id, status: "已确认" })
                          }
                        >
                          <Check />
                          模拟审批通过
                        </Button>
                      )}
                      {["审批中", "已确认"].includes(b.status) && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setAction({ id: b.id, status: "已取消" })
                          }
                        >
                          取消预约
                        </Button>
                      )}
                      {b.taskId && (
                        <NavLink to={`/do-space/orchestrate?task=${b.taskId}`}>
                          查看任务
                        </NavLink>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visibleBookings.length && (
            <Empty title="还没有预约记录">
              <Button onClick={() => setTab("预约日历")}>选择预约时段</Button>
            </Empty>
          )}
        </div>
      ) : (
        <Panel title="仪器预约规则">
          <div className="do-stack">
            <p>开放时段：工作日 08:00–18:00；维护或停用设备不可预约。</p>
            <p>
              预约需关联已定版方案、样品、实验用途和负责人。系统检查时间重叠，管理员确认后正式生效。
            </p>
            <p>
              取消预约后时段释放；已下发任务的设备或预约发生变化时，应先暂停实验并重新核对条件。
            </p>
            <p className="do-note">
              本地演示采用 2026-09-21 所在周作为排期起点，不向真实预约系统提交。
            </p>
          </div>
        </Panel>
      )}
      <Confirm
        open={confirm}
        onClose={() => setConfirm(false)}
        title="人工确认仪器预约"
        onConfirm={submit}
        disabled={!!error}
      >
        <div className="do-stack">
          <strong>{device?.name}</strong>
          <p>
            {date} / {start}:00–{end}:00 / 共 {end - start} 小时
          </p>
          <p>
            负责人：{owner}；用途：{purpose}
          </p>
          <p className="do-note warning">
            {device?.condition}。确认样品信息、机时与操作资质后提交。
          </p>
        </div>
      </Confirm>
      <Confirm
        open={!!action}
        onClose={() => setAction(null)}
        title={
          action?.status === "已取消" ? "取消仪器预约" : "模拟管理员确认预约"
        }
        onConfirm={() => {
          if (action) {
            s.setBookingStatus(action.id, action.status);
            setNotice(`预约${action.status}，状态已同步至实验编排。`);
          }
          setAction(null);
        }}
      >
        <p>
          {action?.status === "已取消"
            ? "取消后释放预约时段，关联任务下发前将重新检查预约条件。"
            : "已核对设备能力、样品条件与负责人资质。确认后关联任务可继续实验前审核。"}
        </p>
      </Confirm>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="时段已被预约"
      >
        {selected && (
          <div className="do-stack">
            <p>
              {selected.date} {selected.start}:00–{selected.end}:00
            </p>
            <p>
              {selected.owner} · {selected.purpose}
            </p>
            <Badge>{selected.status}</Badge>
            <p className="do-muted">请选择其他时段，系统不会覆盖已有预约。</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
