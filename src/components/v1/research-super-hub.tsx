"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useResearch } from "./store";
import type { ResearchSuperHubSource } from "./research-super-hub-source";

type HubWindow = Window & {
  enterHub?: () => void;
  selectMode?: (mode: string) => void;
  renderMemberAvatars?: () => void;
  enterTaskWorkspace?: () => void;
  hubOpenTask?: (element: HTMLElement | null, name: string, steps: number) => void;
  __hubNavigateToTasks?: () => void;
};

const hostOverrides = `
  .research-super-hub-host, .research-super-hub-host * { box-sizing: border-box; }
  .research-super-hub-host { height: calc(100dvh - 80px); margin: 0 -24px -36px; overflow: hidden; }
  .research-super-hub-host > div { height: 100%; min-height: 0; }
  .research-super-hub-host #page-hub { display: flex !important; width: 100%; height: 100% !important; }
  .research-super-hub-host .hb2-main { width: 100%; min-width: 0; }
  .research-super-hub-host #hub-three-pane > div:first-child { width: 320px !important; }
  .research-super-hub-host #hub-three-pane > div:last-child { width: 360px !important; }
  .research-super-hub-host #hub-tree-name,
  .research-super-hub-host .hub-folder [data-open] > span {
    overflow: visible !important;
    text-overflow: clip !important;
  }
  .research-super-hub-host #hub-plan-body b,
  .research-super-hub-host #hub-plan-body small {
    white-space: normal !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }
  .research-super-hub-host .sidebar, .research-super-hub-host .top-header { display: none !important; }
  .research-super-hub-host textarea:focus,
  .research-super-hub-host input:focus,
  .research-super-hub-host select:focus,
  .research-super-hub-host textarea:focus-visible,
  .research-super-hub-host input:focus-visible,
  .research-super-hub-host select:focus-visible {
    outline: none !important;
    box-shadow: none !important;
  }
  .research-super-hub-host .cmp-card:focus-within,
  .research-super-hub-host .chat-box:focus-within,
  .research-super-hub-host .hd-search:focus-within,
  .research-super-hub-host .aiqa-input-row:focus-within {
    border-color: #DDE3EC !important;
    box-shadow: 0 6px 24px rgba(30, 80, 160, 0.05) !important;
  }
  .research-super-hub-host .np-input:focus,
  .research-super-hub-host .np-ta:focus {
    border-color: #E5E7EB !important;
    box-shadow: none !important;
  }
`;

function invokeLegacyInitialization(view: "home" | "tasks", taskName?: string, _steps = 1) {
  const home = document.getElementById("hub-home");
  const detail = document.getElementById("hub-detail");
  const singlePane = document.getElementById("hub-single-pane");
  const threePane = document.getElementById("hub-three-pane");
  if (view === "home") {
    if (home) home.style.display = "flex";
    if (detail) detail.style.display = "none";
    return;
  }
  if (home) home.style.display = "none";
  if (detail) detail.style.display = "flex";
  if (singlePane) singlePane.style.display = "none";
  if (threePane) threePane.style.display = "flex";
  const rows = [...document.querySelectorAll<HTMLElement>(".hub-sess")];
  const target = rows.find((row) => row.dataset.sess === taskName) ?? rows[0];
  target?.click();
}

