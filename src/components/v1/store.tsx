"use client";
import { useEffect, useSyncExternalStore } from "react";
import {
  createSeed,
  normalizeLegacyDemoState,
  normalizeLegacyRoleState,
  profiles,
} from "./seed";
import {
  executionBlockReason,
  canEdit,
  canManageSpace,
  canRead,
  canUse,
  now,
  scopeKey,
  uid,
} from "./domain";
import type { Profile, State } from "./types";
const key = "ai4s-v1-baseline-20260924";
const initial = createSeed();
let state = initial;
let ready = false;
let message = "";
const listeners = new Set<() => void>();
function hydrate() {
  if (ready) return;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed.schema === 1 &&
        Array.isArray(parsed.assets) &&
        Array.isArray(parsed.members)
      ) {
        state = normalizeLegacyDemoState(normalizeLegacyRoleState(parsed));
        localStorage.setItem(key, JSON.stringify(state));
      }
      else message = "旧版数据格式未加载，已使用本地示例。";
    }
  } catch {
    message = "本地数据无法读取，已加载示例；原存储未覆盖。";
  }
  ready = true;
  emit();
}
const subscribe = (f: () => void) => {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
};
const emit = () => listeners.forEach((f) => f());
export function notify(text: string) {
  message = text;
  emit();
}
export function transact(
  action: string,
  objectId: string,
  update: (draft: State, p: Profile) => void,
) {
  try {
    const next = structuredClone(state);
    const p = currentProfile(next);
    update(next, p);
    if (action)
      next.audit.push({
        id: uid("audit"),
        action,
        objectId,
        userId: p.id,
        at: now(),
      });
    localStorage.setItem(key, JSON.stringify(next));
    state = next;
    if (action) message = action;
    emit();
    return true;
  } catch (e) {
    notify(e instanceof Error ? e.message : "保存失败，请重试。");
    return false;
  }
}
export function currentProfile(s: State): Profile {
  const p = profiles[s.profileKey] ?? profiles.researcher;
  const merged = {
    ...p,
    roles: [...new Set([...(s.userRoles?.[p.id] ?? p.roles), ...s.extraRoles])],
  };
  return {
    ...merged,
    grants: [
      ...new Set([
        ...p.grants,
        ...(s.spaces.some((sp) => canManageSpace(s, merged, sp.id))
          ? ["space-management"]
          : []),
      ]),
    ],
  };
}
export function useResearch() {
  const s = useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
  const loaded = useSyncExternalStore(
    subscribe,
    () => ready,
    () => false,
  );
  const toast = useSyncExternalStore(
    subscribe,
    () => message,
    () => "",
  );
  const p = currentProfile(s);
  const space =
    s.spaces.find((v) => v.id === s.spaceId) ??
    s.spaces.find((v) => v.id === "personal-" + p.id)!;
  return {
    s,
    p,
    space,
    loaded,
    toast,
    mutate: transact,
    key: scopeKey(p, space.id),
  };
}
export function ResearchRuntime() {
  useEffect(() => {
    const hydrationTimer = window.setTimeout(hydrate, 100);
    const timer = setInterval(() => {
      const due = state.tasks.filter(
        (t) => t.status === "RUNNING" && t.runAt && t.runAt < Date.now(),
      );
      if (!due.length) return;
      transact("科研任务已完成", due.map((t) => t.id).join(","), (draft) => {
        for (const item of due) {
          const t = draft.tasks.find((x) => x.id === item.id)!;
          const actor = Object.values(profiles).find((u) => u.id === t.ownerId);
          const block = actor
            ? executionBlockReason(draft, t, actor)
            : "任务执行人不可用。";
          if (block) {
            t.status = "WAITING_RESOURCE";
            t.reason = block;
            t.runAt = undefined;
            continue;
          }
          t.status = "COMPLETED";
          t.completedAt = now();
          t.updatedAt = now();
          t.runAt = undefined;
          t.steps.forEach((x) => {
            x.status = "completed";
            x.completedAt = now();
          });
          const id = uid("artifact");
          draft.artifacts.unshift({
            id,
            name: t.name + " · 研究产出",
            ownerId: t.ownerId,
            projectId: t.projectId,
            spaceId: t.spaceId,
            visibility: t.visibility,
            shares: [],
            updatedAt: now(),
            type: "研究方案",
            taskId: t.id,
            sessionId: t.sessionIds[0] ?? "",
            stepId: t.steps.at(-1)?.id ?? "",
            version: "V1.0",
            status: "待确认",
            content:
              "已完成本地模拟执行。研究结构：输入资料核对 → 参数分析 → 结果复核。示例输出不构成真实科研结论。",
            references: [...t.contextIds, ...t.capabilityIds],
          });
          t.steps.at(-1)?.outputIds.push(id);
        }
      });
    }, 1000);
    return () => {
      window.clearTimeout(hydrationTimer);
      clearInterval(timer);
    };
  }, []);
  return null;
}
export function addContext(ids: string[], capability = false, taskId?: string) {
  return transact(
    taskId ? "已加入当前研究" : "已加入科研上下文",
    ids.join(","),
    (s, p) => {
      const allowed = ids.filter((id) => {
        const o = [
          ...s.assets,
          ...s.tools,
          ...s.knowledge,
          ...s.artifacts,
          ...s.sessions,
        ].find((x) => x.id === id);
        return (
          o &&
          (capability || "publishStatus" in o || "authorization" in o
            ? canUse(o, p, s.spaceId, s)
            : canRead(o, p, s.spaceId, s))
        );
      });
      if (allowed.length !== ids.length)
        throw new Error("部分对象无引用权限或暂不可用，请重新选择。");
      if (taskId) {
        const t = s.tasks.find((x) => x.id === taskId);
        if (!t || t.spaceId !== s.spaceId || !canEdit(t, p, s.spaceId, s))
          throw new Error("当前科研任务不可修改。");
        const field = capability ? "capabilityIds" : "contextIds";
        t[field] = [...new Set([...t[field], ...ids])];
      } else {
        const k = scopeKey(p, s.spaceId);
        const target = capability ? s.pendingCapabilities : s.pendingContext;
        target[k] = [...new Set([...(target[k] ?? []), ...ids])];
      }
    },
  );
}
