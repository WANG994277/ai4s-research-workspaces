"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  seed,
  makePlan,
  makeTask,
  uid,
  dateNow,
  demoPoints,
  stages,
} from "./seed";
import type {
  DoState,
  Plan,
  Booking,
  Task,
  Sample,
  Equipment,
  Result,
  Transfer,
} from "./types";

interface Actions {
  reset: () => void;
  createPlan: (
    goal: string,
    projectId: string,
    project: string,
    template?: string,
  ) => string;
  updatePlan: (id: string, patch: Partial<Plan>) => void;
  confirmParameters: (id: string) => void;
  review: (id: string, action: string, content: string) => void;
  finalize: (id: string) => boolean;
  newVersion: (id: string) => string;
  createTask: (planId: string) => string;
  updateTask: (id: string, patch: Partial<Task>) => void;
  dispatch: (id: string) => boolean;
  advance: (id: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => boolean;
  terminate: (id: string, reason: string) => void;
  raiseException: (id: string, description: string) => void;
  resolveException: (id: string, resolution: string) => void;
  changeParameter: (
    id: string,
    name: string,
    value: string,
    reason: string,
  ) => boolean;
  book: (data: Omit<Booking, "id" | "status">) => string;
  setBookingStatus: (id: string, status: string) => void;
  addSample: (data: Omit<Sample, "id">) => string;
  updateSample: (id: string, patch: Partial<Sample>) => void;
  addEquipment: (data: Omit<Equipment, "id">) => void;
  addResult: (data: Omit<Result, "id">) => string;
  updateResult: (id: string, patch: Partial<Result>) => void;
  addTransfer: (data: Omit<Transfer, "id" | "time">) => void;
}
const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
export function bookingError(
  data: Omit<Booking, "id" | "status">,
  state: DoState,
): string {
  const eq = state.equipment.find((e) => e.id === data.equipmentId);
  if (!eq || ["维护中", "停用"].includes(eq.status))
    return "设备维护中或已停用，请选择其他设备。";
  if (!data.date || data.start < 8 || data.end > 18 || data.start >= data.end)
    return "请选择 08:00–18:00 内的有效时段。";
  const weekday = new Date(`${data.date}T12:00:00`).getDay();
  if (!Number.isFinite(weekday) || [0, 6].includes(weekday))
    return "设备仅在工作日开放，请选择周一至周五。";
  if (
    !data.owner.trim() ||
    !data.purpose.trim() ||
    !data.sampleId ||
    !data.planId
  )
    return "请完整填写方案、样品、负责人和实验用途。";
  if (
    !state.plans.some(
      (p) =>
        p.id === data.planId &&
        p.projectId === data.projectId &&
        p.status === "已定版",
    )
  )
    return "请选择当前课题的已定版方案。";
  if (
    !state.samples.some(
      (s) => s.id === data.sampleId && s.projectId === data.projectId,
    )
  )
    return "请选择当前课题的样品。";
  if (
    state.bookings.some(
      (b) =>
        b.equipmentId === data.equipmentId &&
        b.date === data.date &&
        !["已取消", "已过期"].includes(b.status) &&
        data.start < b.end &&
        data.end > b.start,
    )
  )
    return "所选时段存在预约冲突，请重新选择。";
  return "";
}
export function dispatchErrors(t: Task, state: DoState): string[] {
  const p = state.plans.find((p) => p.id === t.planId);
  const sampleCount = state.samples
    .filter(
      (s) =>
        t.sampleIds.includes(s.id) &&
        ["已制备", "待实验", "实验中"].includes(s.status),
    )
    .reduce((n, s) => n + s.quantity, 0);
  return [
    p?.status !== "已定版" ? "方案尚未定版" : "",
    sampleCount < (p?.sampleCount ?? 1)
      ? `可用样品不足，需要 ${p?.sampleCount ?? 1} 份`
      : "",
    !state.bookings.some(
      (b) =>
        b.taskId === t.id &&
        b.equipmentId === t.equipmentId &&
        t.sampleIds.includes(b.sampleId) &&
        b.status === "已确认",
    )
      ? "仪器预约尚未确认"
      : "",
    !t.owner.trim() ? "未指定负责人" : "",
    t.checks.length < 4 ? "实验前人工确认未完成" : "",
    !state.equipment.some(
      (e) => e.id === t.equipmentId && !["维护中", "停用"].includes(e.status),
    )
      ? "设备维护中、停用或尚未匹配"
      : "",
    ...parameterRangeErrors(t.parameters, t.equipmentId, state.equipment),
  ].filter(Boolean);
}
export function parameterRangeErrors(
  parameters: Plan["parameters"],
  equipmentId: string,
  equipment: Equipment[],
): string[] {
  const eq = equipment.find((e) => e.id === equipmentId);
  if (!eq) return ["设备尚未匹配"];
  const limits = parameters.flatMap((p) => {
    const unit = p.unit === "℃" ? "℃" : p.unit === "MPa" ? "MPa" : null;
    if (!unit) return [];
    const range = eq.range.match(
      new RegExp(
        `(-?\\d+(?:\\.\\d+)?)\\s*[–-]\\s*(\\d+(?:\\.\\d+)?)\\s*${unit}`,
      ),
    );
    if (!range) return [];
    const values = p.value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];
    return values.some((v) => v < Number(range[1]) || v > Number(range[2]))
      ? [`${p.name}超出设备量程（${range[1]}–${range[2]} ${unit}）`]
      : [];
  });
  return limits;
}
export const useDoStore = create<DoState & Actions>()(
  persist(
    (set, get) => ({
      ...seed(),
      reset: () => set(seed()),
      createPlan: (goal, projectId, project, template) => {
        const p = makePlan(goal, projectId, project, template);
        set((s) => ({ plans: [p, ...s.plans] }));
        return p.id;
      },
      updatePlan: (id, patch) =>
        set((s) => ({
          plans: s.plans.map((p) =>
            p.id === id && p.status !== "已定版"
              ? {
                  ...p,
                  ...patch,
                  id,
                  familyId: p.familyId,
                  updatedAt: dateNow(),
                }
              : p,
          ),
        })),
      confirmParameters: (id) => {
        const p = get().plans.find((p) => p.id === id);
        if (p)
          get().updatePlan(id, {
            parameters: p.parameters.map((v) => ({ ...v, confirmed: true })),
          });
      },
      review: (id, action, content) => {
        const p = get().plans.find((p) => p.id === id);
        if (!p || p.status === "已定版" || !content.trim()) return;
        get().updatePlan(id, {
          status:
            action === "发起会签"
              ? "审核中"
              : ["退回", "要求修改"].includes(action)
                ? "已退回"
                : action === "同意"
                  ? "待确认"
                  : "审核中",
          reviews: [
            ...p.reviews,
            {
              action,
              content,
              time: dateNow(),
              author:
                action === "发起会签" ? "张博士" : "王研究员（演示审核人）",
            },
          ],
        });
      },
      finalize: (id) => {
        const p = get().plans.find((p) => p.id === id);
        if (
          !p ||
          !p.parameters.every((v) => v.confirmed) ||
          p.reviews.at(-1)?.action !== "同意" ||
          p.status !== "待确认" ||
          parameterRangeErrors(p.parameters, p.equipmentId, get().equipment)
            .length > 0
        )
          return false;
        get().updatePlan(id, {
          status: "已定版",
          reviews: [
            ...p.reviews,
            {
              action: "确认定版",
              content: "人工确认方案参数、风险与标准要求",
              time: dateNow(),
              author: "张博士",
            },
          ],
        });
        return true;
      },
      newVersion: (id) => {
        const p = get().plans.find((p) => p.id === id);
        if (!p) return "";
        const next = {
          ...structuredClone(p),
          id: uid("PLAN"),
          version:
            Math.max(
              ...get()
                .plans.filter((x) => x.familyId === p.familyId)
                .map((x) => x.version),
            ) + 1,
          status: "草稿" as const,
          reviews: [],
          updatedAt: dateNow(),
          messages: [],
          parameters: p.parameters.map((v) => ({
            ...v,
            confirmed: v.source !== "AI 建议",
          })),
        };
        set((s) => ({ plans: [next, ...s.plans] }));
        return next.id;
      },
      createTask: (planId) => {
        const p = get().plans.find((p) => p.id === planId);
        if (!p || p.status !== "已定版") return "";
        const t = makeTask(p);
        set((s) => ({ tasks: [t, ...s.tasks] }));
        return t.id;
      },
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...patch, id, updatedAt: dateNow() } : t,
          ),
        })),
      dispatch: (id) => {
        const t = get().tasks.find((t) => t.id === id);
        if (
          !t ||
          !["草稿", "待审核"].includes(t.status) ||
          dispatchErrors(t, get()).length
        )
          return false;
        get().updateTask(id, {
          status: "待执行",
          step: 3,
          logs: [
            ...t.logs,
            `${dateNow()} 张博士确认实验前审核与高风险条件，正式下发（模拟）`,
          ],
        });
        return true;
      },
      advance: (id) => {
        const t = get().tasks.find((t) => t.id === id);
        if (
          t &&
          t.step <= 3 &&
          ["待执行", "执行中"].includes(t.status) &&
          dispatchErrors(t, get()).length
        ) {
          get().updateTask(id, {
            status: "已暂停",
            logs: [
              ...t.logs,
              `${dateNow()} 执行条件发生变化：${dispatchErrors(t, get()).join("；")}，请复核后恢复`,
            ],
          });
          return;
        }
        if (
          !t ||
          !["待执行", "执行中"].includes(t.status) ||
          t.exceptions.some((e) => !e.resolved) ||
          (t.step <= 3 && dispatchErrors(t, get()).length > 0)
        )
          return;
        if (t.status === "待执行") {
          get().updateTask(id, {
            status: "执行中",
            logs: [...t.logs, `${dateNow()} 开始实验执行（模拟）`],
          });
          return;
        }
        const step = Math.min(6, t.step + 1);
        let resultId = t.resultId;
        if (step >= 4 && !resultId)
          resultId = get().addResult({
            projectId: t.projectId,
            taskId: t.id,
            sampleId: t.sampleIds[0] ?? "",
            name: `${t.name} · 测量数据`,
            method: "GC",
            points: structuredClone(demoPoints),
            processed: false,
            operations: [],
            report: "",
            confirmed: false,
            createdAt: dateNow(),
          });
        get().updateTask(id, {
          step,
          resultId,
          status: step === 6 ? "已完成" : "执行中",
          logs: [
            ...t.logs,
            `${dateNow()} ${stages[step]}，${step >= 4 ? "测量数据已关联" : ""}`,
          ],
        });
        if (step === 6)
          set((s) => ({
            samples: s.samples.map((v) =>
              t.sampleIds.includes(v.id)
                ? {
                    ...v,
                    status: "已完成",
                    taskId: id,
                    traces: [
                      ...v.traces,
                      `${dateNow()} ${id} 实验完成，转入留样`,
                    ],
                  }
                : v,
            ),
          }));
      },
      pause: (id) => {
        const t = get().tasks.find((t) => t.id === id);
        if (t && ["执行中", "异常"].includes(t.status))
          get().updateTask(id, {
            status: "已暂停",
            logs: [...t.logs, `${dateNow()} 张博士人工确认暂停实验`],
          });
      },
      resume: (id) => {
        const t = get().tasks.find((t) => t.id === id);
        if (
          !t ||
          !["已暂停", "异常"].includes(t.status) ||
          t.exceptions.some((e) => !e.resolved)
        )
          return false;
        get().updateTask(id, {
          status: "执行中",
          logs: [...t.logs, `${dateNow()} 张博士复核后人工确认恢复`],
        });
        return true;
      },
      terminate: (id, reason) => {
        const t = get().tasks.find((t) => t.id === id);
        if (t && reason.trim())
          get().updateTask(id, {
            status: "已终止",
            logs: [...t.logs, `${dateNow()} 张博士终止：${reason}`],
          });
      },
      raiseException: (id, description) => {
        const t = get().tasks.find((t) => t.id === id);
        if (t && t.status === "执行中" && description.trim())
          get().updateTask(id, {
            status: "异常",
            exceptions: [
              ...t.exceptions,
              {
                id: uid("ERR"),
                stage: stages[t.step],
                description,
                resolved: false,
                resolution: "",
                time: dateNow(),
              },
            ],
            logs: [...t.logs, `${dateNow()} 异常：${description}；执行已阻断`],
          });
      },
      resolveException: (id, resolution) => {
        const t = get().tasks.find((t) => t.id === id);
        if (t && resolution.trim())
          get().updateTask(id, {
            status: "已暂停",
            exceptions: t.exceptions.map((e) =>
              e.resolved ? e : { ...e, resolved: true, resolution },
            ),
            logs: [
              ...t.logs,
              `${dateNow()} 张博士人工处置：${resolution}，等待确认恢复`,
            ],
          });
      },
      changeParameter: (id, name, value, reason) => {
        const t = get().tasks.find((t) => t.id === id);
        const v = t?.parameters.find((v) => v.name === name);
        if (
          t &&
          parameterRangeErrors(
            t.parameters.map((p) => (p.name === name ? { ...p, value } : p)),
            t.equipmentId,
            get().equipment,
          ).length
        )
          return false;
        if (
          t &&
          v &&
          value.trim() &&
          reason.trim() &&
          ["执行中", "已暂停"].includes(t.status)
        ) {
          get().updateTask(id, {
            parameters: t.parameters.map((p) =>
              p.name === name
                ? { ...p, value, source: "人工输入", confirmed: true }
                : p,
            ),
            changes: [
              ...t.changes,
              {
                name,
                old: v.value,
                value,
                reason,
                author: "张博士",
                time: dateNow(),
                approved: true,
              },
            ],
            logs: [
              ...t.logs,
              `${dateNow()} 参数变更审批确认：${name} ${v.value} → ${value}，${reason}`,
            ],
          });
          return true;
        }
        return false;
      },
      book: (data) => {
        if (bookingError(data, get())) return "";
        const id = uid("BK");
        set((s) => ({
          bookings: [{ ...data, id, status: "审批中" }, ...s.bookings],
        }));
        return id;
      },
      setBookingStatus: (id, status) =>
        set((s) => ({
          bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
        })),
      addSample: (data) => {
        const id = uid("S");
        set((s) => ({ samples: [{ ...data, id }, ...s.samples] }));
        return id;
      },
      updateSample: (id, patch) =>
        set((s) => ({
          samples: s.samples.map((x) =>
            x.id === id ? { ...x, ...patch, id } : x,
          ),
        })),
      addEquipment: (data) =>
        set((s) => ({
          equipment: [{ ...data, id: uid("EQ") }, ...s.equipment],
        })),
      addResult: (data) => {
        const id = uid("RES");
        set((s) => ({ results: [{ ...data, id }, ...s.results] }));
        return id;
      },
      updateResult: (id, patch) =>
        set((s) => ({
          results: s.results.map((r) =>
            r.id === id ? { ...r, ...patch, id } : r,
          ),
        })),
      addTransfer: (data) =>
        set((s) => ({
          transfers: [
            { ...data, id: uid("FLOW"), time: dateNow() },
            ...s.transfers,
          ],
        })),
    }),
    {
      name: "ai4s-do-space-v1",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? memoryStorage : localStorage,
      ),
    },
  ),
);
