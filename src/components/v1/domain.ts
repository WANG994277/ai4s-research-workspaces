import type { Asset, Profile, Scoped, State, TaskStatus } from "./types";
export const taskLabels: Record<TaskStatus, string> = {
  PLANNING: "规划中",
  RUNNING: "运行中",
  WAITING_HUMAN: "等待人工处理",
  WAITING_RESOURCE: "等待资源",
  PAUSED: "已暂停",
  FAILED: "执行失败",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};
export const spaceLabels = {
  ACTIVE: "正常",
  SUSPENDED: "暂停",
  ARCHIVED: "已归档",
  CLOSED: "已关闭",
};
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
export const now = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 19);
};
export const activeTasks = (s: State) =>
  s.tasks.filter((t) => !["COMPLETED", "CANCELLED"].includes(t.status));
export function hasRole(p: Profile, ...roles: Profile["roles"]) {
  return roles.some((r) => p.roles.includes(r));
}
export function member(s: State, p: Profile, spaceId: string) {
  return s.members.find(
    (m) => m.userId === p.id && m.spaceId === spaceId && m.status === "active",
  );
}
export function canEnter(s: State, p: Profile, spaceId: string) {
  const sp = s.spaces.find((v) => v.id === spaceId);
  return (
    !!sp &&
    (sp.type === "PERSONAL"
      ? sp.ownerId === p.id
      : !!member(s, p, spaceId) &&
        p.projects.includes(sp.projectId) &&
        spacePermission(s, p, spaceId, "view"))
  );
}
export function spacePermission(
  s: State,
  p: Profile,
  spaceId: string,
  permission: string,
) {
  const m = member(s, p, spaceId);
  return (
    !!m &&
    (
      s.rolePermissions[spaceId + ":" + m.role] ??
      s.rolePermissions[m.role] ??
      []
    ).includes(permission)
  );
}
export function writable(s: State, p: Profile, spaceId: string) {
  return (
    canEnter(s, p, spaceId) &&
    s.spaces.find((x) => x.id === spaceId)?.status === "ACTIVE" &&
    spacePermission(s, p, spaceId, "create")
  );
}
export function grant(o: Scoped, p: Profile, spaceId: string) {
  return o.shares.find(
    (g) =>
      (g.targetUser === p.id || g.targetSpace === spaceId) &&
      (!g.validTo || new Date(g.validTo + "T23:59:59").getTime() > Date.now()),
  );
}
export function canRead(o: Scoped, p: Profile, spaceId: string, s: State) {
  if (o.denied?.includes(p.id)) return false;
  if (o.visibility === "PUBLIC") return true;
  // Owning a private conversation never gives managers access to somebody else's session.
  if (o.ownerId === p.id) return true;
  if ("messages" in o) {
    return (
      (o.visibility === "SHARED" || o.visibility === "COLLABORATIVE") &&
      !!grant(o, p, spaceId) &&
      canEnter(s, p, spaceId)
    );
  }
  if (!p.projects.includes(o.projectId)) return false;
  if (
    grant(o, p, spaceId) &&
    canEnter(s, p, spaceId) &&
    spacePermission(s, p, spaceId, "view")
  )
    return true;
  if (o.visibility === "PRIVATE") return false;
  if (
    hasRole(p, "manager", "decision") &&
    p.managementProjects.includes(o.projectId)
  )
    return true;
  if (o.visibility === "PROJECT")
    return canEnter(s, p, spaceId) && spacePermission(s, p, spaceId, "view");
  return (
    o.spaceId === spaceId &&
    !!member(s, p, spaceId) &&
    spacePermission(s, p, spaceId, "view")
  );
}
export function canUse(o: Scoped, p: Profile, spaceId: string, s: State) {
  if (
    !hasRole(p, "researcher", "leader", "analyst") ||
    !writable(s, p, spaceId) ||
    !canRead(o, p, spaceId, s)
  )
    return false;
  if (
    "lifecycle" in o &&
    (["已归档", "已下架"].includes(String(o.lifecycle)) ||
      s.spaces.some((sp) => sp.id === o.spaceId && sp.status !== "ACTIVE"))
  )
    return false;
  if ("availability" in o && o.availability !== "可用") return false;
  if ("authorization" in o && o.authorization !== "已连接") return false;
  const g = grant(o, p, spaceId);
  const intrinsic =
    o.ownerId === p.id ||
    o.visibility === "PUBLIC" ||
    o.visibility === "PROJECT" ||
    (o.visibility === "SPACE" && o.spaceId === spaceId);
  if (!intrinsic && g?.level === "只读") return false;
  return true;
}
export function canEdit(o: Scoped, p: Profile, spaceId: string, s: State) {
  if (
    !hasRole(p, "researcher", "leader", "analyst") ||
    !canRead(o, p, spaceId, s) ||
    !writable(s, p, spaceId)
  )
    return false;
  if (s.spaces.some((sp) => sp.id === o.spaceId && sp.status !== "ACTIVE"))
    return false;
  return (
    o.ownerId === p.id ||
    grant(o, p, spaceId)?.level === "可协作" ||
    ("participants" in o &&
      Array.isArray(o.participants) &&
      o.participants.includes(p.id))
  );
}
export function canManageSpace(s: State, p: Profile, spaceId: string) {
  return (
    (hasRole(p, "admin", "manager") &&
      p.managementProjects.includes(
        s.spaces.find((x) => x.id === spaceId)?.projectId ?? "",
      )) ||
    (!!member(s, p, spaceId) &&
      member(s, p, spaceId)?.role === "Space Admin" &&
      spacePermission(s, p, spaceId, "configure"))
  );
}
export function canShare(o: Scoped, p: Profile, spaceId: string, s: State) {
  const m = member(s, p, spaceId);
  const configured = m ? s.rolePermissions[spaceId + ":" + m.role] : undefined;
  return (
    canEdit(o, p, spaceId, s) && (!configured || configured.includes("share"))
  );
}
export function permissionLabel(
  o: Scoped,
  p: Profile,
  spaceId: string,
  s: State,
) {
  if (o.ownerId === p.id) return "所有者";
  return (
    grant(o, p, spaceId)?.level ??
    (canUse(o, p, spaceId, s) ? "可引用" : "只读")
  );
}
export function needsTask(text: string, mode: string) {
  return (
    mode === "深度研究" ||
    /多步|持续|异步|模拟|实验|形成.*报告|调研.*进展|长期|方案/.test(text)
  );
}
export function reservationError(
  s: State,
  instrumentId: string,
  start: string,
  end: string,
  ignoreId = "",
) {
  if (
    !start ||
    !end ||
    !Number.isFinite(Date.parse(start)) ||
    !Number.isFinite(Date.parse(end)) ||
    start >= end
  )
    return "结束时间必须晚于开始时间。";
  const i = s.instruments.find((x) => x.id === instrumentId);
  if (
    !i ||
    !i.sharing ||
    i.online === "离线" ||
    ["故障", "维护中"].includes(i.runtime)
  )
    return "当前设备不可预约。";
  if (
    s.reservations.some(
      (r) =>
        r.id !== ignoreId &&
        r.instrumentId === instrumentId &&
        !["已取消", "已拒绝", "已完成"].includes(r.status) &&
        start < r.end &&
        end > r.start,
    )
  )
    return "当前时间段已被预约，请选择其他时间。";
  return "";
}
export function transitionTask(status: TaskStatus, action: string): TaskStatus {
  const transitions: Partial<Record<TaskStatus, Record<string, TaskStatus>>> = {
    PLANNING: { start: "RUNNING", cancel: "CANCELLED" },
    RUNNING: { pause: "PAUSED", cancel: "CANCELLED" },
    WAITING_HUMAN: { confirm: "RUNNING", cancel: "CANCELLED" },
    WAITING_RESOURCE: { retry: "RUNNING", cancel: "CANCELLED" },
    PAUSED: { resume: "RUNNING", cancel: "CANCELLED" },
    FAILED: { retry: "RUNNING", cancel: "CANCELLED" },
  };
  const next = transitions[status]?.[action];
  if (!next) throw new Error("当前状态不允许此操作。");
  return next;
}
export function canCloseSpace(s: State, spaceId: string) {
  if (
    s.tasks.some(
      (t) =>
        t.spaceId === spaceId && !["COMPLETED", "CANCELLED"].includes(t.status),
    ) ||
    s.experiments.some(
      (e) => e.spaceId === spaceId && !["已完成", "已取消"].includes(e.status),
    )
  )
    return "空间存在未完成的科研或实验任务，请先处理。";
  if (
    s.assets.some(
      (a) =>
        a.spaceId === spaceId &&
        a.shares.some((g) => !g.validTo || Date.parse(g.validTo) > Date.now()),
    )
  )
    return "空间仍有有效共享关系，请先核对共享影响。";
  return "";
}
export function canRemoveMember(s: State, spaceId: string, userId: string) {
  const sp = s.spaces.find((x) => x.id === spaceId);
  if (sp?.ownerId === userId) return "请先转移空间负责人。";
  const admins = s.members.filter(
    (m) =>
      m.spaceId === spaceId &&
      m.status === "active" &&
      m.role === "Space Admin",
  );
  if (admins.length === 1 && admins[0].userId === userId)
    return "不能移除唯一空间管理员。";
  if (
    s.tasks.some(
      (t) =>
        t.spaceId === spaceId &&
        t.ownerId === userId &&
        !["COMPLETED", "CANCELLED"].includes(t.status),
    ) ||
    s.decisions.some(
      (d) =>
        d.assignee === userId &&
        d.status === "pending" &&
        s.tasks.some((t) => t.id === d.taskId && t.spaceId === spaceId),
    )
  )
    return "成员存在未完成任务或待处理事项。";
  if (
    s.assets.some(
      (a) =>
        a.spaceId === spaceId &&
        a.ownerId === userId &&
        a.lifecycle !== "已归档",
    )
  )
    return "请先转移成员的关键资产。";
  return "";
}
export function published(s: State, type: Asset["type"]) {
  return s.assets.filter(
    (a) =>
      a.type === type &&
      a.publishStatus === "已发布" &&
      a.lifecycle !== "已归档",
  );
}
export function scopeKey(p: Profile, spaceId: string) {
  return `${p.id}:${spaceId}`;
}

export function executionBlockReason(
  s: State,
  task: State["tasks"][number],
  actor: Profile,
) {
  if (!writable(s, actor, task.spaceId))
    return "任务所属空间已暂停、归档，或执行权限已失效。";
  if (
    s.experiments.some(
      (e) => e.taskId === task.id && !["已完成", "已取消"].includes(e.status),
    )
  )
    return "等待关联实验完成并确认结果。";
  for (const id of [...task.contextIds, ...task.capabilityIds]) {
    const o = [...s.assets, ...s.tools, ...s.knowledge, ...s.artifacts].find(
      (x) => x.id === id,
    );
    if (
      o &&
      ("availability" in o
        ? !canUse(o, actor, task.spaceId, s)
        : !canRead(o, actor, task.spaceId, s))
    )
      return "任务引用的资源权限或可用状态已变化，请重新确认。";
  }
  return "";
}
