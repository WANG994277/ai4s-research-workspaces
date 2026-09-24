"use client";
import { userName } from "./seed";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Microscope, CalendarDays } from "lucide-react";
import { useResearch, notify } from "./store";
import {
  canRead,
  hasRole,
  now,
  reservationError,
  uid,
  writable,
} from "./domain";
import { scoped, profiles } from "./seed";
import type { Experiment, Instrument, Material } from "./types";
import {
  AdvancedFilters,
  Alert,
  Badge,
  Button,
  Confirm,
  Details,
  Empty,
  Field,
  Files,
  Modal,
  PageTitle,
  SearchBox,
  Select,
  Table,
  Tabs,
} from "./ui";
const labTabs = [
  "仪器设备纳管",
  "仪器设备共享",
  "实验任务管理",
  "实验试剂耗材管理",
];
export function Lab() {
  const { s, p, space, mutate } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const tab = query.get("tab") ?? labTabs[0];
  const id = query.get("id");
  const q = query.get("q") ?? "";
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("全部");
  const [type, setType] = useState("全部");
  const [panel, setPanel] = useState("");
  const [subview, setSubview] = useState("共享设备");
  const [form, setForm] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [detailTab, setDetailTab] = useState("任务概况");
  const manager = hasRole(p, "admin", "manager");
  const analyst = hasRole(p, "analyst");
  const researcher = hasRole(p, "researcher", "leader");
  const canWrite = writable(s, p, space.id);
  const canBook = (analyst || researcher) && canWrite;
  const instruments = s.instruments.filter((i) =>
    i.visibleProjects.some((x) => p.projects.includes(x)),
  );
  const instrument = instruments.find((x) => x.id === id);
  const experiments = s.experiments.filter(
    (e) =>
      canRead(e, p, space.id, s) &&
      (hasRole(p, "manager", "decision") || e.spaceId === space.id),
  );
  const exp = experiments.find((e) => e.id === id);
  const material = s.materials.find((x) => x.id === id);
  const reservations = s.reservations.filter(
    (r) =>
      r.spaceId === space.id &&
      (r.ownerId === p.id ||
        manager ||
        hasRole(p, "leader") ||
        (analyst &&
          s.instruments.find((i) => i.id === r.instrumentId)?.ownerId ===
            p.id)),
  );
  function params(values: Record<string, string>) {
    const next = new URLSearchParams(query.toString());
    for (const [k, v] of Object.entries(values))
      v ? next.set(k, v) : next.delete(k);
    router.replace("/lab?" + next);
  }
  function edit(key: string, value: string) {
    setForm({ ...form, [key]: value });
    setError("");
  }
  function open(name: string, values: Record<string, string> = {}) {
    setForm(values);
    setFiles([]);
    setError("");
    setPanel(name);
  }
  function formField(
    key: string,
    label: string,
    options?:
      | {
          value: string;
          label: string;
        }[]
      | string[],
    inputType = "text",
    required = false,
  ) {
    return (
      <Field label={label} required={required}>
        {options ? (
          <select
            value={form[key] ?? ""}
            onChange={(e) => edit(key, e.target.value)}
          >
            <option value="">请选择</option>
            {options.map((o) => (
              <option
                key={typeof o === "string" ? o : o.value}
                value={typeof o === "string" ? o : o.value}
              >
                {typeof o === "string" ? o : o.label}
              </option>
            ))}
          </select>
        ) : inputType === "textarea" ? (
          <textarea
            value={form[key] ?? ""}
            onChange={(e) => edit(key, e.target.value)}
          />
        ) : (
          <input
            type={inputType}
            value={form[key] ?? ""}
            onChange={(e) => edit(key, e.target.value)}
          />
        )}
      </Field>
    );
  }
  function changeExperiment(action: string) {
    if (!exp) return;
    const allowed = (analyst && exp.executorId === p.id) || manager;
    if (!allowed) {
      notify("仅指定执行人员可以更新实验执行状态。");
      return;
    }
    mutate("已更新实验状态", exp.id, (d, u) => {
      const e = d.experiments.find((x) => x.id === exp.id)!;
      const transition: Record<string, [string[], string]> = {
        接收任务: [["待接收"], "待执行"],
        开始实验: [["待执行"], "执行中"],
        恢复实验: [["执行中"], "执行中"],
        暂停: [["执行中"], "执行中"],
      };
      const spec = transition[action];
      if (!spec || !spec[0].includes(e.status))
        throw new Error("当前状态不支持此操作。");
      e.status = spec[1];
      e.paused = action === "暂停";
      e.records.push(`${now()} ${u.name} ${action}`);
      e.updatedAt = now();
    });
  }
  function submit() {
    setError("");
    const required =
      panel === "预约"
        ? ["instrumentId", "start", "end", "purpose"]
        : ["实验任务", "编辑实验草稿"].includes(panel)
          ? [
              "name",
              "purpose",
              "requirements",
              "executorId",
              "plannedStart",
              "plannedEnd",
            ]
          : panel === "新增设备" || panel === "编辑设备"
            ? [
                "name",
                "code",
                "type",
                "manufacturer",
                "model",
                "organization",
                "lab",
                "location",
                "ownerId",
                "connection",
              ]
            : panel === "领用 / 消耗登记"
              ? ["quantity", "purpose", "experimentId"]
              : panel === "实验结果"
                ? ["result"]
                : panel === "记录异常"
                  ? ["reason", "handler", "advice"]
                  : panel === "新增试剂耗材"
                    ? [
                        "name",
                        "type",
                        "specification",
                        "quantity",
                        "unit",
                        "location",
                        "threshold",
                      ]
                    : panel === "库存管理"
                      ? ["quantity", "threshold"]
                      : [];
    if (required.some((k) => !form[k]?.trim())) {
      setError("请填写所有必填字段。");
      return;
    }
    if (panel === "预约") {
      const issue = reservationError(
        s,
        form.instrumentId,
        form.start,
        form.end,
      );
      if (issue) {
        setError(issue);
        return;
      }
      if (!space.projectId) {
        setError("请切换至项目或课题空间再预约。");
        return;
      }
    }
    if (
      ["实验任务", "编辑实验草稿"].includes(panel) &&
      form.plannedEnd <= form.plannedStart
    ) {
      setError("结束时间必须晚于开始时间。");
      return;
    }
    const ok = mutate(panel + "已保存", id ?? panel, (d, u) => {
      if (panel === "预约") {
        if (!canBook) throw new Error("没有预约权限。");
        const i = d.instruments.find((x) => x.id === form.instrumentId)!;
        const conflict = reservationError(d, i.id, form.start, form.end);
        if (conflict) throw new Error(conflict);
        d.reservations.unshift({
          id: uid("reservation"),
          instrumentId: i.id,
          projectId: space.projectId,
          spaceId: space.id,
          ownerId: u.id,
          start: form.start,
          end: form.end,
          purpose: form.purpose,
          experimentId: form.experimentId ?? "",
          note: form.note ?? "",
          status: i.approval ? "待审批" : "已通过",
          records: [
            `${now()} ${u.name} 提交预约${i.approval ? "" : "，按设备规则自动通过"}`,
          ],
        });
      }
      if (panel === "新增设备" || panel === "编辑设备") {
        if (!manager) throw new Error("没有设备管理权限。");
        if (d.instruments.some((x) => x.code === form.code && x.id !== id))
          throw new Error("设备编号已存在。");
        const item: Instrument = {
          id: panel === "编辑设备" ? id! : uid("instrument"),
          name: form.name,
          code: form.code,
          type: form.type,
          manufacturer: form.manufacturer,
          model: form.model,
          organization: form.organization,
          lab: form.lab,
          location: form.location,
          ownerId: form.ownerId,
          contact: form.contact ?? "",
          specs: form.specs ?? "",
          connection: form.connection,
          online: form.online ?? "未知",
          runtime: form.runtime ?? "未知",
          sharing: form.sharing === "开放共享",
          approval: form.approval !== "自动通过",
          rules: form.rules ?? "工作日 09:00–18:00",
          purpose: form.purpose ?? form.type,
          discipline: form.discipline ?? "通用",
          source: "AI4S",
          syncTime: now(),
          visibleProjects: [space.projectId || "p1"],
        };
        if (panel === "编辑设备")
          d.instruments = d.instruments.map((x) => (x.id === id ? item : x));
        else d.instruments.push(item);
      }
      if (["实验任务", "编辑实验草稿"].includes(panel)) {
        if (!canWrite || (!researcher && !analyst))
          throw new Error("当前不能创建实验任务。");
        const e: Experiment = {
          ...scoped(uid("experiment"), form.name, space.id, "SPACE", u.id),
          projectId: space.projectId,
          taskId: form.taskId ?? "",
          purpose: form.purpose,
          requirements: form.requirements,
          content: form.content ?? "",
          executorId: form.executorId,
          instrumentId: form.instrumentId ?? "",
          priority: form.priority || "普通",
          plannedStart: form.plannedStart,
          plannedEnd: form.plannedEnd,
          status: form.saveDraft === "是" ? "草稿" : "待接收",
          records: [`${now()} ${u.name} 创建`],
          attachments: files,
          result: "",
          resultType: "",
          resultAt: "",
          confirmedBy: "",
          exception: "",
          paused: false,
          progress: "待执行",
        };
        if (panel === "编辑实验草稿" && exp) {
          d.experiments = d.experiments.map((x) =>
            x.id === exp.id
              ? {
                  ...e,
                  id: exp.id,
                  status: "草稿",
                  records: exp.records,
                  attachments: files.length ? files : exp.attachments,
                }
              : x,
          );
        } else d.experiments.unshift(e);
      }
      if (panel === "实验结果" && exp) {
        if (!(analyst && exp.executorId === u.id) || exp.status !== "执行中")
          throw new Error("当前无提交结果权限。");
        const e = d.experiments.find((x) => x.id === exp.id)!;
        e.result = form.result;
        e.resultType = form.resultType || "文本说明";
        e.resultAt = now();
        e.attachments.push(...files);
        e.status = "等待确认";
        e.records.push(`${now()} ${u.name} 提交实验结果`);
        e.updatedAt = now();
      }
      if (panel === "记录异常" && exp) {
        if (!(analyst && exp.executorId === u.id))
          throw new Error("仅执行人员可记录异常。");
        const e = d.experiments.find((x) => x.id === exp.id)!;
        e.status = "异常";
        e.exception = form.reason;
        e.records.push(
          `${now()} ${u.name} 异常：${form.reason}；处理人：${form.handler}；建议：${form.advice}`,
        );
        if (e.taskId) {
          const t = d.tasks.find((x) => x.id === e.taskId)!;
          t.status = "WAITING_HUMAN";
          d.decisions.push({
            id: uid("decision"),
            taskId: t.id,
            stepId: t.steps.at(-1)?.id ?? "",
            question: "实验异常：" + form.reason,
            recommendation: form.advice,
            reason: e.name,
            options: ["恢复实验", "调整实验要求", "自定义"],
            assignee: e.ownerId,
            status: "pending",
            choice: "",
            at: "",
            by: "",
            experimentId: e.id,
          });
        }
      }
      if (panel === "领用 / 消耗登记" && material) {
        if (!canBook) throw new Error("没有领用权限。");
        const m = d.materials.find((x) => x.id === material.id)!;
        const n = Number(form.quantity);
        if (!Number.isFinite(n) || n <= 0) throw new Error("请输入有效数量。");
        if (n > m.quantity) throw new Error("当前库存不足，无法完成本次领用。");
        m.quantity -= n;
        m.records.unshift({
          id: uid("usage"),
          quantity: n,
          kind: form.kind || "领用",
          experimentId: form.experimentId,
          spaceId: space.id,
          userId: u.id,
          purpose: form.purpose,
          at: now(),
        });
      }
      if (panel === "新增试剂耗材") {
        if (!manager) throw new Error("没有台账管理权限。");
        const n = Number(form.quantity),
          threshold = Number(form.threshold);
        if (
          !Number.isFinite(n) ||
          !Number.isFinite(threshold) ||
          n < 0 ||
          threshold < 0
        )
          throw new Error("库存和预警阈值不能小于零。");
        d.materials.push({
          id: uid("material"),
          name: form.name,
          type: form.type,
          specification: form.specification,
          quantity: n,
          unit: form.unit,
          location: form.location,
          threshold,
          managerId: u.id,
          records: [],
        });
      }
      if (panel === "库存管理" && material) {
        if (!manager) throw new Error("没有库存管理权限。");
        const m = d.materials.find((x) => x.id === material.id)!;
        const n = Number(form.quantity),
          threshold = Number(form.threshold);
        if (
          !Number.isFinite(n) ||
          !Number.isFinite(threshold) ||
          n < 0 ||
          threshold < 0
        )
          throw new Error("库存和阈值必须为非负数。");
        m.records.push({
          id: uid("inventory"),
          quantity: n - m.quantity,
          kind: "库存调整",
          experimentId: "",
          spaceId: space.id,
          userId: u.id,
          purpose: form.purpose ?? "",
          at: now(),
        });
        m.quantity = n;
        m.threshold = threshold;
      }
    });
    if (ok) {
      setPanel("");
      if (panel === "预约") setSubview("我的预约");
    }
  }
  const filteredInstruments = instruments.filter(
    (i) =>
      (!filters.organization || i.organization === filters.organization) &&
      (!filters.lab || i.lab === filters.lab) &&
      (!filters.connection || i.connection === filters.connection) &&
      (!filters.sharing || (filters.sharing === "开放共享") === i.sharing) &&
      (tab !== labTabs[1] || i.sharing) &&
      (!q ||
        [i.name, i.code, i.model, i.ownerId, i.organization]
          .join(" ")
          .includes(q)) &&
      (status === "全部" || i.runtime === status || i.online === status) &&
      (type === "全部" || i.type === type),
  );
  const filteredExperiments = experiments.filter(
    (e) =>
      (!filters.executor || e.executorId === filters.executor) &&
      (!filters.instrument ||
        s.instruments.find((i) => i.id === e.instrumentId)?.name ===
          filters.instrument) &&
      (!filters.from || e.plannedStart.slice(0, 10) >= filters.from) &&
      (!filters.to || e.plannedEnd.slice(0, 10) <= filters.to) &&
      e.name.includes(q) &&
      (status === "全部" || e.status === status),
  );
  const filteredMaterials = s.materials.filter(
    (m) =>
      (!filters.location || m.location === filters.location) &&
      m.name.includes(q) &&
      (type === "全部" || m.type === type) &&
      (status === "全部" ||
        (status === "库存不足" && m.quantity <= m.threshold) ||
        (status === "库存正常" && m.quantity > m.threshold)),
  );
  return (
    <>
      <PageTitle
        title={`云上实验室 · ${tab}`}
        action={
          tab === labTabs[0] && manager ? (
            <Button
              primary
              onClick={() =>
                open("新增设备", { sharing: "开放共享", approval: "需要审批" })
              }
            >
              <Plus size={15} />
              新增设备
            </Button>
          ) : tab === labTabs[2] && (researcher || analyst) ? (
            <Button
              primary
              disabled={!canWrite}
              onClick={() => open("实验任务", { priority: "普通" })}
            >
              <Plus size={15} />
              创建实验任务
            </Button>
          ) : tab === labTabs[3] && manager ? (
            <Button primary onClick={() => open("新增试剂耗材")}>
              新增试剂耗材
            </Button>
          ) : undefined
        }
      />
      {id && (
        <Button className="v-back" onClick={() => params({ id: "" })}>
          <ArrowLeft size={15} />
          返回列表
        </Button>
      )}
      {id && instrument && [labTabs[0], labTabs[1]].includes(tab) ? (
        <>
          <div className="v-card">
            <div className="v-section-head">
              <div>
                <Badge>{instrument.runtime}</Badge>
                <h1 className="v-task-title">{instrument.name}</h1>
                <p>{instrument.purpose}</p>
              </div>
              <Microscope size={35} color="#59796a" />
            </div>
            <div className="v-actions">
              {tab === labTabs[1] && (
                <Button
                  primary
                  disabled={
                    !canBook ||
                    !instrument.sharing ||
                    instrument.online === "离线"
                  }
                  onClick={() => open("预约", { instrumentId: instrument.id })}
                >
                  预约设备
                </Button>
              )}
              {manager && tab === labTabs[0] && (
                <Button
                  onClick={() =>
                    open(
                      "编辑设备",
                      Object.fromEntries(
                        Object.entries(instrument)
                          .filter(([, v]) => typeof v === "string")
                          .map(([k, v]) => [k, String(v)]),
                      ).valueOf() as Record<string, string>,
                    )
                  }
                >
                  编辑设备
                </Button>
              )}
            </div>
            <Details
              values={{
                设备编号: instrument.code,
                设备类别: instrument.type,
                厂家: instrument.manufacturer,
                型号: instrument.model,
                规格参数: instrument.specs,
                所属单位: instrument.organization,
                所属实验室: instrument.lab,
                位置: instrument.location,
                负责人: userName(instrument.ownerId),
                联系方式: instrument.contact,
              }}
            />
          </div>
          <div className="v-grid two v-section">
            <section className="v-card">
              <h2>接入与状态</h2>
              <Details
                values={{
                  接入方式: instrument.connection,
                  来源系统: instrument.source,
                  在线状态: instrument.online,
                  运行状态: instrument.runtime,
                  最后通信: instrument.syncTime,
                  数据采集: "本地示例",
                }}
              />
            </section>
            <section className="v-card">
              <h2>共享与预约</h2>
              <Details
                values={{
                  共享状态: instrument.sharing ? "开放共享" : "不共享",
                  开放时间: "工作日 09:00–18:00",
                  使用要求: instrument.rules,
                  审批规则: instrument.approval ? "设备负责人审批" : "自动通过",
                  可见范围: "授权项目",
                }}
              />
              <h3>已占用时段</h3>
              {s.reservations
                .filter(
                  (r) =>
                    r.instrumentId === instrument.id &&
                    !["已取消", "已拒绝"].includes(r.status),
                )
                .map((r) => (
                  <p className="v-muted" key={r.id}>
                    {r.start.replace("T", " ")} — {r.end.slice(11)}
                  </p>
                ))}
            </section>
          </div>
        </>
      ) : id && exp && tab === labTabs[2] ? (
        <>
          <section className="v-card">
            <div className="v-section-head">
              <div>
                <Badge>
                  {exp.status}
                  {exp.paused ? " · 已暂停" : ""}
                </Badge>
                <h1 className="v-task-title">{exp.name}</h1>
              </div>
              <span className="v-muted">Experiment Task</span>
            </div>
            <div className="v-actions">
              {exp.status === "草稿" && exp.ownerId === p.id && (
                <>
                  <Button
                    primary
                    onClick={() =>
                      mutate("已提交实验草稿", exp.id, (d) => {
                        const e = d.experiments.find((x) => x.id === exp.id)!;
                        if (!writable(d, p, space.id))
                          throw new Error("当前空间不可提交。");
                        e.status = "待接收";
                        e.records.push(now() + " 提交实验草稿");
                      })
                    }
                  >
                    提交实验任务
                  </Button>
                  <Button
                    onClick={() =>
                      open(
                        "编辑实验草稿",
                        Object.fromEntries(
                          Object.entries(exp).filter(
                            ([, v]) => typeof v === "string",
                          ),
                        ) as Record<string, string>,
                      )
                    }
                  >
                    编辑草稿
                  </Button>
                </>
              )}
              {analyst && exp.executorId === p.id && (
                <>
                  {exp.status === "待接收" && (
                    <Button
                      primary
                      onClick={() => changeExperiment("接收任务")}
                    >
                      接收任务
                    </Button>
                  )}
                  {exp.status === "待执行" && (
                    <Button
                      primary
                      onClick={() => changeExperiment("开始实验")}
                    >
                      开始实验
                    </Button>
                  )}
                  {exp.status === "执行中" && (
                    <>
                      <Button
                        onClick={() =>
                          changeExperiment(exp.paused ? "恢复实验" : "暂停")
                        }
                      >
                        {exp.paused ? "恢复实验" : "暂停"}
                      </Button>
                      <Button
                        primary
                        onClick={() =>
                          open("实验结果", { resultType: "文本说明" })
                        }
                      >
                        提交结果
                      </Button>
                      <Button onClick={() => open("记录异常")}>记录异常</Button>
                    </>
                  )}
                </>
              )}
              {researcher && exp.status === "等待确认" && (
                <Button
                  primary
                  onClick={() =>
                    mutate("已确认实验结果", exp.id, (d, u) => {
                      if (exp.ownerId !== u.id && !hasRole(u, "leader"))
                        throw new Error("仅申请人或授权负责人可确认。");
                      const e = d.experiments.find((x) => x.id === exp.id)!;
                      e.status = "已完成";
                      e.confirmedBy = u.id;
                      e.records.push(`${now()} ${u.name} 确认结果`);
                      const artId = uid("artifact");
                      d.artifacts.unshift({
                        ...scoped(
                          artId,
                          e.name + " · 实验结果",
                          e.spaceId,
                          "SPACE",
                          e.ownerId,
                        ),
                        projectId: e.projectId,
                        type: "实验结果",
                        taskId: e.taskId,
                        sessionId:
                          d.tasks.find((t) => t.id === e.taskId)
                            ?.sessionIds[0] ?? "",
                        stepId: e.id,
                        version: "V1.0",
                        status: "已确认",
                        content: e.result,
                        references: [e.instrumentId],
                      });
                      const t = d.tasks.find((x) => x.id === e.taskId);
                      if (t) {
                        t.contextIds.push(artId);
                        if (t.status === "WAITING_RESOURCE") {
                          t.status = "RUNNING";
                          t.reason = "";
                          t.runAt = Date.now() + 8000;
                        }
                      }
                    })
                  }
                >
                  确认结果并回流
                </Button>
              )}
              {exp.taskId && (
                <Button
                  onClick={() => router.push("/workspace?task=" + exp.taskId)}
                >
                  查看关联科研任务
                </Button>
              )}
              {exp.ownerId === p.id &&
                !["已完成", "已取消"].includes(exp.status) && (
                  <Confirm
                    title="取消实验任务"
                    description="停止该实验任务，保留执行记录。"
                    onConfirm={() =>
                      mutate("已取消实验任务", exp.id, (d) => {
                        d.experiments.find((x) => x.id === exp.id)!.status =
                          "已取消";
                      })
                    }
                  >
                    取消任务
                  </Confirm>
                )}
            </div>
          </section>
          <section className="v-card v-section">
            <Tabs
              items={[
                "任务概况",
                "实验要求",
                "关联设备",
                "执行记录",
                "试剂耗材",
                "实验结果",
                "关联科研任务",
              ]}
              value={detailTab}
              onChange={setDetailTab}
            />
            {detailTab === "任务概况" ? (
              <Details
                values={{
                  项目: s.projects.find((x) => x.id === exp.projectId)?.name,
                  空间: s.spaces.find((x) => x.id === exp.spaceId)?.name,
                  申请人: userName(exp.ownerId),
                  执行人: userName(exp.executorId),
                  计划开始: exp.plannedStart,
                  计划结束: exp.plannedEnd,
                  优先级: exp.priority,
                  当前阶段: exp.progress,
                }}
              />
            ) : detailTab === "实验要求" ? (
              <Details
                values={{
                  实验目的: exp.purpose,
                  实验内容: exp.content,
                  实验要求: exp.requirements,
                  附件: exp.attachments.join("、"),
                }}
              />
            ) : detailTab === "执行记录" ? (
              <div className="v-audit">
                {exp.records.map((r, i) => (
                  <p key={i}>{r}</p>
                ))}
              </div>
            ) : detailTab === "关联设备" ? (
              <Button
                onClick={() =>
                  params({ tab: labTabs[0], id: exp.instrumentId })
                }
              >
                {s.instruments.find((x) => x.id === exp.instrumentId)?.name ??
                  "未关联设备"}
              </Button>
            ) : detailTab === "试剂耗材" ? (
              <>
                {s.materials.flatMap((m) =>
                  m.records
                    .filter((r) => r.experimentId === exp.id)
                    .map((r) => (
                      <p key={r.id}>
                        {m.name} · {r.kind} {r.quantity}
                        {m.unit}
                      </p>
                    )),
                )}
                <Button onClick={() => params({ tab: labTabs[3], id: "" })}>
                  查看试剂耗材
                </Button>
              </>
            ) : detailTab === "实验结果" ? (
              exp.result ? (
                <>
                  <Details
                    values={{
                      结果类型: exp.resultType,
                      提交时间: exp.resultAt,
                      确认人: exp.confirmedBy,
                    }}
                  />
                  <p className="v-prose">{exp.result}</p>
                </>
              ) : (
                <Empty>尚未提交实验结果。</Empty>
              )
            ) : (
              <Button
                onClick={() => router.push("/workspace?task=" + exp.taskId)}
              >
                查看 Research Task
              </Button>
            )}
            {exp.exception && <Alert>异常：{exp.exception}</Alert>}
          </section>
        </>
      ) : id && material && tab === labTabs[3] ? (
        <div className="v-card">
          <h1 className="v-task-title">{material.name}</h1>
          <Details
            values={{
              类型: material.type,
              规格: material.specification,
              当前库存: material.quantity + " " + material.unit,
              存放位置: material.location,
              管理员: material.managerId,
              库存阈值: material.threshold,
              预警状态:
                material.quantity <= material.threshold
                  ? "库存不足"
                  : "库存正常",
            }}
          />
          <div className="v-actions">
            <Button
              primary
              disabled={!canBook}
              onClick={() => open("领用 / 消耗登记", { kind: "领用" })}
            >
              领用 / 消耗登记
            </Button>
            {manager && (
              <Button
                onClick={() =>
                  open("库存管理", {
                    quantity: String(material.quantity),
                    threshold: String(material.threshold),
                  })
                }
              >
                库存管理与阈值配置
              </Button>
            )}
          </div>
          <h2 className="v-section">使用记录</h2>
          <Table
            headers={["时间", "操作", "数量", "使用人", "实验任务", "用途"]}
            rows={material.records
              .filter(
                (r) =>
                  manager ||
                  r.userId === p.id ||
                  (r.spaceId === space.id && analyst),
              )
              .map((r) => [
                r.at.slice(0, 16),
                r.kind,
                r.quantity,
                userName(r.userId),
                s.experiments.find((e) => e.id === r.experimentId)?.name,
                r.purpose,
              ])}
          />
        </div>
      ) : id ? (
        <Empty>当前对象不可访问或不存在。</Empty>
      ) : (
        <>
          <div className="v-toolbar">
            <SearchBox
              value={q}
              onChange={(v) => params({ q: v })}
              placeholder="搜索当前列表"
            />
            <Select
              label="状态"
              value={status}
              onChange={setStatus}
              options={
                tab === labTabs[2]
                  ? [
                      "全部",
                      "草稿",
                      "待接收",
                      "待执行",
                      "执行中",
                      "等待确认",
                      "已完成",
                      "异常",
                      "已取消",
                    ]
                  : tab === labTabs[3]
                    ? ["全部", "库存不足", "库存正常"]
                    : ["全部", "空闲", "运行中", "离线", "维护中", "故障"]
              }
            />
            {tab !== labTabs[2] && (
              <Select
                label="类型"
                value={type}
                onChange={setType}
                options={[
                  "全部",
                  ...new Set(
                    tab === labTabs[3]
                      ? s.materials.map((x) => x.type)
                      : instruments.map((x) => x.type),
                  ),
                ]}
              />
            )}
            <AdvancedFilters
              value={filters}
              onChange={setFilters}
              fields={
                tab === labTabs[2]
                  ? [
                      {
                        key: "executor",
                        label: "执行人",
                        options: [
                          ...new Set(experiments.map((e) => e.executorId)),
                        ],
                      },
                      {
                        key: "instrument",
                        label: "关联设备",
                        options: instruments.map((i) => i.name),
                      },
                      { key: "from", label: "计划开始日期", type: "date" },
                      { key: "to", label: "计划结束日期", type: "date" },
                    ]
                  : tab === labTabs[3]
                    ? [
                        {
                          key: "location",
                          label: "存放位置",
                          options: [
                            ...new Set(s.materials.map((m) => m.location)),
                          ],
                        },
                      ]
                    : [
                        {
                          key: "organization",
                          label: "所属单位",
                          options: [
                            ...new Set(instruments.map((i) => i.organization)),
                          ],
                        },
                        {
                          key: "lab",
                          label: "实验室",
                          options: [...new Set(instruments.map((i) => i.lab))],
                        },
                        {
                          key: "connection",
                          label: "接入方式",
                          options: [
                            ...new Set(instruments.map((i) => i.connection)),
                          ],
                        },
                        {
                          key: "sharing",
                          label: "共享状态",
                          options: ["开放共享", "不共享"],
                        },
                      ]
              }
            />
          </div>
          {tab === labTabs[0] ? (
            <Table
              headers={[
                "设备名称 / 编号",
                "分类",
                "实验室 / 单位",
                "负责人",
                "接入方式",
                "在线 / 运行",
                "共享",
                "操作",
              ]}
              rows={filteredInstruments.map((i) => [
                <span key="n">
                  {i.name}
                  <small>{i.code}</small>
                </span>,
                i.type,
                <span key="l">
                  {i.lab}
                  <small>{i.organization}</small>
                </span>,
                userName(i.ownerId),
                i.connection,
                <div className="v-actions" key="s">
                  <Badge>{i.online}</Badge>
                  <Badge>{i.runtime}</Badge>
                </div>,
                i.sharing ? "开放" : "未开放",
                <Button key="a" onClick={() => params({ id: i.id })}>
                  查看详情
                </Button>,
              ])}
            />
          ) : tab === labTabs[1] ? (
            <>
              <div className="v-section-head">
                <h2>{subview}</h2>
                <div className="v-actions">
                  <Button onClick={() => setSubview("共享设备")}>
                    共享设备
                  </Button>
                  <Button onClick={() => setSubview("我的预约")}>
                    我的预约
                  </Button>
                  <Button onClick={() => setSubview("使用记录")}>
                    使用记录
                  </Button>
                </div>
              </div>
              {subview === "共享设备" ? (
                <div className="v-grid">
                  {filteredInstruments.map((i) => (
                    <article className="v-card" key={i.id}>
                      <div className="v-section-head">
                        <div className="v-resource-icon">
                          <Microscope size={23} />
                        </div>
                        <Badge>{i.runtime}</Badge>
                      </div>
                      <h3>{i.name}</h3>
                      <p>{i.purpose}</p>
                      <p className="v-muted">
                        {i.discipline} · {i.organization}
                      </p>
                      <p className="v-muted">
                        <CalendarDays size={14} style={{ display: "inline" }} />{" "}
                        工作日 09:00–18:00
                      </p>
                      <div className="v-actions">
                        <Button onClick={() => params({ id: i.id })}>
                          查看详情
                        </Button>
                        <Button
                          disabled={!canBook || i.online === "离线"}
                          onClick={() => open("预约", { instrumentId: i.id })}
                        >
                          预约
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Table
                  headers={[
                    "设备",
                    "预约时段",
                    "申请人",
                    "状态",
                    "关联实验",
                    "操作",
                  ]}
                  rows={reservations
                    .filter(
                      (r) =>
                        subview !== "使用记录" ||
                        ["使用中", "已完成"].includes(r.status),
                    )
                    .map((r) => [
                      s.instruments.find((i) => i.id === r.instrumentId)?.name,
                      <span key="t">
                        {r.start.replace("T", " ")}
                        <small>至 {r.end.replace("T", " ")}</small>
                      </span>,
                      userName(r.ownerId),
                      <Badge key="s">{r.status}</Badge>,
                      s.experiments.find((e) => e.id === r.experimentId)
                        ?.name ?? "—",
                      <div key="a" className="v-actions">
                        <Button
                          onClick={() =>
                            open("预约详情", { reservationId: r.id })
                          }
                        >
                          详情
                        </Button>
                        {r.status === "待审批" &&
                          (manager || analyst || hasRole(p, "leader")) && (
                            <Button
                              onClick={() =>
                                open("审批预约", {
                                  reservationId: r.id,
                                  status: "已通过",
                                })
                              }
                            >
                              审批
                            </Button>
                          )}
                        {r.ownerId === p.id &&
                          ["已通过", "使用中"].includes(r.status) && (
                            <Button
                              onClick={() =>
                                mutate("已更新设备使用记录", r.id, (d) => {
                                  const x = d.reservations.find(
                                    (x) => x.id === r.id,
                                  )!;
                                  x.status =
                                    x.status === "已通过" ? "使用中" : "已完成";
                                  x.records.push(
                                    `${now()} ${p.name} ${x.status}`,
                                  );
                                })
                              }
                            >
                              {r.status === "已通过" ? "开始使用" : "结束使用"}
                            </Button>
                          )}
                        {r.ownerId === p.id &&
                          ["待审批", "已通过"].includes(r.status) && (
                            <Confirm
                              title="取消设备预约"
                              description="取消后，该时段可被其他科研人员预约。"
                              onConfirm={() =>
                                mutate("已取消预约", r.id, (d) => {
                                  d.reservations.find(
                                    (x) => x.id === r.id,
                                  )!.status = "已取消";
                                })
                              }
                            >
                              取消
                            </Confirm>
                          )}
                      </div>,
                    ])}
                />
              )}
            </>
          ) : tab === labTabs[2] ? (
            <Table
              headers={[
                "实验任务",
                "关联科研任务",
                "申请人 / 执行人",
                "设备",
                "状态",
                "计划时间",
                "操作",
              ]}
              rows={filteredExperiments.map((e) => [
                e.name,
                s.tasks.find((t) => t.id === e.taskId)?.name ?? "—",
                userName(e.ownerId) + " / " + userName(e.executorId),
                s.instruments.find((i) => i.id === e.instrumentId)?.name,
                <Badge key="s">{e.status}</Badge>,
                e.plannedStart.replace("T", " "),
                <Button key="a" onClick={() => params({ id: e.id })}>
                  查看详情
                </Button>,
              ])}
            />
          ) : (
            <Table
              headers={[
                "名称",
                "类型 / 规格",
                "库存",
                "存放位置",
                "预警状态",
                "操作",
              ]}
              rows={filteredMaterials.map((m) => [
                m.name,
                <span key="t">
                  {m.type}
                  <small>{m.specification}</small>
                </span>,
                m.quantity + " " + m.unit,
                m.location,
                <Badge key="s">
                  {m.quantity <= m.threshold ? "库存不足" : "库存正常"}
                </Badge>,
                <Button key="a" onClick={() => params({ id: m.id })}>
                  查看详情
                </Button>,
              ])}
            />
          )}
        </>
      )}
      <Modal
        title={panel}
        open={!!panel}
        onClose={() => setPanel("")}
        wide
        footer={
          <>
            <Button onClick={() => setPanel("")}>取消</Button>
            {panel === "审批预约" ? (
              <Button
                primary
                onClick={() => {
                  if (
                    mutate("已审批预约", form.reservationId, (d) => {
                      const r = d.reservations.find(
                        (x) => x.id === form.reservationId,
                      )!;
                      if (
                        !manager &&
                        !(
                          analyst &&
                          d.instruments.find((i) => i.id === r.instrumentId)
                            ?.ownerId === p.id
                        ) &&
                        !hasRole(p, "leader")
                      )
                        throw new Error("没有预约审批权限。");
                      r.status = form.status;
                      r.records.push(
                        `${now()} ${p.name} ${form.status} ${form.note ?? ""}`,
                      );
                    })
                  )
                    setPanel("");
                }}
              >
                确认审批
              </Button>
            ) : (
              panel !== "预约详情" && (
                <Button primary onClick={submit}>
                  {panel === "预约" ? "发起预约" : "保存"}
                </Button>
              )
            )}
          </>
        }
      >
        <div data-unsaved={Object.values(form).some(Boolean)}>
          {panel === "预约" ? (
            <>
              <Details
                values={{
                  项目: s.projects.find((x) => x.id === space.projectId)?.name,
                  空间: space.name,
                  申请人: p.name,
                }}
              />
              {formField(
                "instrumentId",
                "预约设备",
                instruments
                  .filter((i) => i.sharing)
                  .map((i) => ({ value: i.id, label: i.name })),
              )}
              <div className="v-form-grid">
                {formField(
                  "start",
                  "开始时间",
                  undefined,
                  "datetime-local",
                  true,
                )}
                {formField(
                  "end",
                  "结束时间",
                  undefined,
                  "datetime-local",
                  true,
                )}
              </div>
              {formField("purpose", "使用目的", undefined, "textarea", true)}
              {formField(
                "experimentId",
                "关联实验任务",
                experiments.map((e) => ({ value: e.id, label: e.name })),
              )}
              {formField("note", "备注")}
            </>
          ) : panel === "新增设备" || panel === "编辑设备" ? (
            <>
              <div className="v-form-grid">
                {[
                  ["name", "设备名称"],
                  ["code", "设备编号"],
                  ["type", "设备类别"],
                  ["manufacturer", "厂家"],
                  ["model", "型号"],
                  ["organization", "所属单位"],
                  ["lab", "所属实验室"],
                  ["location", "设备位置"],
                ].map(([key, label]) => (
                  <div key={key}>
                    {formField(key, label, undefined, "text", true)}
                  </div>
                ))}
                {formField(
                  "ownerId",
                  "负责人",
                  Object.values(profiles).map((u) => ({
                    value: u.id,
                    label: u.name,
                  })),
                  "text",
                  true,
                )}
                {formField("contact", "联系方式")}
                {formField(
                  "connection",
                  "接入方式",
                  [
                    "直接接入",
                    "基础接口接入",
                    "状态感知",
                    "外部系统同步",
                    "人工维护",
                  ],
                  "text",
                  true,
                )}
                {formField("sharing", "共享状态", ["开放共享", "不共享"])}
                {formField("approval", "审批规则", ["需要审批", "自动通过"])}
                {formField("online", "在线状态", ["在线", "离线", "未知"])}
                {formField("runtime", "运行状态", [
                  "空闲",
                  "运行中",
                  "离线",
                  "故障",
                  "维护中",
                  "未知",
                ])}
              </div>
              {formField("rules", "共享规则与使用要求", undefined, "textarea")}
              {formField("specs", "规格参数")}
              {formField("purpose", "主要用途")}
            </>
          ) : ["实验任务", "编辑实验草稿"].includes(panel) ? (
            <>
              <Details
                values={{
                  项目: s.projects.find((x) => x.id === space.projectId)?.name,
                  空间: space.name,
                  申请人: p.name,
                }}
              />
              {formField("name", "实验任务名称", undefined, "text", true)}
              {formField("purpose", "实验目的", undefined, "textarea", true)}
              {formField("content", "实验内容", undefined, "textarea")}
              {formField(
                "requirements",
                "实验要求",
                undefined,
                "textarea",
                true,
              )}
              <div className="v-form-grid">
                {formField(
                  "taskId",
                  "关联 Research Task",
                  s.tasks
                    .filter(
                      (t) =>
                        canRead(t, p, space.id, s) && t.spaceId === space.id,
                    )
                    .map((t) => ({ value: t.id, label: t.name })),
                )}
                {formField(
                  "executorId",
                  "执行人",
                  Object.values(profiles)
                    .filter((u) => u.roles.includes("analyst"))
                    .map((u) => ({ value: u.id, label: u.name })),
                  "text",
                  true,
                )}
                {formField(
                  "instrumentId",
                  "关联设备",
                  instruments.map((i) => ({ value: i.id, label: i.name })),
                )}
                {formField("priority", "优先级", ["普通", "紧急"])}
                {formField(
                  "plannedStart",
                  "计划开始",
                  undefined,
                  "datetime-local",
                  true,
                )}
                {formField(
                  "plannedEnd",
                  "计划结束",
                  undefined,
                  "datetime-local",
                  true,
                )}
              </div>
              <Files value={files} onChange={setFiles} />
              {formField("saveDraft", "保存为草稿", ["是", "否"])}
            </>
          ) : panel === "实验结果" ? (
            <>
              {formField("resultType", "结果类型", [
                "文本说明",
                "表格",
                "文件",
                "图片",
                "图表",
                "数据文件",
                "报告",
              ])}
              {formField("result", "实验结果说明", undefined, "textarea", true)}
              <Files value={files} onChange={setFiles} />
            </>
          ) : panel === "记录异常" ? (
            <>
              {formField(
                "reason",
                "异常类型与描述",
                undefined,
                "textarea",
                true,
              )}
              {formField(
                "handler",
                "处理人",
                Object.values(profiles).map((u) => ({
                  value: u.id,
                  label: u.name,
                })),
                "text",
                true,
              )}
              {formField("advice", "后续建议", undefined, "textarea", true)}
            </>
          ) : panel === "领用 / 消耗登记" ? (
            <>
              {formField("kind", "登记类型", ["领用", "消耗", "异常损耗"])}
              {formField("quantity", "数量", undefined, "number", true)}
              {formField(
                "experimentId",
                "关联实验任务",
                experiments.map((e) => ({ value: e.id, label: e.name })),
                "text",
                true,
              )}
              {formField("purpose", "用途 / 备注", undefined, "textarea", true)}
              <Details
                values={{
                  当前库存: material?.quantity,
                  空间: space.name,
                  领用人: p.name,
                }}
              />
            </>
          ) : panel === "库存管理" ? (
            <>
              {formField("quantity", "调整后库存", undefined, "number", true)}
              {formField("threshold", "预警阈值", undefined, "number", true)}
              {formField("purpose", "调整原因", undefined, "textarea")}
            </>
          ) : panel === "新增试剂耗材" ? (
            <div className="v-form-grid">
              {formField("name", "名称", undefined, "text", true)}
              {formField(
                "type",
                "类型",
                ["试剂", "耗材", "其他"],
                "text",
                true,
              )}
              {formField("specification", "规格", undefined, "text", true)}
              {formField("quantity", "库存", undefined, "number", true)}
              {formField("unit", "单位", undefined, "text", true)}
              {formField("location", "存放位置", undefined, "text", true)}
              {formField("threshold", "预警阈值", undefined, "number", true)}
            </div>
          ) : panel === "审批预约" ? (
            <>
              {formField("status", "审批结果", ["已通过", "已拒绝"])}
              {formField("note", "审批说明", undefined, "textarea")}
            </>
          ) : panel === "预约详情" ? (
            (() => {
              const r = s.reservations.find((r) => r.id === form.reservationId);
              return r ? (
                <>
                  <Details
                    values={{
                      设备: s.instruments.find((i) => i.id === r.instrumentId)
                        ?.name,
                      空间: s.spaces.find((x) => x.id === r.spaceId)?.name,
                      申请人: userName(r.ownerId),
                      开始时间: r.start,
                      结束时间: r.end,
                      用途: r.purpose,
                      备注: r.note,
                      状态: r.status,
                    }}
                  />
                  <div className="v-audit">
                    {r.records.map((x, i) => (
                      <p key={i}>{x}</p>
                    ))}
                  </div>
                </>
              ) : null;
            })()
          ) : null}
          {error && <Alert>{error}</Alert>}
        </div>
      </Modal>
    </>
  );
}
