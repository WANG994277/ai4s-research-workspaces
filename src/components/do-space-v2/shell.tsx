"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  FlaskConical,
  Files,
  TestTubes,
  Microscope,
  CalendarDays,
  ClipboardList,
  ChartNoAxesCombined,
  RotateCcw,
} from "lucide-react";
import { useDoStore } from "./store";
import { useResearchProject } from "@/components/research/workspace-kit";
import { Button, Confirm } from "./ui";
import { PrdTools, requirementSections } from "./requirements";
import "./do-space.css";
const nav = [
  ["开始实验设计", "", FlaskConical],
  ["实验方案", "plans", Files],
  ["样品与记录", "samples", TestTubes],
  ["实验设备", "equipment", Microscope],
  ["仪器预约", "bookings", CalendarDays],
  ["实验管理", "tasks", ClipboardList],
  ["表征分析", "analysis", ChartNoAxesCombined],
] as const;
export function DoShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { href } = useResearchProject();
  const [ready, setReady] = useState(false);
  const [reset, setReset] = useState(false);
  const [inspect, setInspect] = useState(false);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.resolve(useDoStore.persist.rehydrate())
      .catch(() => setError("本地记录无法读取，已载入初始演示数据。"))
      .finally(() => setReady(true));
  }, []);
  const part = path.split("/")[2] || "";
  const ids: Record<string, string> = {
    "": "DO-HOME",
    agent: "DO-AGENT",
    plans: "DO-PLAN",
    orchestrate: "DO-ORCHESTRATE",
    samples: "DO-SAMPLES",
    equipment: "DO-EQUIPMENT",
    bookings: "DO-BOOKINGS",
    tasks: "DO-TASKS",
    analysis: "DO-ANALYSIS",
  };
  const pageId = ids[part] || "DO-HOME";
  return (
    <div
      className={`do-space ${inspect ? "do-inspect" : ""}`}
      onClickCapture={(event) => {
        if (
          !inspect ||
          (event.target as HTMLElement).closest('[role="dialog"]')
        )
          return;
        const id = (event.target as HTMLElement)
          .closest("[data-prd-id]")
          ?.getAttribute("data-prd-id");
        if (id && requirementSections[id]) {
          event.preventDefault();
          event.stopPropagation();
          setSelected(id);
        }
      }}
    >
      <nav className="do-subnav" aria-label="做空间工作台">
        {nav.map(([name, route, Icon]) => (
          <Link
            key={name}
            data-prd-id={route ? ids[route] : "DO-HOME"}
            href={href(`/do-space${route ? `/${route}` : ""}`)}
            className={
              part === route ||
              (!route && part === "agent") ||
              (route === "tasks" && part === "orchestrate")
                ? "active"
                : ""
            }
          >
            <Icon size={14} />
            {name}
          </Link>
        ))}
        <span className="do-env">
          <i />
          本地演示环境
        </span>
      </nav>
      {error && <p role="alert">{error}</p>}
      {inspect && (
        <p className="do-note" style={{ marginBottom: 18 }}>
          需求检查已开启：点击功能区域可查看、编辑和导出对应 PRD
          章节。退出后继续业务演示。
        </p>
      )}
      <div
        onClickCapture={(event) => {
          if (!inspect) return;
          const target = (event.target as HTMLElement).closest("[data-prd-id]");
          const id = target?.getAttribute("data-prd-id");
          if (id && requirementSections[id]) {
            event.preventDefault();
            event.stopPropagation();
            setSelected(id);
          }
        }}
        data-prd-id={pageId}
      >
        {ready ? (
          children
        ) : (
          <div className="do-empty" role="status">
            正在恢复实验工作区…
          </div>
        )}
      </div>
      <footer className="do-bottom">
        <PrdTools
          pageId={pageId}
          inspect={inspect}
          onInspect={() => setInspect((v) => !v)}
          selected={selected}
          onClose={() => setSelected("")}
        />
        <Button variant="ghost" onClick={() => setReset(true)}>
          <RotateCcw />
          重置演示
        </Button>
      </footer>
      <Confirm
        open={reset}
        onClose={() => setReset(false)}
        title="重置做空间演示"
        onConfirm={() => {
          useDoStore.getState().reset();
          window.location.assign(href("/do-space"));
        }}
      >
        <p>
          清除本浏览器内新建的做空间方案、任务、预约与结果，恢复初始示例。此操作无法撤销。
        </p>
      </Confirm>
    </div>
  );
}