function renderRoutedTaskConversation(
  taskName: string,
  messages: { id: string; role: "user" | "assistant"; text: string }[],
) {
  const area = document.getElementById("hub-chat-area");
  if (!area || !messages.length) return;
  area.replaceChildren();
  for (const message of messages) {
    const row = document.createElement("div");
    Object.assign(row.style, {
      display: "flex",
      gap: "10px",
      marginBottom: "16px",
      justifyContent: message.role === "user" ? "flex-end" : "flex-start",
    });
    if (message.role === "assistant") {
      const avatar = document.createElement("span");
      avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
      Object.assign(avatar.style, {
        width: "28px",
        height: "28px",
        flexShrink: "0",
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        background: "#EFF6FF",
        color: "#2563EB",
        fontSize: "11px",
      });
      row.appendChild(avatar);
    }
    const bubble = document.createElement("div");
    bubble.textContent = message.text;
    Object.assign(bubble.style, {
      maxWidth: message.role === "user" ? "70%" : "78%",
      padding: "11px 16px",
      borderRadius: message.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
      border: message.role === "user" ? "0" : "1.5px solid #E5E7EB",
      background: message.role === "user" ? "#2563EB" : "#fff",
      color: message.role === "user" ? "#fff" : "#374151",
      fontSize: "13px",
      lineHeight: "1.7",
      whiteSpace: "pre-wrap",
    });
    row.appendChild(bubble);
    area.appendChild(row);
  }
  area.scrollTop = area.scrollHeight;

  const sessionName = document.getElementById("hub-session-name");
  if (sessionName) sessionName.textContent = taskName;
  const firstFolder = document.querySelector(".hub-fold-body");
  if (firstFolder) {
    document.querySelectorAll(".hub-sess").forEach((row) => row.classList.remove("active"));
    let taskRow = firstFolder.querySelector<HTMLElement>('[data-routed-task="true"]');
    if (!taskRow) {
      taskRow = document.createElement("div");
      taskRow.className = "hub-sess";
      taskRow.dataset.routedTask = "true";
      taskRow.innerHTML = '<span class="hub-sess-dot"></span><span class="hub-sess-lbl"></span>';
      firstFolder.prepend(taskRow);
    }
    taskRow.dataset.sess = taskName;
    taskRow.classList.add("active");
    const label = taskRow.querySelector(".hub-sess-lbl");
    if (label) label.textContent = taskName;
  }
}

export function ResearchSuperHub({
  css,
  markup,
  runtime,
  initialView = "home",
}: ResearchSuperHubSource & { initialView?: "home" | "tasks" }) {
  const router = useRouter();
  const query = useSearchParams();
  const { s } = useResearch();
  const taskId = query.get("task");
  const sessionPreset = query.get("session");
  const routedTask = taskId ? s.tasks.find((task) => task.id === taskId) : undefined;
  const routedSession = routedTask
    ? s.sessions.find((session) => session.taskId === routedTask.id)
    : undefined;

  useEffect(() => {
    if (!document.head.querySelector("link[data-research-super-hub-icons]")) {
      const icons = document.createElement("link");
      icons.rel = "stylesheet";
      icons.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css";
      icons.dataset.researchSuperHubIcons = "true";
      document.head.appendChild(icons);
    }

    const initialize = () => {
      const hubWindow = window as HubWindow;
      if (taskId) {
        invokeLegacyInitialization("tasks", routedTask?.name, routedTask?.steps.length ?? 1);
        if (routedTask) {
          renderRoutedTaskConversation(routedTask.name, routedSession?.messages ?? []);
        }
      } else if (sessionPreset === "rubber-formula") {
        invokeLegacyInitialization("tasks", "橡胶配方与性能预测", 5);
      } else {
        invokeLegacyInitialization(initialView);
      }

      if (initialView === "home") {
        let navigationQueued = false;
        hubWindow.__hubNavigateToTasks = () => {
          if (navigationQueued) return;
          navigationQueued = true;
          router.push("/research-spaces/current/tasks");
        };
      } else {
        delete hubWindow.__hubNavigateToTasks;
      }
    };

    if (!document.getElementById("research-super-hub-runtime")) {
      const script = document.createElement("script");
      script.id = "research-super-hub-runtime";
      script.src = "/api/research-super-hub-runtime?v=5";
      script.async = false;
      script.addEventListener("load", initialize, { once: true });
      document.body.appendChild(script);
    } else {
      initialize();
    }
    return () => {
      if (initialView === "home") delete (window as HubWindow).__hubNavigateToTasks;
    };
  }, [initialView, routedSession, routedTask, router, runtime, sessionPreset, taskId]);

  return (
    <section className="research-super-hub-host" aria-label="科研超级中枢">
      <style dangerouslySetInnerHTML={{ __html: `${css}\n${hostOverrides}` }} />
      <div dangerouslySetInnerHTML={{ __html: markup }} />
    </section>
  );
}
